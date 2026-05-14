import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PRODUCT from './models/product.js';
import USER from './models/user.js';
import bcrypt from 'bcrypt';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/E-Commerce";

const dummyProducts = [
    {
        name: {
            en: "Sharbati Wheat (Premium)",
            hi: "शरबती गेहूं (प्रीमियम)"
        },
        description: {
            en: "High-quality Sharbati wheat grains, high in protein and nutrients. Harvested from the fields of Madhya Pradesh.",
            hi: "उच्च गुणवत्ता वाले शरबती गेहूं के दाने, प्रोटीन और पोषक तत्वों से भरपूर। मध्य प्रदेश के खेतों से काटा गया।"
        },
        price: 2600,
        unit: "Quintal",
        category: "Grains",
        location: "Sehore, MP",
        images: ["https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b"],
        stock: 50,
        brand: "Narmada Farms"
    },
    {
        name: {
            en: "Basmati Rice (Long Grain)",
            hi: "बासमती चावल (लंबे दाने)"
        },
        description: {
            en: "Aromatic extra-long grain Basmati rice. Aged for 12 months for superior taste and texture.",
            hi: "सुगंधित अतिरिक्त लंबे दाने वाले बासमती चावल। बेहतर स्वाद और बनावट के लिए 12 महीने के लिए पुराना किया गया।"
        },
        price: 7500,
        unit: "Quintal",
        category: "Grains",
        location: "Karnal, Haryana",
        images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c"],
        stock: 30,
        brand: "Golden Fields"
    },
    {
        name: {
            en: "Red Desi Onions",
            hi: "लाल देसी प्याज"
        },
        description: {
            en: "Freshly harvested red onions. Firm, pungent, and long shelf life. Ideal for wholesale storage.",
            hi: "ताज़ा काटे गए लाल प्याज़। सख्त, तीखे और लंबी शेल्फ लाइफ। थोक भंडारण के लिए आदर्श।"
        },
        price: 1800,
        unit: "Quintal",
        category: "Vegetables",
        location: "Nashik, Maharashtra",
        images: ["https://images.unsplash.com/photo-1508747703725-719777637510"],
        stock: 100,
        brand: "Nashik Fresh"
    },
    {
        name: {
            en: "Organic Toor Dal (Pigeon Peas)",
            hi: "ऑर्गेनिक अरहर दाल"
        },
        description: {
            en: "Unpolished organic Toor Dal. High in protein and processed without chemicals.",
            hi: "बिना पॉलिश की हुई ऑर्गेनिक अरहर दाल। प्रोटीन में उच्च और रसायनों के बिना संसाधित।"
        },
        price: 9500,
        unit: "Quintal",
        category: "Pulses",
        location: "Gulbarga, Karnataka",
        images: ["https://images.unsplash.com/photo-1585994192701-10d50f51b911"],
        stock: 25,
        brand: "Deccan Organics"
    },
    {
        name: {
            en: "Premium Potatoes (Jyoti)",
            hi: "प्रीमियम आलू (ज्योति)"
        },
        description: {
            en: "Large-sized Jyoti potatoes. Low moisture content, perfect for chips and general retailing.",
            hi: "बड़े आकार के ज्योति आलू। कम नमी की मात्रा, चिप्स और सामान्य खुदरा बिक्री के लिए एकदम सही।"
        },
        price: 1400,
        unit: "Quintal",
        category: "Vegetables",
        location: "Hooghly, West Bengal",
        images: ["https://images.unsplash.com/photo-1518977676601-b53f82aba655"],
        stock: 200,
        brand: "Bengal Harvest"
    },
    {
        name: {
            en: "Dried Red Chillies (Guntur)",
            hi: "सूखी लाल मिर्च (गुंटूर)"
        },
        description: {
            en: "Spicy and bright red Guntur chillies. Dried naturally under the sun.",
            hi: "तीखी और चमकीली लाल गुंटूर मिर्च। सूरज के नीचे प्राकृतिक रूप से सुखाई गई।"
        },
        price: 180,
        unit: "kg",
        category: "Spices",
        location: "Guntur, AP",
        images: ["https://images.unsplash.com/photo-1599330101962-e64e52f75d33"],
        stock: 500,
        brand: "Andhra Spice"
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
                name: "Farmer Mohan",
                email: "mohan@farmer.com",
                phone: "9876543210",
                password: hashedPass,
                authProvider: "local",
                role: "vendor",
                isVerified: true,
                vendor: {
                    companyName: "Mohan Agri Farms",
                    address: "Village Rampur, District Sehore",
                    status: "Active"
                }
            });
        }

        const productsWithVendor = dummyProducts.map(p => ({
            ...p,
            vendor: vendor._id
        }));

        const insertedProducts = await PRODUCT.insertMany(productsWithVendor);
        console.log(`${insertedProducts.length} wholesale farm products added successfully!`);

        // Update vendor's products list
        const productIds = insertedProducts.map(p => p._id);
        await USER.findByIdAndUpdate(vendor._id, {
            $set: { "vendor.products": productIds }
        });
        
        console.log("Vendor updated with new products");

        mongoose.connection.close();
        console.log("Database connection closed");
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
