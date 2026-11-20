import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BackButton, Card } from "../../components/ui";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { LoyaltyProgramForm } from "../../components/merchant/rewards/LoyaltyProgramForm";
import { loyaltyProgramService } from "../../services/loyaltyProgramService";

const LIST_PATH = "/merchant/loyalty-programs";

export const CreateLoyaltyProgram = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (payload) => {
    setIsSubmitting(true);
    try {
      const response = await loyaltyProgramService.createProgram(payload);
      toast.success(response.message || "Loyalty program created.");
      navigate(LIST_PATH, { replace: true });
    } catch (err) {
      console.error("Create loyalty program failed:", err);
      const validation = err.response?.data?.errors;
      toast.error(
        err.response?.status === 422 && validation
          ? Object.values(validation).flat().join(" ")
          : err.response?.data?.message ||
              "Couldn't create the program. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <MerchantSidebar />

      <main className="w-full min-w-0 flex-1 bg-white p-4 sm:p-6 lg:p-8">
        {/* Header: left aligned */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <BackButton size="xs" to={LIST_PATH} iconOnly />
            <h1 className="font-display text-xl font-bold tracking-tight text-brand-900 sm:text-2xl lg:text-3xl">
              Create loyalty program
            </h1>
          </div>
        </header>

        {/* Form card: centered and wider */}
        <div className="mx-auto w-full max-w-4xl">
          <Card padding="p-4 sm:p-7 lg:p-10">
            <LoyaltyProgramForm
              onSubmit={handleCreate}
              isSubmitting={isSubmitting}
              onCancel={() => navigate(LIST_PATH)}
            />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateLoyaltyProgram;
