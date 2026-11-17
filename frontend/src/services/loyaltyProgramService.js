import api from "./api";

/**
 * Merchant Loyalty Programs API Service
 * Interacts with Laravel Sanctum-authenticated endpoints at /api/merchant/reward-programs
 * (Note: Backend API endpoints remain unchanged)
 */
export const loyaltyProgramService = {
  /**
   * Fetch all loyalty programs for the authenticated merchant
   * GET /merchant/reward-programs
   */
  async getAllPrograms() {
    const response = await api.get("/merchant/reward-programs");
    return response.data;
  },

  /**
   * Create a new loyalty program with initial earning rule and reward
   * POST /merchant/reward-programs
   */
  async createProgram(payload) {
    const response = await api.post("/merchant/reward-programs", payload);
    return response.data;
  },

  /**
   * Fetch single loyalty program details with versions, earning rules, and rewards
   * GET /merchant/reward-programs/:id
   */
  async getProgramDetails(id) {
    const response = await api.get(`/merchant/reward-programs/${id}`);
    return response.data;
  },

  /**
   * Update basic loyalty program information (name, description only)
   * PUT /merchant/reward-programs/:id
   */
  async updateProgram(id, payload) {
    const response = await api.put(`/merchant/reward-programs/${id}`, payload);
    return response.data;
  },

  /**
   * Activate or deactivate loyalty program status
   * PATCH /merchant/reward-programs/:id/status
   * @param {string|number} id
   * @param {'active'|'inactive'} status
   */
  async updateProgramStatus(id, status) {
    const response = await api.patch(`/merchant/reward-programs/${id}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Soft-archive loyalty program without deleting historical loyalty records
   * DELETE /merchant/reward-programs/:id
   */
  async archiveProgram(id) {
    const response = await api.delete(`/merchant/reward-programs/${id}`);
    return response.data;
  },
};

export default loyaltyProgramService;

