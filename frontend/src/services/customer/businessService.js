import api from "../api";

/**
 * Customer Business & Loyalty Program API service.
 * Connects to Laravel customer directory endpoints with Sanctum stateful cookie auth.
 */
export const businessService = {
  /**
   * List active businesses with active programs.
   * Supports search, category, page, per_page, and AbortSignal.
   */
  async getBusinesses(params = {}, signal) {
    const response = await api.get("/customer/businesses", {
      params,
      signal,
    });
    return response.data;
  },

  /**
   * Retrieve single active business details with active programs by slug.
   */
  async getBusiness(slug, signal) {
    const response = await api.get(`/customer/businesses/${slug}`, {
      signal,
    });
    return response.data;
  },

  /**
   * Retrieve single active loyalty program details by ID.
   */
  async getProgram(id, signal) {
    const response = await api.get(`/customer/programs/${id}`, {
      signal,
    });
    return response.data;
  },
};

export default businessService;
