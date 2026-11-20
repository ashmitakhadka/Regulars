import api from "../api";

/**
 * Customer Wallet API service.
 * Handles fetching active stamp cards, wallet summary, and individual card details.
 */
export const walletService = {
  /**
   * Retrieve the authenticated customer's active stamp cards and summary statistics.
   * Supports AbortSignal to cancel stale requests.
   */
  async getWallet(signal) {
    const response = await api.get("/customer/wallet", {
      signal,
    });
    return response.data;
  },

  /**
   * Retrieve details for a single stamp card (active or completed), including
   * reward snapshot, streak details, and the 30 most recent visits.
   */
  async getCard(id, signal) {
    const response = await api.get(`/customer/stamp-cards/${id}`, {
      signal,
    });
    return response.data;
  },
};

export default walletService;
