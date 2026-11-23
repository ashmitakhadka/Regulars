import api from "../api";
import customerAuthService from "./customerAuthService";

/**
 * Customer Profile API service.
 * Handles fetching the customer profile and updating name/phone with CSRF cookie initialization.
 */
export const profileService = {
  /**
   * Retrieve the authenticated customer's profile.
   * @param {AbortSignal} [signal]
   * @returns {Promise<{ success: boolean, data: { id: number, name: string, email: string, phone: string, customer_code: string, member_since: string }, message: string }>}
   */
  async getProfile(signal) {
    const response = await api.get("/customer/profile", { signal });
    return response.data;
  },

  /**
   * Update the customer's name and phone.
   * Automatically initializes CSRF cookie before making the PATCH request.
   * @param {{ name: string, phone: string }} payload
   * @param {AbortSignal} [signal]
   * @returns {Promise<{ success: boolean, data: { id: number, name: string, email: string, phone: string, customer_code: string, member_since: string }, message: string }>}
   */
  async updateProfile(payload, signal) {
    await customerAuthService.getCsrfCookie();
    const response = await api.patch("/customer/profile", payload, { signal });
    return response.data;
  },
};

export default profileService;
