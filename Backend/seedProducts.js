import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PRODUCT from './models/product.js';
import USER from './models/user.js';
import bcrypt from 'bcrypt';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/E-Commerce";

const dummyProducts = [
    {
        name: "Fresh Organic Tomatoes",
        description: "Vine-ripened organic tomatoes, perfect for salads and sauces.",
        price: 80,
        category: "Vegetables",
        location: "Green Valley Farm",
        images: ["https://images.unsplash.com/photo-1592924357228-91a4daadcfea"],
        stock: 100,
        brand: "Farm Fresh"
    },
    {
        name: "Farm Fresh Brown Eggs",
        description: "Freshly collected brown eggs from free-range chickens.",
        price: 120,
        category: "Dairy & Eggs",
        location: "Sunny Side Poultry",
        images: ["https://images.unsplash.com/photo-1587486918502-334483b12803"],
        stock: 50,
        brand: "Local Homestead"
    },
    {
        name: "Organic Baby Spinach",
        description: "Tender and nutrient-rich organic baby spinach leaves.",
        price: 60,
        category: "Vegetables",
        location: "Leafy Greens Farm",
        images: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb"],
        stock: 40,
        brand: "Nature's Own"
    },
    {
        name: "Natural Forest Honey",
        description: "Pure, unprocessed honey collected from forest beehives.",
        price: 450,
        category: "Pantry",
        location: "Wildwood Apiary",
        images: ["https://images.unsplash.com/photo-1587049352846-4a222e784d38"],
        stock: 25,
        brand: "Wild Harvest"
    },
    {
        name: "Fresh Buffalo Milk",
        description: "Rich and creamy fresh buffalo milk, delivered daily.",
        price: 70,
        category: "Dairy & Eggs",
        location: "Krishna Dairy Farm",
        images: ["https://images.unsplash.com/photo-1550583724-1d2ee29ad7a1"],
        stock: 30,
        brand: "Dairy Pure"
    },
    {
        name: "Sweet Alphonso Mangoes",
        description: "Premium quality sweet Alphonso mangoes, the king of fruits.",
        price: 800,
        category: "Fruits",
        location: "Ratnagiri Orchards",
        images: ["https://images.unsplash.com/photo-1553279768-865429fa0078"],
        stock: 20,
        brand: "Royal Fruits"
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to MongoDB");

        // Clear existing products
        await PRODUCT.deleteMany({});
        console.log("Cleared existing products");

        // Find or create a vendor
        let vendor = await USER.findOne({ role: 'vendor' });
        if (!vendor) {
            console.log("No vendor found, creating a dummy vendor...");
            const hashedPass = await bcrypt.hash("password123", 11);
            vendor = await USER.create({
                name: "Dummy Vendor",
                email: "vendor@example.com",
                phone: "1234567890",
                password: hashedPass,
                authProvider: "local",
                role: "vendor",
                isVerified: true,
                vendor: {
                    companyName: "Dummy Marketplace Co.",
                    address: "123 Market St, Local City",
                    status: "Active"
                }
            });
        }

        const productsWithVendor = dummyProducts.map(p => ({
            ...p,
            vendor: vendor._id
        }));

        const insertedProducts = await PRODUCT.insertMany(productsWithVendor);
        console.log(`${insertedProducts.length} farm fresh products added successfully!`);

        // Update vendor's products list
        const productIds = insertedProducts.map(p => p._id);
        await USER.findByIdAndUpdate(vendor._id, {
            $set: { "vendor.products": productIds }
        });
        
        console.log("Vendor updated with new products");

        mongoose.connection.close();
        process.exit();
    } catch (error) {
        console.error("Error seeding products:", error);
        if (mongoose.connection.readyState !== 0) {
            mongoose.connection.close();
        }
        process.exit(1);
    }
}

seed();
