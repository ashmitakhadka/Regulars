import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faGift } from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { RewardProgramForm } from "../../components/merchant/rewards/RewardProgramForm";
import { rewardProgramService } from "../../services/rewardProgramService";

export const CreateRewardProgram = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (payload) => {
    setIsSubmitting(true);
    try {
      const response = await rewardProgramService.createProgram(payload);
      toast.success(
        response.message || "Reward program created successfully!",
      );
      // Redirect to reward programs listing or details
      navigate("/merchant/reward-programs", { replace: true });
    } catch (err) {
      console.error("Create reward program failed:", err);
      // Extract validation error messages if returned by Laravel (422)
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(" ");
        toast.error(errorMessages || "Please correct the highlighted errors.");
      } else {
        const message =
          err.response?.data?.message ||
          "Unable to create reward program. Please try again.";
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
            to="/merchant/reward-programs"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#23140C]/60 hover:text-[#A51D27] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Reward Programs</span>
          </Link>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#A51D27]">
              <FontAwesomeIcon icon={faGift} className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#23140C] sm:text-3xl">
                Create Reward Program
              </h1>
              <p className="mt-0.5 text-xs text-[#23140C]/60 sm:text-sm">
                Set up your stamp thresholds, earning rules, and the reward your customers unlock.
              </p>
            </div>
          </div>
        </header>

        {/* Form Container */}
        <div className="mt-8 max-w-4xl">
          <RewardProgramForm
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
            onCancel={() => navigate("/merchant/reward-programs")}
          />
        </div>
      </main>
    </div>
  );
};

export default CreateRewardProgram;
