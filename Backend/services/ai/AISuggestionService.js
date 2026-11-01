import { GeminiProvider } from "./GeminiProvider.js";
import { fallbackSuggestionMatcher } from "./fallbackService.js";

/**
 * AISuggestionService manages semantic search query classification
 * using Google Gemini with automatic ~2s timeout and graceful fallback
 * to deterministic Layers 1-2 (rule & synonym dictionary matching).
 */
export class AISuggestionService {
  /**
   * @param {object} [config={}]
   * @param {GeminiProvider} [config.geminiProvider]
   * @param {number} [config.timeoutMs]
   */
  constructor(config = {}) {
    this.geminiProvider = config.geminiProvider || new GeminiProvider();
    this._timeoutMs = config.timeoutMs;
  }

  get timeoutMs() {
    return this._timeoutMs ?? (parseInt(process.env.AI_TIMEOUT_MS, 10) || 2000);
  }

  /**
   * Retrieves semantic category and keyword suggestions for a user query.
   *
   * Flow:
   * 1. Attempt Google Gemini with 2s timeout.
   * 2. If Gemini fails, times out, or is unconfigured, automatically fall back to Layers 1-2.
   *
   * @param {string} query - The search query
   * @param {string[]} catalogCategories - List of active categories in the database
   * @param {object} [options={}] - Additional options (e.g., timeoutMs, catalogProducts)
   * @returns {Promise<{ categories: string[], keywords: string[], providerUsed: string }>}
   */
  async getSemanticSuggestions(query, catalogCategories = [], options = {}) {
    if (!query || typeof query !== "string" || !query.trim()) {
      return { categories: [], keywords: [], providerUsed: "none" };
    }

    const timeoutMs = options.timeoutMs || this.timeoutMs;

    // 1. Attempt Gemini Provider
    if (this.geminiProvider.isConfigured()) {
      try {
        const result = await this.geminiProvider.getSemanticSuggestions(query, catalogCategories, {
          ...options,
          timeoutMs
        });
        return {
          ...result,
          providerUsed: "gemini"
        };
      } catch (geminiErr) {
        console.warn(
          `[AISuggestionService] Gemini provider failed: ${geminiErr.message}. Falling back to Layers 1-2...`
        );
      }
    } else {
      console.warn(
        `[AISuggestionService] Gemini is not configured. Falling back to Layers 1-2...`
      );
    }

    // 2. Fallback to Layer 1-2 (Exact + Agricultural Synonym matching)
    const fallbackResult = fallbackSuggestionMatcher(query, catalogCategories);
    return {
      ...fallbackResult,
      providerUsed: "layer-1-2-fallback"
    };
  }
}

// Default singleton instance
export const aiSuggestionService = new AISuggestionService();
