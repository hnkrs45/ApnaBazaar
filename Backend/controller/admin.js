import PRODUCT from "../models/product.js";
import USER from "../models/user.js";
import { getuser } from "../services/auth.js";
import ORDER from "../models/order.js";
import { sendOrderStatusMail, sendVendorApprovalMail } from "../emails/sendMail.js";

const normalizeMultilingualField = (val) => {
  if (!val) return { en: "", hi: "" };
  if (typeof val === "string") return { en: val, hi: val };
  return {
    en: val.en || val.hi || "",
    hi: val.hi || val.en || ""
  };
};

export const getProducts = async (req, res) => {
  try {
    const products = await PRODUCT.find({ isActive: true })
      .populate("vendor", "vendor.companyName")
      .lean();
    if (products.length === 0) {
      return res.json({ success: true, message: "All Products", items: 0, products: [] });
    }
    const formattedProducts = products.map((p) => ({
      productID: p._id,
      ...p,
    }));
    return res.json({
      success: true,
      message: "All Products",
      items: products.length,
      products: formattedProducts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const editproduct = async (req, res) => {
  const { id, images, name, price, stock, description, category } = req.body;

  try {
    const product = await PRODUCT.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product Not Found" });
    }

    if (name) product.name = normalizeMultilingualField(name);
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (description) product.description = normalizeMultilingualField(description);
    if (category) product.category = category;
    if (images) product.images = images;

    await product.save();
    return res.json({ success: true, message: "Product Edited successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addproduct = async (req, res) => {
  const { images, name, price, stock, description, category } = req.body;
  try {
    await PRODUCT.create({
      name: normalizeMultilingualField(name),
      description: normalizeMultilingualField(description),
      price: Number(price) || 0,
      category,
      images: Array.isArray(images) ? images : [],
      stock: Number(stock) || 0,
      vendor: req?.user?._id,
    });
    return res.json({ success: true, message: "Product added successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeproduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await PRODUCT.findOne({ _id: id });
    if (!product) {
      return res.status(400).json({ success: false, message: "Product not found with this id" });
    }
    product.isActive = false;
    await product.save();
    return res.json({ success: true, message: "product successfully removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateproduct = async (req, res) => {
  const { id, images, name, price, stock, description, category } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Product ID is required" });
  }

  try {
    const product = await PRODUCT.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product Not Found" });
    }

    if (name !== undefined) product.name = normalizeMultilingualField(name);
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (description !== undefined) product.description = normalizeMultilingualField(description);
    if (category !== undefined) product.category = category;
    if (images !== undefined) product.images = images;

    await product.save();
    return res.json({ success: true, message: "Product updated successfully", product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const token = req?.cookies?.admin_token || req?.cookies?.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
    if (!token) {
      return res.send({ isAuthenticate: false, message: "Unauthorized Access: No token" });
    }
    const decodeUser = getuser(token);
    if (!decodeUser?.email) {
      return res.send({ isAuthenticate: false, message: "Unauthorized Access: Invalid token" });
    }
    const user = await USER.findOne({ email: decodeUser.email }).select("-password");
    if (!user) {
      return res.send({ isAuthenticate: false, message: "Unauthorized Access: User not found" });
    }
    if (user.role !== "admin") {
      return res.send({ isAuthenticate: false, message: "Unauthorized Access: Admin role required" });
    }
    return res.send({ isAuthenticate: true, message: "Authenticate user", user, role: user.role });
  } catch (error) {
    res.send({ isAuthenticate: false, message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await ORDER.find().populate(["user", "items.product"]);
    return res.status(200).send({ success: true, message: "All Orders", orders: orders });
  } catch (error) {
    return res.status(500).send({ success: false, message: "Unable to get All orders", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await USER.find().populate("orders", "totalAmount").lean();
    const formattedUsers = users.map((user) => {
      const totalSpent = (user.orders || []).reduce(
        (acc, order) => acc + (Number(order?.totalAmount) || 0),
        0
      );
      return {
        ...user,
        spent: totalSpent,
        ordersCount: (user.orders || []).length,
      };
    });
    return res.status(200).send({ success: true, message: "All Users", users: formattedUsers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to get All Users" });
  }
};

export const getVendors = async (req, res) => {
  try {
    const users = await USER.find().lean();
    const vendors = users.filter((u) => u.role === "vendor");
    res.status(200).send({ success: true, vendors });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const approveVendor = async (req, res) => {
  const { id } = req.query;
  try {
    const user = await USER.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!user.vendor) {
      user.vendor = { companyName: user.name, address: "Not specified" };
    }
    user.vendor.status = "Active";
    user.vendor.approvedAt = Date.now();

    await user.save();

    try {
      await sendVendorApprovalMail(user?.email, user?.name);
    } catch (mailErr) {
      console.error("Mail send error:", mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Vendor application Approved Successfully",
    });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const logout = (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    };
    res.clearCookie("admin_token", cookieOptions);
    res.status(200).json({ message: "Logout successful", success: true });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

export const getLast7DaysOrders = async (req, res) => {
  try {
    const result = await ORDER.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%b %d", date: "$createdAt" } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = result.map((r) => ({
      date: r._id,
      orders: r.orders,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrdersByCategory = async (req, res) => {
  try {
    const result = await ORDER.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          value: { $sum: "$items.quantity" },
        },
      },
      { $project: { _id: 0, name: "$_id", value: 1 } },
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalesByVendors = async (req, res) => {
  try {
    const result = await ORDER.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "users",
          localField: "product.vendor",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: "$vendor" },
      {
        $group: {
          _id: "$vendor.vendor.companyName",
          orderIds: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          vendor: "$_id",
          sales: { $size: "$orderIds" },
        },
      },
      { $sort: { sales: -1 } },
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTotalDetail = async (req, res) => {
  try {
    const orders = await ORDER.find({});
    let totalRevenue = 0;
    orders.forEach((order) => {
      totalRevenue += Number(order.totalAmount) || 0;
    });

    const totalVendors = await USER.countDocuments({ role: "vendor" });
    res.status(200).json({ success: true, totalOrder: orders.length, totalRevenue, totalVendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id, nextStatus } = req.body;
    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

    if (!id || !nextStatus) {
      return res.status(400).json({
        success: false,
        message: "Order ID and next status are required",
      });
    }

    if (!validStatuses.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const updatedOrder = await ORDER.findByIdAndUpdate(
      id,
      {
        $set: { orderStatus: nextStatus },
        $push: {
          trackingHistory: {
            status: nextStatus,
            timestamp: Date.now(),
            comment: `Order status updated to ${nextStatus}`,
          },
        },
      },
      { new: true }
    ).populate(["user", "items.product"]);

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    try {
      await sendOrderStatusMail(
        updatedOrder?.shippingAddress?.email,
        updatedOrder?.shippingAddress?.name,
        updatedOrder?.orderId,
        nextStatus
      );
    } catch (mailError) {
      console.error("Error sending order status mail:", mailError);
    }

    return res.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
