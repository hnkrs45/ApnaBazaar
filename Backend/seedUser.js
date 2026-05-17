import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import USER from "./models/user.js";

// Load environment variables
dotenv.config();

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/ApnaBazaar";

const seedUser = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUrl);
        console.log("Connected successfully to MongoDB.");

        const email = "customer@apnabazaar.com";
        const phone = "5551234567";
        
        // Remove any existing user with this email or phone to start completely clean and avoid duplicate key errors
        await USER.deleteMany({
            $or: [
                { email },
                { phone }
            ]
        });

        console.log("Creating fresh dummy user...");
        const saltround = 10;
        const hashedpass = await bcrypt.hash("password123", saltround);

        const newUser = new USER({
            name: "John Doe",
            email: email,
            phone: phone,
            password: hashedpass,
            role: "customer",
            authProvider: "local",
            isVerified: true
        });

        await newUser.save();
        console.log("Dummy user successfully seeded!");

        mongoose.connection.close();
        console.log("Database connection closed.");
    } catch (error) {
        console.error("Error seeding dummy user:", error);
        process.exit(1);
    }
};

seedUser();
