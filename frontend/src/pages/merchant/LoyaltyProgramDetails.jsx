import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPen,
  faRotateRight,
  faPause,
  faPlay,
  faCheck,
  faBoxArchive,
} from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { LoyaltyProgramDetailsCard } from "../../components/merchant/rewards/LoyaltyProgramDetailsCard";
import { ArchiveConfirmation } from "../../components/merchant/rewards/ArchiveConfirmation";
import { Spinner, ErrorState, Button } from "../../components/ui";
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

  const loadProgram = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await loyaltyProgramService.getProgramDetails(id);
      setProgram(response.data);
    } catch (err) {
      console.error("Failed to fetch program details:", err);
      if (err.response?.status === 404) {
        setError(
          "Loyalty program not found. It may have been archived or does not exist.",
        );
      } else {
        const message =
          err.response?.data?.message ||
          "Unable to load loyalty program details. Please try again.";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    loyaltyProgramService
      .getProgramDetails(id)
      .then((response) => {
        if (!ignore) {
          setProgram(response.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to fetch loyalty program details:", err);
          if (err.response?.status === 404) {
            setError(
              "Loyalty program not found. It may have been archived or does not exist.",
            );
          } else {
            setError(
              err.response?.data?.message ||
                "Unable to load loyalty program details. Please try again.",
            );
          }
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
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

      // Update local state immediately
      setProgram((prev) => ({
        ...prev,
        status: targetStatus,
      }));

      toast.success(
        response.message ||
          `Loyalty program has been ${targetStatus === "active" ? "activated" : "deactivated"} successfully.`,
      );
      setStatusModalOpen(false);
    } catch (err) {
      console.error("Status update error:", err);
      const message =
        err.response?.data?.message ||
        "Failed to update loyalty program status. Please try again.";
      toast.error(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleArchive = async () => {
    if (!program || isArchived) return;

    setIsArchiving(true);
    try {
      const response = await loyaltyProgramService.archiveProgram(program.id);
      toast.success(
        response.message || "Loyalty program archived successfully.",
      );
      setArchiveModalOpen(false);
      // Navigate back to loyalty programs listing
      navigate("/merchant/loyalty-programs", { replace: true });
    } catch (err) {
      console.error("Archive loyalty program failed:", err);
      const message =
        err.response?.data?.message ||
        "Unable to archive loyalty program. Please try again.";
      toast.error(message);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Merchant Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area */}
      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to="/merchant/loyalty-programs"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#23140C]/75 hover:text-[#A51D27] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Loyalty Programs</span>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#F4F0EA]/40 p-8">
            <Spinner size="md" />
            <p className="text-[14px] font-medium text-[#23140C]/75">
              Loading loyalty program details...
            </p>
          </div>
        )}

        {/* Error / 404 State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50/40 p-8">
            <ErrorState
              title="Loyalty Program Not Available"
              message={error}
              action={
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={loadProgram}>
                    <FontAwesomeIcon icon={faRotateRight} />
                    <span>Try Again</span>
                  </Button>
                  <Button
                    to="/merchant/loyalty-programs"
                    variant="primary"
                    size="sm"
                  >
                    Return to Loyalty Programs
                  </Button>
                </div>
              }
            />
          </div>
        )}

        {/* Success View */}
        {!loading && !error && program && (
          <div>
            {/* Header Actions */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#F4F0EA] pb-5">
              <div>
                <span className="text-[13px] font-semibold uppercase tracking-wider text-[#23140C]/60">
                  Loyalty Program Overview
                </span>
                <h1 className="font-display text-[26px] sm:text-[28px] font-bold tracking-tight text-[#23140C]">
                  {program.name}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadProgram}
                  title="Refresh details"
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                {!isArchived && (
                  <>
                    <Button
                      variant={isActive ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => setStatusModalOpen(true)}
                      title={isActive ? "Deactivate program" : "Activate program"}
                    >
                      <FontAwesomeIcon icon={isActive ? faPause : faPlay} />
                      <span>{isActive ? "Deactivate" : "Activate"}</span>
                    </Button>

                    <Button
                      to={`/merchant/loyalty-programs/${program.id}/edit`}
                      variant="outline"
                      size="sm"
                    >
                      <FontAwesomeIcon icon={faPen} />
                      <span>Edit Loyalty Program</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setArchiveModalOpen(true)}
                      className="text-amber-800 hover:bg-amber-50"
                      title="Archive this loyalty program"
                    >
                      <FontAwesomeIcon icon={faBoxArchive} />
                      <span>Archive</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Program Details Presentation */}
            <LoyaltyProgramDetailsCard program={program} />

            {/* Status Change Confirmation Modal */}
            {statusModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#23140C]/50 p-4 backdrop-blur-xs"
                role="dialog"
                aria-modal="true"
                aria-labelledby="status-modal-title"
              >
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        isActive
                          ? "bg-amber-100 text-amber-900"
                          : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={isActive ? faPause : faPlay}
                        className="h-5 w-5"
                      />
                    </div>
                    <div>
                      <h3
                        id="status-modal-title"
                        className="font-display text-[18px] font-bold text-[#23140C]"
                      >
                        {isActive ? "Deactivate Loyalty Program?" : "Activate Loyalty Program?"}
                      </h3>
                      <p className="text-[13.5px] text-[#23140C]/75">
                        {program.name}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-[13.5px] leading-relaxed text-[#23140C]/85">
                    {isActive
                      ? "When deactivated, customers will temporarily stop earning stamps for this program during counter visits. Existing loyalty cards and earned vouchers remain completely intact. You can reactivate anytime."
                      : "Once activated, this loyalty program will become immediately active. Customers will begin earning stamps towards this reward upon qualifying visits or purchases."}
                  </p>

                  <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#F4F0EA] pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusModalOpen(false)}
                      disabled={isUpdatingStatus}
                    >
                      Cancel
                    </Button>

                    <Button
                      variant={isActive ? "secondary" : "primary"}
                      size="sm"
                      onClick={handleToggleStatus}
                      loading={isUpdatingStatus}
                      disabled={isUpdatingStatus}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      <span>
                        {isUpdatingStatus
                          ? "Updating..."
                          : isActive
                          ? "Confirm Deactivate"
                          : "Confirm Activate"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Archive Confirmation Modal */}
            <ArchiveConfirmation
              isOpen={archiveModalOpen}
              programName={program.name}
              onConfirm={handleArchive}
              onCancel={() => setArchiveModalOpen(false)}
              isArchiving={isArchiving}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default LoyaltyProgramDetails;

