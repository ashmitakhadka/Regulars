import api from "./api";

/**
 * Merchant Voucher Redemption Service
 */
export const voucherService = {
  /**
   * Redeem a customer reward voucher by its code
   * POST /merchant/vouchers/redeem
   * @param {string} code
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: {
   *     voucher_id: number,
   *     code: string,
   *     customer_id: number,
   *     reward_title: string,
   *     reward_type: string,
   *     reward_value: number,
   *     status: string,
   *     redeemed_at: string
   *   }
   * }>}
   */
  async redeemVoucher(code) {
    const response = await api.post("/merchant/vouchers/redeem", {
      code: code.trim().toUpperCase(),
    });
    return response.data;
  },
  getStats: () => api.get("/merchant/vouchers/stats").then((res) => res.data),

  getVouchers: (params = {}) =>
    api.get("/merchant/vouchers", { params }).then((res) => res.data),
};

export default voucherService;
