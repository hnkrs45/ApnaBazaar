/**
 * Prompt building and response validation helpers for AI Suggestion Providers.
 */

/**
 * Builds the classification prompt sent to AI models.
 * Enforces JSON-only output and strict category selection from the provided catalog.
 *
 * @param {string} query - User search query
 * @param {string[]} catalogCategories - List of allowed catalog category names
 * @param {Array<string|object>} [catalogProducts=[]] - Optional sample product names
 * @returns {string} Formatted prompt string
 */
export function buildSemanticPrompt(query, catalogCategories = [], catalogProducts = []) {
  const categoriesList = catalogCategories.length > 0
    ? catalogCategories.join(", ")
    : "None provided";

  let productsSection = "";
  if (Array.isArray(catalogProducts) && catalogProducts.length > 0) {
    const productNames = catalogProducts
      .slice(0, 30)
      .map(p => {
        if (typeof p === "string") return p;
        if (p && typeof p === "object") {
          return p.name?.en || p.name?.hi || p.name || "";
        }
        return "";
      })
      .filter(Boolean);

    if (productNames.length > 0) {
      productsSection = `Available Catalog Products (sample):\n${productNames.join(", ")}\n\n`;
    }
  }

  return `You are a search query classification and semantic assistant for ApnaBazaar, an agricultural & grocery marketplace.
Your task is to analyze the user's search query, determine relevant categories strictly from the available catalog, and extract or suggest clean search keywords.

Available Catalog Categories:
[${categoriesList}]

${productsSection}User Search Query: "${query}"

STRICT RULES:
1. Return ONLY a valid JSON object matching this schema:
{
  "categories": ["CategoryName"],
  "keywords": ["keyword1", "keyword2"]
}
2. "categories" MUST ONLY contain category names chosen strictly from the "Available Catalog Categories" listed above. NEVER invent, translate, or hallucinate categories outside this list. If none match, return an empty array: [].
3. "keywords" should contain 1 to 4 clean, relevant search terms derived from the query, intent, or known product names related to the matching categories.
4. Output raw JSON ONLY. No markdown formatting, no backticks, no thought processes, and no explanations.`;
}

/**
 * Safely parses raw AI response text, extracts JSON, and validates items against the database catalog.
 * Any category not present in catalogCategories is strictly filtered out.
 *
 * @param {string} responseText - Raw text response from AI provider
 * @param {string[]} catalogCategories - Allowed catalog categories
 * @returns {{ categories: string[], keywords: string[] }}
 */
export function parseAndValidateAIResponse(responseText, catalogCategories = []) {
  if (!responseText || typeof responseText !== "string") {
    return { categories: [], keywords: [] };
  }

  let cleaned = responseText.trim();

  // Strip markdown code fences if present (e.g., ```json ... ``` or ``` ... ```)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Extract JSON object if surrounded by any extra text
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { categories: [], keywords: [] };
  }

  if (!parsed || typeof parsed !== "object") {
    return { categories: [], keywords: [] };
  }

  // Build a lookup map of catalog categories (case-insensitive)
  // maps lowercase string -> canonical casing from catalog
  const catalogMap = new Map();
  if (Array.isArray(catalogCategories)) {
    for (const cat of catalogCategories) {
      if (typeof cat === "string" && cat.trim()) {
        catalogMap.set(cat.trim().toLowerCase(), cat.trim());
      }
    }
  }

  // Validate and filter categories
  const validatedCategories = [];
  if (Array.isArray(parsed.categories)) {
    for (const item of parsed.categories) {
      if (typeof item === "string") {
        const canonical = catalogMap.get(item.trim().toLowerCase());
        // Only keep if it exists in the catalog and not already added
        if (canonical && !validatedCategories.includes(canonical)) {
          validatedCategories.push(canonical);
        }
      }
    }
  }

  // Validate and sanitize keywords
  const validatedKeywords = [];
  if (Array.isArray(parsed.keywords)) {
    for (const kw of parsed.keywords) {
      if (typeof kw === "string") {
        const clean = kw.trim().toLowerCase();
        if (clean && !validatedKeywords.includes(clean)) {
          validatedKeywords.push(clean);
        }
      }
    }
  }

  return {
    categories: validatedCategories,
    keywords: validatedKeywords.slice(0, 5)
  };
}

