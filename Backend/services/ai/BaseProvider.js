/**
 * Common abstract interface for AI Semantic Suggestion Providers.
 */
export class BaseProvider {
  /**
   * @param {string} name - Identifier name of the provider
   */
  constructor(name) {
    if (this.constructor === BaseProvider) {
      throw new Error("BaseProvider is abstract and cannot be instantiated directly.");
    }
    this.name = name;
  }

  /**
   * Checks if the provider has valid configuration to make API calls.
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error(`isConfigured() must be implemented by ${this.name}.`);
  }

  /**
   * Generates semantic suggestions for the given query against catalog categories.
   *
   * @param {string} query - The search query from the user
   * @param {string[]} catalogCategories - List of valid categories from the database
   * @param {object} [options={}] - Additional options (e.g., timeoutMs, catalogProducts)
   * @returns {Promise<{ categories: string[], keywords: string[] }>}
   */
  async getSemanticSuggestions(query, catalogCategories = [], options = {}) {
    throw new Error(`getSemanticSuggestions() must be implemented by ${this.name}.`);
  }
}

