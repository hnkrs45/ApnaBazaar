import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  BaseProvider,
  GeminiProvider,
  fallbackSuggestionMatcher,
  buildSemanticPrompt,
  parseAndValidateAIResponse,
  AISuggestionService
} from "../services/ai/index.js";

const CATALOG_CATEGORIES = ["Grains", "Vegetables", "Fruits", "Pulses", "Spices"];

describe("AI Provider Abstraction - Common Interface & Contract", () => {
  test("BaseProvider cannot be directly instantiated", () => {
    assert.throws(
      () => new BaseProvider("test"),
      /BaseProvider is abstract/
    );
  });

  test("Derived provider must implement contract", () => {
    class IncompleteProvider extends BaseProvider {
      constructor() {
        super("incomplete");
      }
    }
    const instance = new IncompleteProvider();
    assert.throws(() => instance.isConfigured(), /isConfigured\(\) must be implemented/);
    assert.rejects(
      () => instance.getSemanticSuggestions("apple", CATALOG_CATEGORIES),
      /getSemanticSuggestions\(\) must be implemented/
    );
  });
});

describe("Prompt Helper & Response Validation", () => {
  test("buildSemanticPrompt includes categories, user query, and strict rules", () => {
    const prompt = buildSemanticPrompt("fresh red apples", CATALOG_CATEGORIES);
    assert.match(prompt, /Grains, Vegetables, Fruits, Pulses, Spices/);
    assert.match(prompt, /fresh red apples/);
    assert.match(prompt, /STRICT RULES/);
    assert.match(prompt, /Return ONLY a valid JSON object/);
    assert.match(prompt, /NEVER invent, translate, or hallucinate/);
  });

  test("parseAndValidateAIResponse cleanly parses clean JSON", () => {
    const raw = JSON.stringify({
      categories: ["Fruits"],
      keywords: ["apples", "red apple"]
    });
    const result = parseAndValidateAIResponse(raw, CATALOG_CATEGORIES);
    assert.deepEqual(result.categories, ["Fruits"]);
    assert.deepEqual(result.keywords, ["apples", "red apple"]);
  });

  test("parseAndValidateAIResponse handles markdown code fences", () => {
    const raw = "```json\n{\"categories\": [\"Grains\"], \"keywords\": [\"sharbati gehu\"]}\n```";
    const result = parseAndValidateAIResponse(raw, CATALOG_CATEGORIES);
    assert.deepEqual(result.categories, ["Grains"]);
    assert.deepEqual(result.keywords, ["sharbati gehu"]);
  });

  test("parseAndValidateAIResponse strictly rejects hallucinated/unlisted categories", () => {
    const raw = JSON.stringify({
      categories: ["Electronics", "Fruits", "Clothing", "grains"],
      keywords: ["smart phone", "mango", "wheat"]
    });
    const result = parseAndValidateAIResponse(raw, CATALOG_CATEGORIES);
    // Electronics and Clothing do not exist in catalog, so they must be stripped
    // 'grains' should be canonicalized to 'Grains'
    assert.deepEqual(result.categories, ["Fruits", "Grains"]);
    assert.deepEqual(result.keywords, ["smart phone", "mango", "wheat"]);
  });

  test("parseAndValidateAIResponse safely handles invalid or corrupt output", () => {
    const result1 = parseAndValidateAIResponse("Not a json at all", CATALOG_CATEGORIES);
    assert.deepEqual(result1, { categories: [], keywords: [] });

    const result2 = parseAndValidateAIResponse(null, CATALOG_CATEGORIES);
    assert.deepEqual(result2, { categories: [], keywords: [] });
  });
});

describe("Layer 1 & Layer 2 Fallback Service", () => {
  test("Layer 1: Exact and substring match", () => {
    const result = fallbackSuggestionMatcher("fruits", CATALOG_CATEGORIES);
    assert.ok(result.categories.includes("Fruits"));
  });

  test("Layer 2: Agricultural Hindi / Hinglish keyword match (Grains)", () => {
    const result = fallbackSuggestionMatcher("sharbati gehun 50kg atta", CATALOG_CATEGORIES);
    assert.ok(result.categories.includes("Grains"));
    assert.ok(result.keywords.includes("gehun") || result.keywords.includes("atta"));
  });

  test("Layer 2: Agricultural Hindi / Hinglish keyword match (Vegetables)", () => {
    const result = fallbackSuggestionMatcher("desi aloo and pyaaz", CATALOG_CATEGORIES);
    assert.ok(result.categories.includes("Vegetables"));
    assert.ok(result.keywords.includes("aloo") || result.keywords.includes("pyaaz"));
  });

  test("Layer 2: Agricultural keyword match (Pulses & Spices)", () => {
    const result1 = fallbackSuggestionMatcher("toor dal and rajma", CATALOG_CATEGORIES);
    assert.ok(result1.categories.includes("Pulses"));

    const result2 = fallbackSuggestionMatcher("haldi powder and kali mirch", CATALOG_CATEGORIES);
    assert.ok(result2.categories.includes("Spices"));
  });

  test("Returns empty arrays for empty/whitespace query", () => {
    assert.deepEqual(fallbackSuggestionMatcher("", CATALOG_CATEGORIES), {
      categories: [],
      keywords: []
    });
    assert.deepEqual(fallbackSuggestionMatcher("   ", CATALOG_CATEGORIES), {
      categories: [],
      keywords: []
    });
  });
});

describe("GeminiProvider", () => {
  test("isConfigured reflects API key presence", () => {
    const unconfigured = new GeminiProvider({ apiKey: "" });
    assert.equal(unconfigured.isConfigured(), false);

    const configured = new GeminiProvider({ apiKey: "AIzaSyDummyKey123" });
    assert.equal(configured.isConfigured(), true);
  });

  test("Throws error if called when not configured", async () => {
    const provider = new GeminiProvider({ apiKey: "" });
    await assert.rejects(
      () => provider.getSemanticSuggestions("mango", CATALOG_CATEGORIES),
      /GEMINI_API_KEY is not configured/
    );
  });

  test("Handles successful Gemini API response format", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      assert.ok(url.includes("models/gemini-2.5-flash:generateContent"));
      assert.ok(url.includes("key=test-gemini-key"));
      const body = JSON.parse(options.body);
      assert.equal(body.generationConfig.responseMimeType, "application/json");

      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      categories: ["Fruits"],
                      keywords: ["alphonso mango", "mangoes"]
                    })
                  }
                ]
              }
            }
          ]
        })
      };
    };

    try {
      const provider = new GeminiProvider({
        apiKey: "test-gemini-key",
        model: "gemini-2.5-flash"
      });
      const result = await provider.getSemanticSuggestions("sweet mango", CATALOG_CATEGORIES);
      assert.deepEqual(result.categories, ["Fruits"]);
      assert.deepEqual(result.keywords, ["alphonso mango", "mangoes"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("Propagates timeout / abort signal", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      return new Promise((resolve, reject) => {
        options.signal.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    };

    try {
      const provider = new GeminiProvider({
        apiKey: "test-gemini-key",
        timeoutMs: 50
      });
      await assert.rejects(
        () => provider.getSemanticSuggestions("mango", CATALOG_CATEGORIES),
        (err) => err.name === "AbortError" || err.name === "TimeoutError"
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("AISuggestionService - Orchestration & Fallback Chain", () => {
  test("Returns directly from Gemini when Gemini succeeds", async () => {
    const mockGemini = {
      name: "gemini",
      isConfigured: () => true,
      getSemanticSuggestions: async () => ({
        categories: ["Grains"],
        keywords: ["basmati rice"]
      })
    };

    const service = new AISuggestionService({
      geminiProvider: mockGemini
    });

    const result = await service.getSemanticSuggestions("rice", CATALOG_CATEGORIES);
    assert.equal(result.providerUsed, "gemini");
    assert.deepEqual(result.categories, ["Grains"]);
    assert.deepEqual(result.keywords, ["basmati rice"]);
  });

  test("Falls back to Layer 1-2 when Gemini fails (e.g. quota/timeout)", async () => {
    const mockGemini = {
      name: "gemini",
      isConfigured: () => true,
      getSemanticSuggestions: async () => {
        throw new Error("Gemini quota exceeded (429)");
      }
    };

    const service = new AISuggestionService({
      geminiProvider: mockGemini
    });

    const result = await service.getSemanticSuggestions("organic aam and kela", CATALOG_CATEGORIES);
    assert.equal(result.providerUsed, "layer-1-2-fallback");
    assert.ok(result.categories.includes("Fruits"));
  });

  test("Falls back directly to Layer 1-2 when Gemini is not configured", async () => {
    const mockGemini = {
      name: "gemini",
      isConfigured: () => false,
      getSemanticSuggestions: async () => {
        throw new Error("Not configured");
      }
    };

    const service = new AISuggestionService({
      geminiProvider: mockGemini
    });

    const result = await service.getSemanticSuggestions("chana dal", CATALOG_CATEGORIES);
    assert.equal(result.providerUsed, "layer-1-2-fallback");
    assert.ok(result.categories.includes("Pulses"));
  });
});
