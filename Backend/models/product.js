import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        en: { type: String, default: "" },
        hi: { type: String, default: "" }
    },
    description: {
        en: { type: String, default: "" },
        hi: { type: String, default: "" }
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
    // AI Vector Store karne ke liye field
    embedding: {
        type: [Number],
        default: []
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
        default: true,
        index: true
    }
}, {timestamps: true})

// Optimize query performance
productSchema.index({ isActive: 1, category: 1 });
productSchema.index({ vendor: 1, isActive: 1 });

const PRODUCT = mongoose.model("Product", productSchema);

export default PRODUCT;