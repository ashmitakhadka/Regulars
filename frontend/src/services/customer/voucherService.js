import api from "../api";

/**
 * Customer Voucher API service.
 * Handles fetching customer vouchers with status filter/pagination and individual voucher details.
 */
export const voucherService = {
  /**
   * Fetch customer vouchers with optional filter (status, page, per_page).
   * If status is 'all' or empty, the status parameter is omitted to retrieve all vouchers.
   * @param {Object} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{ success: boolean, data: { vouchers: Array, summary: Object, pagination: Object }, message: string }>}
   */
  async getVouchers(params = {}, signal) {
    const cleanParams = { ...params };
    if (!cleanParams.status || cleanParams.status === "all") {
      delete cleanParams.status;
    }
    const response = await api.get("/customer/vouchers", {
      params: cleanParams,
      signal,
    });
    return response.data;
  },

  /**
   * Fetch details for a single voucher by ID.
   * @param {number|string} id
   * @param {AbortSignal} [signal]
   * @returns {Promise<{ success: boolean, data: { voucher: Object }, message: string }>}
   */
  async getVoucher(id, signal) {
    const response = await api.get(`/customer/vouchers/${id}`, {
      signal,
    });
    return response.data;
  },
};

export default voucherService;
