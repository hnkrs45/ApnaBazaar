import PRODUCT from "../models/product.js";

export const getproduct = async (req, res) => {
    const {cat} = req.query;
    const products = await PRODUCT.find({category:cat}).populate("vendor");
    if (products.length==0) return res.json({message: `Products not found with category ${cat}`})
    return res.json({success: true, message: `Products with category ${cat}`,items: products.length, products})
}

export const getallproducts = async (req,res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await PRODUCT.find({isActive: true}).populate("vendor").skip(skip).limit(limit).lean();
    if (products.length==0) return res.json({message: `Products not found`})
    const formattedProducts = products.map(p => {
        const {stock, ...rest} = p;
        return {
          productID: p._id,
          inStock: stock>0,
          ...rest
        }
    });
    return res.json({success: true, message: `All Products`,items: products.length, products: formattedProducts})
}

export const getproductsbyid = async (req, res) => {
    const {id} = req.query;
    const product = await PRODUCT.findOne({_id: id}).lean().populate("vendor");
    const {stock, ...rest} = product
    const formattedProduct = {
        productID: product._id,
        inStock: stock > 0,
        ...rest
    }
    res.json({success: true, product: formattedProduct})
}

export const searchProduct = async (req, res) => {
  try {
    const { name, location } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let products = [];
    
    let baseQuery = { isActive: true };
    if (location) {
      baseQuery.location = { $regex: location, $options: "i" };
    }

    if (name) {
      const matchedProducts = await PRODUCT.find({
        ...baseQuery,
        name: { $regex: name, $options: "i" }
      }).populate("vendor").lean();

      if (matchedProducts.length > 0) {
        const categories = [...new Set(matchedProducts.map(p => p.category))];
        const categoryProducts = await PRODUCT.find({
          ...baseQuery,
          category: { $in: categories }
        }).populate("vendor").lean();

        const allProductsMap = new Map();
        [...matchedProducts, ...categoryProducts].forEach(p => {
          allProductsMap.set(p._id.toString(), p);
        });

        products = Array.from(allProductsMap.values());
        products = products.slice(skip, skip + limit);
      }
    } else {
      products = await PRODUCT.find(baseQuery).populate("vendor").skip(skip).limit(limit).lean();
    }

    const formattedProducts = products.map(product => ({
      productID: product._id,
      inStock: product.stock > 0,
      ...product
    }));

    res.status(200).json({ success: true, data: formattedProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};