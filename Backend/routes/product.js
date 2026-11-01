import express from "express";
import {
  getallproducts,
  getproduct,
  getproductsbyid,
  searchProduct,
  semanticSearch,
  getSimilarProducts
} from "../controller/product.js";
import { aiSearchLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get('/ai-search', aiSearchLimiter, semanticSearch);  // AI endpoint — rate-limited
router.get('/get', getproduct);
router.get('/getall', getallproducts);
router.get('/getbyid', getproductsbyid);
router.get('/search', aiSearchLimiter, searchProduct);      // also AI-backed — rate-limited
router.get('/similar/:id', getSimilarProducts);

export default router;
