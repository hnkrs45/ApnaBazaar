import express from "express"
import {
  authCheck,
  deleteWishlist,
  googleLogin,
  login,
  signup,
  updateWishlist,
  verify,
  verifyEmail,
  logout,
  getWishlist,
  updateUser,
  addVendor,
  interection,
  addRatingReview,
  editReview,
  deleteReview
} from "../controller/user.js";
import { auth } from "../services/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Auth routes — rate-limited
router.post('/login', authLimiter, login);
router.post('/signup', authLimiter, signup);
router.post('/googlelogin', authLimiter, googleLogin);

// Token / session
router.post('/verify', verify);
router.get('/verifyEmail', verifyEmail);
router.get('/authcheck', authCheck);
router.post('/logout', logout);        // Changed from GET → POST (CSRF fix)

// Wishlist (protected)
router.post('/wishlist/:Productid', auth, updateWishlist);
router.delete('/wishlist/:Productid', auth, deleteWishlist);
router.get('/wishlist/get', auth, getWishlist);

// Profile (protected)
router.put('/update', auth, updateUser);
router.post('/addvendor', auth, addVendor);

// Interaction / ML data — both spellings protected
router.post('/interaction', auth, interection);   // correct spelling, protected
router.post('/interection', auth, interection);   // legacy spelling kept, now also protected

// Reviews (protected)
router.post('/addratingreview', auth, addRatingReview);
router.put('/editreview', auth, editReview);
router.delete('/deletereview', auth, deleteReview);

export default router
