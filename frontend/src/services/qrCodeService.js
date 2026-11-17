import api from "./api";

const qrCodeService = {
  // Retrieve or generate the merchant's Business QR
  async getBusinessQr() {
    const response = await api.post("/merchant/qr-codes/business");
    return response.data.data;
  },

  // Retrieve or generate a specific program's QR
  async getProgramQr(programId) {
    const response = await api.post(
      `/merchant/loyalty-programs/${programId}/qr-codes`,
    );
    return response.data.data;
  },
};

export default qrCodeService;
