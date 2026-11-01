import { pipeline } from "@xenova/transformers";

let extractor = null;

export const getEmbedding = async (text) => {
  try {
    if (!extractor) {
      console.log("AI Model load ho raha hai (sirf first time download hoga)...");
      extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }

    const output = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error("Embedding Error:", error);
    return null;
  }
};