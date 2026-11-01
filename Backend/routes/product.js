import express from "express";
import { 
  getallproducts, 
  getproduct, 
  getproductsbyid, 
  searchProduct,
  semanticSearch 
} from "../controller/product.js";
import { getSimilarProducts } from "../controller/product.js";


const router = express.Router();

router.get('/ai-search', semanticSearch);
router.get('/get', getproduct);
router.get('/getall', getallproducts);
router.get('/getbyid', getproductsbyid);
router.get('/search', searchProduct);
router.get('/similar/:id', getSimilarProducts);
export default router;