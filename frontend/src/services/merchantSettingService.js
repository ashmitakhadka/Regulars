import api from "./api";

/**
 * Merchant Settings API Service
 * Interacts with the existing /merchant/me endpoint
 */
export const merchantSettingService = {
  /**
   * Fetch merchant and user profile details
   * GET /merchant/me
   */
  async getSettings() {
    const response = await api.get("/merchant/me");
    return response.data;
  },

  /**
   * Update merchant business information
   * PUT /merchant/me
   * @param {{ business_name: string, phone?: string, address?: string }} payload
   */
  async updateBusinessProfile(payload) {
    const response = await api.put("/merchant/me", payload);
    return response.data;
  },

  /**
   * Update account owner personal information
   * PUT /merchant/me
   * @param {{ name: string, email: string, personal_phone?: string }} payload
   */
  async updatePersonalAccount(payload) {
    const response = await api.put("/merchant/me", payload);
    return response.data;
  },

  /**
   * Update merchant account password
   * PUT /merchant/me
   * @param {{ current_password: string, password: string, password_confirmation: string }} payload
   */
  async updatePassword(payload) {
    const response = await api.put("/merchant/me", payload);
    return response.data;
  },
};

export default merchantSettingService;
