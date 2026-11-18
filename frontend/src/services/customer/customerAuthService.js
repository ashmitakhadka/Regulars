import api from "../api";

/**
 * Customer authentication API service using Sanctum stateful cookie sessions.
 */
export const customerAuthService = {
  /**
   * Initialize CSRF cookie for Sanctum session authentication.
   */
  async getCsrfCookie() {
    const backendUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
    return api.get("/sanctum/csrf-cookie", { baseURL: backendUrl });
  },

  /**
   * Register a new customer account.
   */
  async register(payload) {
    await this.getCsrfCookie();
    const response = await api.post("/register/customer", payload);
    return response.data;
  },

  /**
   * Log in customer with email and password.
   */
  async login(credentials) {
    await this.getCsrfCookie();
    const response = await api.post("/login/customer", credentials);
    return response.data;
  },

  /**
   * Terminate current customer session.
   */
  async logout() {
    const response = await api.post("/logout/customer");
    return response.data;
  },

  /**
   * Retrieve currently authenticated customer profile.
   */
  async me() {
    const response = await api.get("/customer/me");
    return response.data;
  },
};

export default customerAuthService;
