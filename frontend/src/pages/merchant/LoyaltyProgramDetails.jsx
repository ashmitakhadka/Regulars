import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { LoyaltyProgramDetailsCard } from "../../components/merchant/rewards/LoyaltyProgramDetailsCard";
import { ArchiveConfirmation } from "../../components/merchant/rewards/ArchiveConfirmation";
import { Spinner, ErrorState, Button, BackButton } from "../../components/ui";
import { loyaltyProgramService } from "../../services/loyaltyProgramService";

export const LoyaltyProgramDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status toggle modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Archive modal state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const loadProgram = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await loyaltyProgramService.getProgramDetails(id);
      setProgram(response.data);
    } catch (err) {
      console.error("Failed to fetch program details:", err);
      setError(
        err.response?.status === 404
          ? "Loyalty program not found. It may have been archived or does not exist."
          : err.response?.data?.message ||
              "Unable to load loyalty program details. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    loyaltyProgramService
      .getProgramDetails(id)
      .then((res) => {
        if (!ignore) {
          setProgram(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to fetch program details:", err);
          setError(
            err.response?.status === 404
              ? "Loyalty program not found. It may have been archived or does not exist."
              : err.response?.data?.message ||
                  "Unable to load loyalty program details. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const isArchived = program?.status === "archived";
  const isActive = program?.status === "active";
  const targetStatus = isActive ? "inactive" : "active";

  const handleToggleStatus = async () => {
    if (!program || isArchived) return;

    setIsUpdatingStatus(true);
    try {
      const response = await loyaltyProgramService.updateProgramStatus(
        program.id,
        targetStatus,
      );

      setProgram((prev) => ({ ...prev, status: targetStatus }));

      toast.success(
        response.message ||
          `Program ${targetStatus === "active" ? "activated" : "deactivated"}.`,
      );
      setStatusModalOpen(false);
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(
        err.response?.data?.message ||
          "Couldn't update the program status. Try again.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleArchive = async () => {
    if (!program || isArchived) return;

    setIsArchiving(true);
    try {
      const response = await loyaltyProgramService.archiveProgram(program.id);
      toast.success(response.message || "Program archived.");
      setArchiveModalOpen(false);
      navigate("/merchant/loyalty-programs", { replace: true });
    } catch (err) {
      console.error("Archive loyalty program failed:", err);
      toast.error(
        err.response?.data?.message ||
          "Couldn't archive the program. Try again.",
      );
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <MerchantSidebar />

      <main className="w-full min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#F4F0EA]/40 p-8">
            <Spinner size="md" />
            <p className="text-[14px] font-medium text-[#23140C]/75">
              Loading program...
            </p>
          </div>
        )}

        {/* Error / 404 */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50/40 p-8">
            <ErrorState
              title="Program not available"
              message={error}
              action={
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={loadProgram}>
                    Try again
                  </Button>
                  <Button
                    to="/merchant/loyalty-programs"
                    variant="primary"
                    size="sm"
                  >
                    Back to programs
                  </Button>
                </div>
              }
            />
          </div>
        )}

        {/* Content */}
        {!loading && !error && program && (
          <>
            {/* Back arrow, title and actions */}
            <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <BackButton
                  size="xs"
                  to="/merchant/loyalty-programs"
                  iconOnly
                />
                <h1 className="truncate font-display text-xl font-bold tracking-tight text-[#23140C] sm:text-2xl lg:text-3xl">
                  {program.name}
                </h1>
              </div>

              {!isArchived && (
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Button
                    to={`/merchant/loyalty-programs/${program.id}/edit`}
                    variant="soft"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                  >
                    Edit
                  </Button>

                  <Button
                    variant={isActive ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => setStatusModalOpen(true)}
                    className="flex-1 sm:flex-initial"
                  >
                    {isActive ? "Deactivate" : "Activate"}
                  </Button>

                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => setArchiveModalOpen(true)}
                    className="flex-1 sm:flex-initial"
                  >
                    Archive
                  </Button>
                </div>
              )}
            </header>

            <LoyaltyProgramDetailsCard program={program} />

            {/* Status change confirmation */}
            {statusModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#23140C]/50 p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="status-modal-title"
              >
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
                  <h3
                    id="status-modal-title"
                    className="font-display text-[18px] font-bold text-[#23140C]"
                  >
                    {isActive
                      ? "Deactivate this program?"
                      : "Activate this program?"}
                  </h3>

                  <p className="mt-2 text-[14px] leading-relaxed text-[#23140C]/75">
                    {isActive
                      ? "Customers will stop earning stamps until you activate it again. Existing cards and vouchers stay valid."
                      : "Customers will start earning stamps on qualifying visits and purchases right away."}
                  </p>

                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusModalOpen(false)}
                      disabled={isUpdatingStatus}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>

                    <Button
                      variant={isActive ? "secondary" : "primary"}
                      size="sm"
                      onClick={handleToggleStatus}
                      loading={isUpdatingStatus}
                      disabled={isUpdatingStatus}
                      className="w-full sm:w-auto"
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Archive confirmation */}
            <ArchiveConfirmation
              isOpen={archiveModalOpen}
              programName={program.name}
              onConfirm={handleArchive}
              onCancel={() => setArchiveModalOpen(false)}
              isArchiving={isArchiving}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default LoyaltyProgramDetails;
