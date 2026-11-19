import api from "./api";

/**
 * Merchant Customer Management & Stamp Awarding API Service
 */
export const customerService = {
  /**
   * Fetch all customers enrolled in this merchant's loyalty programs
   * GET /merchant/customers
   * @param {{ search?: string, per_page?: number }} params
   */
  async getCustomers(params = {}) {
    const response = await api.get("/merchant/customers", { params });
    return response.data;
  },

  /**
   * Fetch single customer details with their enrolled stamp cards
   * GET /merchant/customers/:id
   */
  async getCustomerDetails(customerId) {
    const response = await api.get(`/merchant/customers/${customerId}`);
    return response.data;
  },

  /**
   * Fetch customer activity timeline (stamps earned, vouchers issued/redeemed)
   * GET /merchant/customers/:id/activity
   */
  async getCustomerActivity(customerId) {
    const response = await api.get(
      `/merchant/customers/${customerId}/activity`,
    );
    return response.data;
  },

  /**
   * Enroll a customer into an active loyalty program
   * POST /merchant/customer/enroll
   * @param {{ loyalty_program_id: number, identifier_type: 'customer_code'|'phone', identifier: string }} payload
   */
  async enrollCustomer(payload) {
    const response = await api.post("/merchant/customer/enroll", payload);
    return response.data;
  },

  /**
   * Award stamps to a customer's active stamp card
   * POST /merchant/stamps/award
   * @param {{
   *   stamp_card_id: number,
   *   idempotency_key: string,
   *   purchase_amount?: number,
   *   product_id?: number,
   *   quantity?: number
   * }} payload
   */
  async awardStamps(payload) {
    const response = await api.post("/merchant/stamps/award", payload);
    return response.data;
  },

  async getAllCustomersRecentActivity() {
    const response = await api.get("/merchant/customers/recent-activity");
    return response.data;
  },
};

export default customerService;
