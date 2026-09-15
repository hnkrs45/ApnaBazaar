import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import USER from "./models/user.js";
import PRODUCT from "./models/product.js";
import ORDER from "./models/order.js";
import { generateOrderId } from "./services/generateOrderId.js";

dotenv.config();

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/E-Commerce";

const seedAll = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUrl);
    console.log("Connected successfully to MongoDB.");

    const saltRounds = 10;

    // 1. Seed / Upsert Admin User
    const adminEmail = "admin@apnabazaar.com";
    const adminPass = await bcrypt.hash("admin123", saltRounds);
    let admin = await USER.findOne({ email: adminEmail });
    if (!admin) {
      admin = new USER({
        name: "ApnaBazaar Admin",
        email: adminEmail,
        phone: "9999999999",
        password: adminPass,
        role: "admin",
        authProvider: "local",
        isVerified: true
      });
      await admin.save();
      console.log("Admin user created: admin@apnabazaar.com | admin123");
    } else {
      admin.password = adminPass;
      admin.role = "admin";
      admin.isVerified = true;
      await admin.save();
      console.log("Admin user password reset: admin@apnabazaar.com | admin123");
    }

    // 2. Seed / Upsert Customer User
    const customerEmail = "customer@apnabazaar.com";
    const customerPhone = "9876543210";
    const customerPass = await bcrypt.hash("password123", saltRounds);
    
    await USER.deleteMany({
      $or: [{ email: customerEmail }, { phone: customerPhone }]
    });

    const customer = new USER({
      name: "Rahul Sharma",
      email: customerEmail,
      phone: customerPhone,
      password: customerPass,
      role: "customer",
      authProvider: "local",
      isVerified: true
    });
    await customer.save();
    console.log("Customer user created: customer@apnabazaar.com | password123");

    // 3. Seed / Upsert Vendor User
    const vendorEmail = "vendor@apnabazaar.com";
    const vendorPhone = "9123456789";
    const vendorPass = await bcrypt.hash("vendor123", saltRounds);

    await USER.deleteMany({
      $or: [{ email: vendorEmail }, { phone: vendorPhone }]
    });

    const vendor = new USER({
      name: "Kisan Agro Vendor",
      email: vendorEmail,
      phone: vendorPhone,
      password: vendorPass,
      role: "vendor",
      authProvider: "local",
      isVerified: true,
      vendor: {
        companyName: "Kisan Organic Organics",
        address: "124 Mandi Road, Indore, MP",
        status: "Active",
        appliedAt: new Date(),
        approvedAt: new Date(),
        products: [],
        totalOrders: 0,
        totalRevenue: 0
      }
    });
    await vendor.save();
    console.log("Vendor user created: vendor@apnabazaar.com | vendor123");

    // 4. Ensure some products are assigned to this vendor
    const existingProducts = await PRODUCT.find({ isActive: true }).limit(5);
    if (existingProducts.length > 0) {
      for (const prod of existingProducts) {
        if (!prod.vendor) {
          prod.vendor = vendor._id;
          await prod.save();
        }
      }
      await USER.findByIdAndUpdate(vendor._id, {
        $set: { "vendor.products": existingProducts.map(p => p._id) }
      });
    }

    // 5. If no orders exist, create a sample order for Customer
    const orderCount = await ORDER.countDocuments();
    if (orderCount === 0 && existingProducts.length > 0) {
      const sampleProd = existingProducts[0];
      const sampleOrder = new ORDER({
        orderId: generateOrderId(),
        user: customer._id,
        items: [
          {
            product: sampleProd._id,
            quantity: 2,
            price: sampleProd.price
          }
        ],
        shippingAddress: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          street: "42 Green Valley",
          city: "Indore",
          state: "Madhya Pradesh",
          zipcode: "452001"
        },
        deliveryMethod: "Standard",
        paymentMethod: "COD",
        paymentStatus: "Pending",
        orderStatus: "Processing",
        trackingHistory: [
          {
            status: "Processing",
            timestamp: Date.now(),
            comment: "Order placed successfully (Cash on Delivery)"
          }
        ],
        totalAmount: (sampleProd.price * 2) + 40
      });
      await sampleOrder.save();
      await USER.findByIdAndUpdate(customer._id, {
        $push: { orders: sampleOrder._id }
      });
      console.log("Created sample order for testing: ID " + sampleOrder.orderId);
    }

    console.log("\n==============================================");
    console.log("DUMMY LOGIN CREDENTIALS READY FOR TESTING:");
    console.log("1. Admin:    admin@apnabazaar.com    | admin123");
    console.log("2. Customer: customer@apnabazaar.com | password123");
    console.log("3. Vendor:   vendor@apnabazaar.com   | vendor123");
    console.log("==============================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error in seedAll:", error);
    process.exit(1);
  }
};

seedAll();
