import jwt from "jsonwebtoken";
import USER from "../models/user.js";

export const setuserandcookies = (res, user) => {
    const payload = {
        name: user.name,
        email: user.email,
        role: user.role || "customer"
    };
    const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '7d' });
    
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    if (user?.role === "admin") {
        res.cookie("admin_token", token, cookieOptions);
    } else {
        res.cookie("token", token, cookieOptions);
    }
    return token;
};

export const getuser = (token) => {
    try {
        if (!token) return null;
        return jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
        console.error("JWT verify error:", error.message);
        return null;
    }
};

export const extractToken = (req, cookieName = "token") => {
    if (req?.cookies?.[cookieName]) {
        return req.cookies[cookieName];
    }
    if (req?.cookies?.token) {
        return req.cookies.token;
    }
    if (req?.cookies?.admin_token) {
        return req.cookies.admin_token;
    }
    const authHeader = req?.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }
    return authHeader || null;
};

export const checkAdmin = async (req, res, next) => {
    try {
        const token = extractToken(req, "admin_token");
        if (!token) return res.status(401).json({ message: "No token provided" });

        const decoded = getuser(token);
        if (!decoded?.email) return res.status(401).json({ message: "Invalid or expired token" });

        const user = await USER.findOne({ email: decoded.email }).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized Access: Admin role required" });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token", error: err.message });
    }
};

export const auth = async (req, res, next) => {
    try {
        const token = extractToken(req, "token");
        if (!token) return res.status(401).json({ message: "No token provided" });

        const decoded = getuser(token);
        if (!decoded?.email) return res.status(401).json({ message: "Invalid or expired token" });

        const user = await USER.findOne({ email: decoded.email }).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token", error: err.message });
    }
};

export const checkVendor = async (req, res, next) => {
    try {
        const token = extractToken(req, "token");
        if (!token) return res.status(401).json({ message: "No token provided" });

        const decoded = getuser(token);
        if (!decoded?.email) return res.status(401).json({ message: "Invalid or expired token" });

        const user = await USER.findOne({ email: decoded.email }).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.role !== "vendor" && user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized Access: Vendor role required" });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token", error: err.message });
    }
};