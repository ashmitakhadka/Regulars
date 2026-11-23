import api from "../api";

/**
 * Customer Loyalty Program Join API service.
 * Connects to Laravel customer join endpoints with Sanctum stateful cookie auth.
 */
export const joinService = {
  /**
   * Join a single loyalty program by ID.
   * Returns { success: true, data: { card, already_joined }, message }
   */
  async joinProgram(id, signal) {
    const response = await api.post(`/customer/programs/${id}/join`, {}, { signal });
    return response.data;
  },

  /**
   * Bulk join multiple loyalty programs by IDs.
   * Accepts array of 1 to 10 distinct integer IDs.
   * Returns { success: true, data: { results: [{ program_id, status, card }] }, message }
   */
  async joinPrograms(programIds, signal) {
    const response = await api.post(
      "/customer/programs/join",
      { program_ids: programIds },
      { signal }
    );
    return response.data;
  },
};

export default joinService;
