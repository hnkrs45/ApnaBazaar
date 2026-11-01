import dotenv from "dotenv";
import { connect } from "./connection/connection.js";
import PRODUCT from "./models/product.js";
import { getEmbedding } from "./services/aiService.js";

dotenv.config();

const url = process.env.MONGO_URL || "mongodb://localhost:27017/E-Commerce";

const run = async () => {
  try {
    await connect(url);

    // Jin products me embedding nahi hai unhe fetch karein
    const products = await PRODUCT.find({ "embedding.0": { $exists: false } });
    console.log(`Found ${products.length} products to process.`);

    for (const prod of products) {
      // Product ka name, category, description merge karein
      const textToEmbed = `${prod.name?.en || ""} ${prod.name?.hi || ""} ${prod.category || ""} ${prod.brand || ""} ${prod.description?.en || ""} ${prod.description?.hi || ""}`.trim();

      if (!textToEmbed) {
        console.log(`Skipping empty product ID: ${prod._id}`);
        continue;
      }

      console.log(`Generating embedding for: ${prod.name?.en || prod.name?.hi || prod._id}...`);
      const vector = await getEmbedding(textToEmbed);

      if (vector && vector.length > 0) {
        prod.embedding = vector;
        await prod.save();
        console.log(`Done for: ${prod.name?.en || prod._id}`);
      } else {
        console.log(`Failed to generate embedding for: ${prod._id}`);
      }
    }

    console.log("All products updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running script:", error);
    process.exit(1);
  }
};

run();