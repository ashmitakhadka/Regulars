import api from "./api";

/**
 * Merchant Products API Service
 * Interacts with Laravel Sanctum-authenticated endpoints at /api/merchant/products
 */
export const productService = {
  /**
   * Fetch all products belonging to the authenticated merchant
   * GET /merchant/products
   */
  async getProducts() {
    const response = await api.get("/merchant/products");
    return response.data;
  },

  /**
   * Fetch a single product's details
   * GET /merchant/products/:id
   */
  async getProductDetails(id) {
    const response = await api.get(`/merchant/products/${id}`);
    return response.data;
  },

  /**
   * Create a new product for the merchant catalog
   * POST /merchant/products
   * @param {{ name: string, description?: string, price: number }} payload
   */
  async createProduct(payload) {
    const response = await api.post("/merchant/products", payload);
    return response.data;
  },

  /**
   * Update an existing product
   * PUT /merchant/products/:id
   * @param {number|string} id
   * @param {{ name?: string, description?: string, price?: number, status?: 'active'|'inactive' }} payload
   */
  async updateProduct(id, payload) {
    const response = await api.put(`/merchant/products/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a product
   * DELETE /merchant/products/:id
   */
  async deleteProduct(id) {
    const response = await api.delete(`/merchant/products/${id}`);
    return response.data;
  },
};

export default productService;

