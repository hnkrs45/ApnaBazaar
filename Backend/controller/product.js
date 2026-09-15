import PRODUCT from "../models/product.js";

export const getproduct = async (req, res) => {
    try {
        const {cat} = req.query;
        const query = { isActive: true };
        if (cat && cat !== "All") {
            query.category = { $regex: new RegExp(`^${cat}$`, "i") };
        }
        const products = await PRODUCT.find(query).populate("vendor").lean();
        const formattedProducts = products.map(p => ({
            productID: p._id,
            inStock: (p.stock || 0) > 0,
            ...p
        }));
        return res.status(200).json({
            success: true,
            message: `Products for category ${cat || "All"}`,
            items: formattedProducts.length,
            products: formattedProducts
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const getallproducts = async (req,res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const products = await PRODUCT.find({isActive: true}).populate("vendor").skip(skip).limit(limit).lean();
        const formattedProducts = products.map(p => {
            const {stock, ...rest} = p;
            return {
              productID: p._id,
              inStock: (stock || 0) > 0,
              stock: stock || 0,
              ...rest
            }
        });
        return res.status(200).json({success: true, message: `All Products`, items: formattedProducts.length, products: formattedProducts})
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const getproductsbyid = async (req, res) => {
    try {
        const {id} = req.query;
        if (!id) return res.status(400).json({ success: false, message: "Product ID is required" });
        const product = await PRODUCT.findOne({_id: id}).lean().populate("vendor");
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        const {stock, ...rest} = product;
        const formattedProduct = {
            productID: product._id,
            inStock: (stock || 0) > 0,
            stock: stock || 0,
            ...rest
        };
        return res.status(200).json({success: true, product: formattedProduct});
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
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
      const searchRegex = new RegExp(name.trim(), "i");
      const matchedProducts = await PRODUCT.find({
        ...baseQuery,
        $or: [
          { "name.en": { $regex: searchRegex } },
          { "name.hi": { $regex: searchRegex } },
          { category: { $regex: searchRegex } },
          { "description.en": { $regex: searchRegex } }
        ]
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