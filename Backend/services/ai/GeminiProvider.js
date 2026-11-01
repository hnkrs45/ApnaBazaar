import { BaseProvider } from "./BaseProvider.js";
import { buildSemanticPrompt, parseAndValidateAIResponse } from "./promptHelper.js";

/**
 * GeminiProvider implements the AI provider using the Google Gemini API.
 * Uses official Google AI Studio endpoints.
 * Recommended small/fast/low-cost model: gemini-2.5-flash
 */
export class GeminiProvider extends BaseProvider {
  /**
   * @param {object} [config={}]
   * @param {string} [config.apiKey]
   * @param {string} [config.model]
   * @param {number} [config.timeoutMs]
   */
  constructor(config = {}) {
    super("gemini");
    this._apiKey = config.apiKey;
    this._model = config.model;
    this._timeoutMs = config.timeoutMs;
  }

  get apiKey() {
    return this._apiKey ?? process.env.GEMINI_API_KEY ?? "";
  }

  get model() {
    return this._model ?? process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";
  }

  get timeoutMs() {
    return this._timeoutMs ?? (parseInt(process.env.AI_TIMEOUT_MS, 10) || 2000);
  }

  /**
   * @returns {boolean} True if an API key is present
   */
  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Requests semantic suggestions from Gemini.
   *
   * @param {string} query
   * @param {string[]} catalogCategories
   * @param {object} [options={}]
   * @returns {Promise<{ categories: string[], keywords: string[] }>}
   */
  async getSemanticSuggestions(query, catalogCategories = [], options = {}) {
    if (!this.isConfigured()) {
      throw new Error("GeminiProvider: GEMINI_API_KEY is not configured.");
    }

    if (!query || typeof query !== "string" || !query.trim()) {
      return { categories: [], keywords: [] };
    }

    const timeout = options.timeoutMs ?? this.timeoutMs;
    const model = options.model ?? this.model;
    const prompt = buildSemanticPrompt(query, catalogCategories, options.catalogProducts);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Gemini API error [${response.status}]: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return parseAndValidateAIResponse(rawContent, catalogCategories);
  }
}

