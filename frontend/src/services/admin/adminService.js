import api from "../api";
import { customerAuthService } from "../customer/customerAuthService";

/**
 * Superadmin API Service using Sanctum stateful cookie sessions.
 */
export const adminService = {
  /**
   * Log in superadmin with email and password.
   * Reuses the existing getCsrfCookie() helper.
   */
  async login(credentials) {
    await customerAuthService.getCsrfCookie();
    const response = await api.post("/login/admin", credentials);
    return response.data;
  },

  /**
   * Terminate current superadmin session.
   */
  async logout() {
    const response = await api.post("/logout/admin");
    return response.data;
  },

  /**
   * Fetch current authenticated superadmin profile.
   */
  async me() {
    const response = await api.get("/admin/me");
    return response.data;
  },

  /**
   * Retrieve platform statistics.
   */
  async getStats() {
    const response = await api.get("/admin/stats");
    return response.data;
  },

  /**
   * Retrieve paginated list of merchants with filters.
   */
  async getMerchants(params = {}, signal) {
    const response = await api.get("/admin/merchants", {
      params,
      signal,
    });
    return response.data;
  },

  /**
   * Retrieve single merchant profile, stats and recent activity.
   */
  async getMerchant(id, signal) {
    const response = await api.get(`/admin/merchants/${id}`, {
      signal,
    });
    return response.data;
  },

  /**
   * Update merchant status (active | suspended).
   */
  async setMerchantStatus(id, status) {
    const response = await api.patch(`/admin/merchants/${id}/status`, { status });
    return response.data;
  },

  /**
   * Update merchant pro status (true | false).
   */
  async setMerchantPro(id, isPro) {
    const response = await api.patch(`/admin/merchants/${id}/pro`, { is_pro: isPro });
    return response.data;
  },
};

export default adminService;
