import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faGift } from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { LoyaltyProgramForm } from "../../components/merchant/rewards/LoyaltyProgramForm";
import { loyaltyProgramService } from "../../services/loyaltyProgramService";

export const CreateLoyaltyProgram = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (payload) => {
    setIsSubmitting(true);
    try {
      const response = await loyaltyProgramService.createProgram(payload);
      toast.success(
        response.message || "Loyalty program created successfully!",
      );
      // Redirect to loyalty programs listing
      navigate("/merchant/loyalty-programs", { replace: true });
    } catch (err) {
      console.error("Create loyalty program failed:", err);
      // Extract validation error messages if returned by Laravel (422)
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(" ");
        toast.error(errorMessages || "Please correct the highlighted errors.");
      } else {
        const message =
          err.response?.data?.message ||
          "Unable to create loyalty program. Please try again.";
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Merchant Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area */}
      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Header with Back Navigation */}
        <header className="border-b border-[#F4F0EA] pb-6">
          <Link
            to="/merchant/loyalty-programs"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#23140C]/75 hover:text-[#A51D27] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Loyalty Programs</span>
          </Link>

          <div className="mt-3.5 flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#A51D27]">
              <FontAwesomeIcon icon={faGift} className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-[26px] sm:text-[28px] font-bold tracking-tight text-[#23140C]">
                Create Loyalty Program
              </h1>
              <p className="mt-0.5 text-[13.5px] sm:text-[14px] text-[#23140C]/75">
                Set up your stamp thresholds, earning rules, and the reward your customers unlock.
              </p>
            </div>
          </div>
        </header>

        {/* Form Container */}
        <div className="mt-8 max-w-4xl">
          <LoyaltyProgramForm
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
            onCancel={() => navigate("/merchant/loyalty-programs")}
          />
        </div>
      </main>
    </div>
  );
};

export default CreateLoyaltyProgram;

