/**
 * Deterministic Layers 1 & 2 Fallback Suggestion Service.
 *
 * Layer 1: Exact & Substring Match against catalog category names.
 * Layer 2: Agricultural & Grocery Keyword/Synonym Dictionary mapping
 *          (covering English, Hindi, and transliterated Hinglish).
 *
 * Used when AI providers are unavailable, disabled, fail, or time out.
 */

// Dictionary mapping synonyms and keywords to catalog categories
const CATEGORY_SYNONYMS = {
  Grains: [
    "grain", "grains", "wheat", "gehu", "gehun", "sharbati", "rice", "chawal",
    "basmati", "paddy", "flour", "atta", "maida", "suji", "rawa", "semolina",
    "millet", "bajra", "jowar", "sorghum", "corn", "makka", "barley", "jau",
    "oats", "cereal", "cereals"
  ],
  Vegetables: [
    "vegetable", "vegetables", "sabzi", "sabji", "veggie", "veggies",
    "onion", "pyaz", "pyaaz", "potato", "aloo", "alu", "tomato", "tamatar",
    "garlic", "lehsun", "ginger", "adrak", "chilli", "mirch", "spinach", "palak",
    "cauliflower", "gobi", "gobhi", "cabbage", "patta gobi", "carrot", "gajar",
    "radish", "mooli", "pea", "peas", "matar", "brinjal", "baingan", "eggplant",
    "okra", "bhindi", "ladyfinger", "cucumber", "kheera", "capsicum", "shimla mirch",
    "pumpkin", "kaddu", "bottle gourd", "lauki", "bitter gourd", "karela"
  ],
  Fruits: [
    "fruit", "fruits", "phal", "apple", "seb", "mango", "aam", "banana", "kela",
    "orange", "santra", "mosambi", "citrus", "guava", "amrood", "grapes", "angoor",
    "papaya", "papita", "pomegranate", "anar", "watermelon", "tarbooz",
    "muskmelon", "kharbooja", "pineapple", "ananas", "strawberry", "lemon", "nimbu",
    "lime", "litchi", "lychee", "chikoo", "sapota", "coconut", "nariyal"
  ],
  Pulses: [
    "pulse", "pulses", "dal", "daal", "lentil", "lentils", "gram", "chana",
    "kala chana", "kabuli chana", "chickpeas", "moong", "mung", "green gram",
    "toor", "tur", "arhar", "pigeon pea", "urad", "black gram", "masoor",
    "red lentil", "rajma", "kidney beans", "chawli", "lobia", "soyabean", "soybean",
    "besan"
  ],
  Spices: [
    "spice", "spices", "masala", "masale", "turmeric", "haldi", "cumin", "jeera",
    "coriander", "dhaniya", "cardamom", "elaichi", "clove", "laung", "cinnamon",
    "dalchini", "black pepper", "kali mirch", "mustard", "sarson", "rai",
    "fenugreek", "methi", "fennel", "saunf", "asafoetida", "hing", "nutmeg",
    "jaiphal", "bay leaf", "tejpatta", "red chilli", "lal mirch"
  ],
  "Dairy & Eggs": [
    "dairy", "milk", "doodh", "paneer", "cheese", "butter", "makhan", "curd",
    "dahi", "yogurt", "ghee", "cream", "malai", "egg", "eggs", "anda", "ande"
  ],
  "Dry Fruits": [
    "dry fruit", "dry fruits", "kaju", "cashew", "badam", "almond", "kishmish",
    "raisin", "raisins", "walnut", "akhrot", "pista", "pistachio", "dates",
    "khajoor", "anjeer", "fig", "nuts"
  ],
  "Edible Oils & Ghee": [
    "oil", "oils", "tel", "mustard oil", "sarson ka tel", "sunflower oil",
    "groundnut oil", "olive oil", "refined oil", "ghee", "desi ghee"
  ],
  "Snacks & Beverages": [
    "snack", "snacks", "beverage", "beverages", "tea", "chai", "coffee",
    "biscuit", "biscuits", "cookies", "namkeen", "chips", "juice"
  ],
  "Bakery & Breads": [
    "bakery", "bread", "breads", "pav", "bun", "toast", "rusk", "cake"
  ],
  "Groceries & Staples": [
    "grocery", "groceries", "staple", "staples", "pantry", "sugar", "cheeni",
    "salt", "namak", "jaggery", "gud", "poha"
  ]
};

/**
 * Fallback suggestion matcher executing Layer 1 (exact/substring) and Layer 2 (synonyms).
 *
 * @param {string} query - Raw search query
 * @param {string[]} catalogCategories - Available categories from the database catalog
 * @returns {{ categories: string[], keywords: string[] }}
 */
export function fallbackSuggestionMatcher(query, catalogCategories = []) {
  if (!query || typeof query !== "string" || !query.trim()) {
    return { categories: [], keywords: [] };
  }

  const rawQuery = query.trim().toLowerCase();
  // Normalize tokens (remove punctuation, split by whitespace)
  const tokens = rawQuery
    .replace(/[^\w\s\u0900-\u097F]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1);

  const matchedCategories = new Set();
  const suggestedKeywords = new Set();

  // Create case-insensitive map of available catalog categories
  const categoryMap = new Map();
  for (const cat of catalogCategories) {
    if (typeof cat === "string" && cat.trim()) {
      categoryMap.set(cat.trim().toLowerCase(), cat.trim());
    }
  }

  // Helper to add category if it exists in the active catalog
  const tryAddCategory = (targetName) => {
    const canonical = categoryMap.get(targetName.toLowerCase());
    if (canonical) {
      matchedCategories.add(canonical);
    }
  };

  // -------------------------------------------------------------
  // Layer 1: Exact & Substring Match
  // -------------------------------------------------------------
  for (const [lowerCat, canonical] of categoryMap.entries()) {
    // Exact match or query contains category name
    if (rawQuery === lowerCat || rawQuery.includes(lowerCat)) {
      matchedCategories.add(canonical);
      suggestedKeywords.add(lowerCat);
    }
    // Category name contains a query token of length > 2
    for (const token of tokens) {
      if (token.length > 2 && lowerCat.includes(token)) {
        matchedCategories.add(canonical);
        suggestedKeywords.add(token);
      }
    }
  }

  // -------------------------------------------------------------
  // Layer 2: Keyword & Synonym Dictionary Match
  // -------------------------------------------------------------
  for (const [targetCat, synonymList] of Object.entries(CATEGORY_SYNONYMS)) {
    // Check multi-word phrase matches first (e.g. "black pepper", "kidney beans")
    for (const synonym of synonymList) {
      if (synonym.includes(" ") && rawQuery.includes(synonym)) {
        tryAddCategory(targetCat);
        suggestedKeywords.add(synonym);
      }
    }

    // Check individual token matches
    for (const token of tokens) {
      if (synonymList.includes(token)) {
        tryAddCategory(targetCat);
        suggestedKeywords.add(token);
      }
    }
  }

  // Also include the original query as a keyword if not empty
  if (tokens.length > 0) {
    suggestedKeywords.add(tokens.join(" "));
  }

  return {
    categories: Array.from(matchedCategories),
    keywords: Array.from(suggestedKeywords).slice(0, 5)
  };
}

