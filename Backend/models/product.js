import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        en: { type: String, required: [true, "English product name is required"] },
        hi: { type: String, required: [true, "Hindi product name is required"] }
    },
    description: {
        en: { type: String, required: [true, "English description is required"] },
        hi: { type: String, required: [true, "Hindi description is required"] }
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
        min: 0
    },
    discount: {
        type: Number,
        min: 0,
        max: 100
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        trim: true
    },
    location: {
        type: String,
        default: "Local Area"
    },
    brand: {
        type: String,
        trim: true
    },
    images: [
        {
            type: String,
            required: true
        }
    ],
    stock: {
        type: Number,
        min: 0
    },
    unit: {
        type: String,
        enum: ["kg", "Quintal", "Tonne"],
        default: "Quintal"
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    reviews: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            username: {type: String},
            rating: { type: Number, min: 1, max: 5 },
            comment: { type: String, trim: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true})

const PRODUCT = mongoose.model("Product", productSchema);

export default PRODUCT;