import crypto from "crypto";
import { getuser, setuserandcookies } from "../services/auth.js";
import USER from "../models/user.js"
import axios from "axios"
import bcrypt from "bcrypt"
import { getOAuth2Client } from "../services/googleAuth.js";
import { sendVendorApplicationMail, sendVerificationMail } from "../emails/sendMail.js";
import PRODUCT from "../models/product.js";

const isProduction = () => process.env.NODE_ENV === "production";

export const signup = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // ── Server-side input validation ──
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        const existing = await USER.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({ success: false, message: "This email is already registered" });
        }

        const hashedpass = await bcrypt.hash(password, 12);

        // ── Fix B09: cryptographically strong token instead of 6-digit OTP ──
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 min

        const newUser = await USER.create({
            name,
            email,
            phone,
            password: hashedpass,
            verificationToken,
            verificationTokenExpiry,
            authProvider: "local",
            role: "customer"
        });

        const token = setuserandcookies(res, newUser);

        try {
            await sendVerificationMail(email, verificationToken);
        } catch (mailError) {
            console.error("Error sending verification mail:", mailError);
        }

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: { name, email, phone, role: newUser.role },
            token
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: isProduction() ? "Registration failed" : error.message });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    try {
        const user = await USER.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not registered" });
        }

        if (!user.password) {
            return res.status(400).json({ success: false, message: "Please sign in with Google" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        const token = setuserandcookies(res, user);
        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            user: { name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: isProduction() ? "Login failed" : error.message });
    }
}

export const verifyEmail = async (req, res) => {
    try {
        const { Token } = req.query;
        if (!Token) {
            return res.status(400).json({ success: false, message: "Verification token is required" });
        }
        const user = await USER.findOne({ verificationToken: Token });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification link" });
        }
        if (user.verificationTokenExpiry < Date.now()) {
            return res.status(400).json({ success: false, message: "Verification link has expired" });
        }

        await USER.updateOne(
            { _id: user._id },
            { $set: { isVerified: true }, $unset: { verificationToken: "", verificationTokenExpiry: "" } }
        );

        return res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.error("verifyEmail error:", error);
        return res.status(500).json({ success: false, message: isProduction() ? "Verification failed" : error.message });
    }
}

export const verify = (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, message: "Token is required" });
        const user = getuser(token);
        if (!user) return res.status(401).json({ success: false, message: "Invalid or expired token" });
        return res.status(200).json({ success: true, message: "User is verified", user });
    } catch (error) {
        return res.status(500).json({ success: false, message: isProduction() ? "Verification failed" : error.message });
    }
}

export const googleLogin = async (req, res) => {
    try {
        const code = req.query.code || req.body?.code;
        if (!code) {
            return res.status(400).json({ success: false, message: "Authorization code is missing" });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return res.status(500).json({
                success: false,
                message: "Google OAuth is not configured on the server."
            });
        }

        const client = getOAuth2Client();
        const googleres = await client.getToken(code);
        client.setCredentials(googleres.tokens);

        const userRes = await axios.get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleres.tokens.access_token}`
        );
        const { email, name, picture } = userRes.data;

        if (!email) {
            return res.status(400).json({ success: false, message: "Could not retrieve email from Google" });
        }

        let user = await USER.findOne({ email });
        if (!user) {
            user = await USER.create({
                email,
                name: name || email.split("@")[0],
                authProvider: "google",
                isVerified: true,
                role: "customer"
            });
        } else {
            if (!user.isVerified) {
                user.isVerified = true;
                await user.save();
            }
        }

        const token = setuserandcookies(res, user);
        return res.status(200).json({
            success: true,
            user: { id: user._id, email: user.email, name: user.name, token, role: user.role, picture }
        });
    } catch (error) {
        console.error("Google auth error:", error.message);
        return res.status(500).json({
            success: false,
            message: isProduction() ? "Google authentication failed" : error.message
        });
    }
};

export const authCheck = async (req, res) => {
    try {
        const token =
            req?.cookies?.token ||
            req?.cookies?.admin_token ||
            (req.headers.authorization?.startsWith("Bearer ")
                ? req.headers.authorization.split(" ")[1]
                : null);
        if (!token) {
            return res.json({ isAuthenticate: false, message: "Unauthorized" });
        }
        const decodeUser = getuser(token);
        if (!decodeUser?.email) {
            return res.json({ isAuthenticate: false, message: "Invalid token" });
        }
        const user = await USER.findOne({ email: decodeUser.email }).select("-password");
        if (!user) {
            return res.json({ isAuthenticate: false, message: "User not found" });
        }
        return res.json({ isAuthenticate: true, message: "Authenticated", user, role: user.role });
    } catch (error) {
        console.error("authCheck error:", error);
        return res.json({ isAuthenticate: false, message: "Authentication check failed" });
    }
}

export const updateWishlist = async (req, res) => {
    try {
        const user = await USER.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { wishlist: req.params.Productid } },
            { new: true }
        ).populate("wishlist");
        res.json(user.wishlist);
    } catch (err) {
        console.error("updateWishlist error:", err);
        res.status(500).json({ message: isProduction() ? "Failed to update wishlist" : err.message });
    }
}

export const deleteWishlist = async (req, res) => {
    try {
        const user = await USER.findByIdAndUpdate(
            req.user._id,
            { $pull: { wishlist: req.params.Productid } },
            { new: true }
        ).populate("wishlist");
        res.json(user.wishlist);
    } catch (err) {
        console.error("deleteWishlist error:", err);
        res.status(500).json({ message: isProduction() ? "Failed to update wishlist" : err.message });
    }
}

export const logout = (req, res) => {
    try {
        const prod = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: prod,
            sameSite: prod ? "none" : "lax",
        };
        res.clearCookie("token", cookieOptions);
        res.clearCookie("admin_token", cookieOptions);
        res.status(200).json({ message: "Logout successful", success: true });
    } catch (err) {
        res.status(500).json({ message: isProduction() ? "Logout failed" : err.message, success: false });
    }
}

export const getWishlist = async (req, res) => {
    try {
        const data = await USER.findById(req.user._id).populate("wishlist");
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("getWishlist error:", error);
        res.status(500).json({ message: isProduction() ? "Failed to fetch wishlist" : error.message, success: false });
    }
}

export const updateUser = async (req, res) => {
    const formData = req.body;
    const data = {
        name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.name,
        email: formData.email,
        phone: formData.phone
    };
    try {
        const updatedUser = await USER.findByIdAndUpdate(
            req.user._id,
            { $set: data },
            { new: true, runValidators: true }
        ).select("-password");

        res.status(200).json({ success: true, message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error("updateUser error:", error);
        res.status(500).json({ message: isProduction() ? "Update failed" : error.message, success: false });
    }
}

export const addVendor = async (req, res) => {
    try {
        const { companyName, address } = req.body;
        const userId = req.user?._id;

        if (!companyName || !address) {
            return res.status(400).json({ success: false, message: "Company name and address are required" });
        }

        const user = await USER.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role === "vendor") {
            return res.status(400).json({ success: false, message: "You are already a vendor" });
        }

        user.vendor = { companyName, address, status: "Pending", appliedAt: new Date() };
        user.role = "vendor";
        await user.save();

        try {
            await sendVendorApplicationMail("arshadmansuri572@gmail.com", user.name, user.email);
        } catch (mailError) {
            console.error("Error sending vendor application mail:", mailError);
        }

        res.status(200).json({ success: true, message: "Vendor application submitted successfully", vendor: user.vendor });
    } catch (err) {
        console.error("addVendor error:", err);
        res.status(500).json({ success: false, message: isProduction() ? "Application failed" : err.message });
    }
};

export const interection = async (req, res) => {
    const data = req.body;
    try {
        const userId = data?.user || req.user?._id;
        const user = await USER.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User Not Found" });
        }

        const userHistory = (data?.products || []).map(product => ({
            productID: product?.product?.productID,
            event: {
                type: product?.event?.type,
                timeStamp: product?.event?.time
            },
            time: product?.time,
            duration: product?.duration
        }));

        // Cap history at 500 most recent entries to prevent document bloat
        user.history = [...user.history, ...userHistory].slice(-500);
        await user.save();

        res.status(200).json({ success: true, message: "Data saved successfully" });
    } catch (error) {
        console.error("interection error:", error);
        res.status(500).json({ success: false, message: isProduction() ? "Failed to save data" : error.message });
    }
}

export const addRatingReview = async (req, res) => {
    try {
        const reviewData = req.body;
        const ProductID = reviewData?.productID;

        if (!ProductID || !reviewData.rating || !reviewData.review) {
            return res.status(400).json({ success: false, message: "Product ID, rating, and review are required" });
        }

        const product = await PRODUCT.findOne({ _id: ProductID });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (!product.ratings) product.ratings = { average: 0, count: 0 };

        let reviewDate = new Date();
        if (reviewData.date) {
            if (typeof reviewData.date === 'string' && reviewData.date.includes('/')) {
                const parts = reviewData.date.split('/');
                if (parts.length === 3) {
                    const parsed = new Date(parts[2], parts[1] - 1, parts[0]);
                    if (!isNaN(parsed.getTime())) reviewDate = parsed;
                }
            } else {
                const parsed = new Date(reviewData.date);
                if (!isNaN(parsed.getTime())) reviewDate = parsed;
            }
        }

        product.reviews = [...product.reviews, {
            user: reviewData.user,
            username: reviewData.name,
            rating: Number(reviewData.rating),
            comment: reviewData.review,
            createdAt: reviewDate
        }];

        const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
        product.ratings.count = product.reviews.length;
        product.ratings.average = parseFloat((total / product.reviews.length).toFixed(1));

        await product.save();
        return res.status(200).json({ success: true, message: "Review added successfully" });
    } catch (error) {
        console.error("addRatingReview error:", error);
        res.status(500).json({ success: false, message: isProduction() ? "Failed to add review" : error.message });
    }
}

export const editReview = async (req, res) => {
    try {
        const { productID, user, rating, review } = req.body;

        if (!productID || !rating || !review) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const product = await PRODUCT.findById(productID);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const reviewIndex = product.reviews.findIndex(r => r.user.toString() === user);
        if (reviewIndex === -1) {
            return res.status(404).json({ success: false, message: "Review not found for this user" });
        }

        product.reviews[reviewIndex].rating = Number(rating);
        product.reviews[reviewIndex].comment = review;
        product.reviews[reviewIndex].createdAt = new Date();

        const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
        product.ratings.count = product.reviews.length;
        product.ratings.average = parseFloat((total / product.reviews.length).toFixed(1));

        await product.save();
        return res.status(200).json({ success: true, message: "Review updated successfully", reviews: product.reviews });
    } catch (error) {
        console.error("editReview error:", error);
        res.status(500).json({ success: false, message: isProduction() ? "Failed to update review" : error.message });
    }
}

export const deleteReview = async (req, res) => {
    try {
        const { productID } = req.query;
        const userID = req?.user?._id;

        if (!productID) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        const product = await PRODUCT.findById(productID);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const updatedReviews = product.reviews.filter(r => r.user.toString() !== userID.toString());
        if (updatedReviews.length === product.reviews.length) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        product.reviews = updatedReviews;

        if (product.reviews.length === 0) {
            product.ratings = { average: 0, count: 0 };
        } else {
            const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
            product.ratings.count = product.reviews.length;
            product.ratings.average = parseFloat((total / product.reviews.length).toFixed(1));
        }

        await product.save();
        return res.status(200).json({ success: true, message: "Review deleted successfully", reviews: product.reviews });
    } catch (error) {
        console.error("deleteReview error:", error);
        res.status(500).json({ success: false, message: isProduction() ? "Failed to delete review" : error.message });
    }
}
