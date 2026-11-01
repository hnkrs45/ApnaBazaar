import Razorpay from 'razorpay';
import PRODUCT from "../models/product.js";
import ORDER from "../models/order.js";
import crypto from 'crypto';
import 'dotenv/config';
import USER from '../models/user.js';
import { generateOrderId } from '../services/generateOrderId.js';
import { sendOrderConfirmation } from '../emails/sendMail.js';

// ── Safe Razorpay instance getter (never crashes on startup if env var missing) ──
const getRazorpayInstance = () => {
  const key_id =
    process.env.RAZORPAY_ID_KEY ||
    process.env.RAZORPAY_KEY_ID ||
    "rzp_test_placeholder";
  const key_secret =
    process.env.RAZORPAY_SECRET_KEY ||
    process.env.RAZORPAY_KEY_SECRET ||
    "dummy_secret_key";
  return new Razorpay({ key_id, key_secret });
};

export const CreateOrder = async (req, res) => {
  try {
    const { user, items, shippingAddress, paymentMethod, deliveryMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order must contain at least one item" });
    }

    // ── Fix B15: Batch-fetch all products in ONE query (no N+1) ──
    const productIds = items.map(item => item.productID || item.productId || item._id || item.product);
    const productDocs = await PRODUCT.find({ _id: { $in: productIds } });
    const productMap = new Map(productDocs.map(p => [p._id.toString(), p]));

    let totalAmount = 0;
    const finalItems = [];

    for (const item of items) {
      const pId = (item.productID || item.productId || item._id || item.product)?.toString();
      const product = productMap.get(pId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found for ID ${pId}` });
      }
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price || product.price) || 0;
      totalAmount += price * quantity;
      finalItems.push({ product: product._id, quantity, price });
    }

    let delivery = totalAmount >= 499 ? 0 : 40;
    totalAmount += (totalAmount * 2) / 100; // 2% platform fee
    if (deliveryMethod === 'Express') delivery = 60;
    totalAmount += delivery;
    totalAmount = Math.round(totalAmount * 100) / 100;

    const userId = user?._id || req.user?._id;

    if (paymentMethod === 'COD') {
      const newOrderData = {
        orderId: generateOrderId(),
        user: userId,
        items: finalItems,
        shippingAddress,
        deliveryMethod: deliveryMethod || "Standard",
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        orderStatus: 'Processing',
        trackingHistory: [{
          status: 'Processing',
          timestamp: Date.now(),
          comment: "Order placed successfully (Cash on Delivery)"
        }],
        totalAmount
      };

      const newOrder = new ORDER(newOrderData);
      await newOrder.save();

      // Deduct stock
      for (const item of finalItems) {
        await PRODUCT.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }

      if (shippingAddress?.remember) {
        await USER.findByIdAndUpdate(userId, {
          $push: { orders: newOrder._id },
          $addToSet: { addresses: shippingAddress }
        }, { new: true });
      } else {
        await USER.findByIdAndUpdate(userId, { $push: { orders: newOrder._id } }, { new: true });
      }

      try {
        await sendOrderConfirmation(
          shippingAddress?.email || user?.email,
          shippingAddress?.name || user?.name,
          newOrderData.orderId,
          items,
          newOrderData.totalAmount
        );
      } catch (mailErr) {
        console.error("Mail send error:", mailErr.message);
      }

      return res.status(200).json({
        success: true,
        message: "Order saved successfully",
        orderid: newOrder._id,
        orderId: newOrder.orderId
      });
    }

    // ── Online payment via Razorpay ──
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required for online payment" });
    }

    const orderId = generateOrderId();
    const orderOptions = {
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: orderId
    };

    // ── Fix B02: use 'instance' (the correct variable name) ──
    const order = await getRazorpayInstance().orders.create(orderOptions);
    return res.json({
      success: true,
      key_id: process.env.RAZORPAY_ID_KEY,
      amount: order.amount,
      order_id: order.id,
      product_name: items[0]?.name?.en || items[0]?.name || "ApnaBazaar Order",
      description: "Order payment for ApnaBazaar",
      contact: shippingAddress?.phone || user?.phone,
      name: shippingAddress?.name || user?.name,
      email: shippingAddress?.email || user?.email
    });
  } catch (error) {
    console.error("CreateOrder error:", error);
    const isProduction = process.env.NODE_ENV === "production";
    return res.status(500).json({
      success: false,
      message: isProduction ? "Order creation failed. Please try again." : error.message
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { payment_id, order_id, signature } = req.body;
    let { orderData } = req.body;

    if (!payment_id || !order_id || !signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    }

    if (!orderData || !Array.isArray(orderData.items)) {
      return res.status(400).json({ success: false, message: "Invalid order data received" });
    }

    // ── Fix B01: Verify signature strictly — no bypass_test backdoor ──
    const secret = process.env.RAZORPAY_SECRET_KEY || process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_key';
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(order_id + "|" + payment_id);
    const generated_signature = shasum.digest('hex');

    if (generated_signature !== signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed: Invalid signature" });
    }

    // ── Fix B15: Batch-fetch all products in ONE query ──
    const productIds = orderData.items.map(item => item.productID || item.productId || item._id || item.product);
    const productDocs = await PRODUCT.find({ _id: { $in: productIds } });
    const productMap = new Map(productDocs.map(p => [p._id.toString(), p]));

    let totalAmount = 0;
    const finalItems = [];

    for (const item of orderData.items) {
      const pId = (item.productID || item.productId || item._id || item.product)?.toString();
      const product = productMap.get(pId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found for ID ${pId}` });
      }
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price || product.price) || 0;
      product.stock = Math.max(0, (product.stock || 0) - quantity);
      await product.save();
      totalAmount += price * quantity;
      finalItems.push({ product: product._id, quantity, price });
    }

    totalAmount += (totalAmount * 2) / 100;
    let delivery = totalAmount >= 499 ? 0 : 40;
    if (orderData?.deliveryMethod === 'Express') delivery = 60;
    totalAmount += delivery;
    totalAmount = Math.round(totalAmount * 100) / 100;

    const userId = orderData.user?._id || req.user?._id;

    const newOrderData = {
      orderId: generateOrderId(),
      user: userId,
      items: finalItems,
      shippingAddress: orderData.shippingAddress,
      deliveryMethod: orderData.deliveryMethod || "Standard",
      paymentMethod: 'ONLINE',
      paymentStatus: 'Paid',
      orderStatus: 'Processing',
      trackingHistory: [{
        status: 'Processing',
        timestamp: Date.now(),
        comment: "Payment verified successfully"
      }],
      totalAmount
    };

    const newOrder = new ORDER(newOrderData);
    await newOrder.save();

    if (newOrderData?.shippingAddress?.remember) {
      await USER.findByIdAndUpdate(userId, {
        $push: { orders: newOrder._id },
        $addToSet: { addresses: newOrderData.shippingAddress }
      }, { new: true });
    } else {
      await USER.findByIdAndUpdate(userId, { $push: { orders: newOrder._id } }, { new: true });
    }

    try {
      await sendOrderConfirmation(
        orderData?.shippingAddress?.email || orderData?.user?.email,
        orderData?.shippingAddress?.name || orderData?.user?.name,
        newOrderData.orderId,
        orderData.items,
        newOrderData.totalAmount
      );
    } catch (mailErr) {
      console.error("Mail send error:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order saved successfully",
      orderid: newOrder._id,
      orderId: newOrder.orderId
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    const isProduction = process.env.NODE_ENV === "production";
    return res.status(500).json({
      success: false,
      message: isProduction ? "Payment processing failed. Please contact support." : error.message
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const user = await USER.findById(userId).populate({
      path: "orders",
      populate: {
        path: "items.product",
        model: "Product",
        select: "name price images"
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, orders: user.orders || [] });
  } catch (error) {
    console.error("getOrders error:", error);
    return res.status(500).json({ success: false, message: "Error fetching orders" });
  }
};

export const getOrder = async (req, res) => {
  const { id } = req.query;
  try {
    const order = await ORDER.findById(id).populate("items.product");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order Not Found" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("getOrder error:", error);
    return res.status(500).json({ success: false, message: "Error fetching order" });
  }
};

export const getOrderByID = async (req, res) => {
  const { orderId } = req.query;
  try {
    const order = await ORDER.findOne({ orderId }).populate("items.product");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order Not Found" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("getOrderByID error:", error);
    return res.status(500).json({ success: false, message: "Error fetching order" });
  }
};
