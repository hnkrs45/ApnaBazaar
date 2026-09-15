import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import USER from "./models/user.js";

dotenv.config();

const mongoUrl = process.env.MONGO_URL;

const seedAdmin = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUrl);
        console.log("Connected successfully to MongoDB.");

        const email = "admin@apnabazaar.com";
        const phone = "9999999999";
        
        await USER.deleteMany({
            $or: [{ email }, { phone }]
        });

        console.log("Creating fresh admin user...");
        const saltround = 10;
        const hashedpass = await bcrypt.hash("admin123", saltround);

        const newAdmin = new USER({
            name: "ApnaBazaar Admin",
            email: email,
            phone: phone,
            password: hashedpass,
            role: "admin",
            authProvider: "local",
            isVerified: true
        });

        await newAdmin.save();
        console.log("Admin user successfully seeded! Email: admin@apnabazaar.com | Password: admin123");

        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding admin user:", error);
        process.exit(1);
    }
};

seedAdmin();
