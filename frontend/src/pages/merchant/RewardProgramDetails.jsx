import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPen,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { RewardProgramDetailsCard } from "../../components/merchant/rewards/RewardProgramDetailsCard";
import { Spinner, ErrorState, Button } from "../../components/ui";
import { rewardProgramService } from "../../services/rewardProgramService";

export const RewardProgramDetails = () => {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgram = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await rewardProgramService.getProgramDetails(id);
      setProgram(response.data);
    } catch (err) {
      console.error("Failed to fetch program details:", err);
      if (err.response?.status === 404) {
        setError("Reward program not found. It may have been archived or does not exist.");
      } else {
        const message =
          err.response?.data?.message ||
          "Unable to load program details. Please try again.";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const isArchived = program?.status === "archived";

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Merchant Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area */}
      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to="/merchant/reward-programs"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#23140C]/60 hover:text-[#A51D27] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Reward Programs</span>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#F4F0EA]/40 p-8">
            <Spinner size="md" />
            <p className="text-sm font-medium text-[#23140C]/60">
              Loading program details...
            </p>
          </div>
        )}

        {/* Error / 404 State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50/40 p-8">
            <ErrorState
              title="Program Not Available"
              message={error}
              action={
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={fetchProgram}>
                    <FontAwesomeIcon icon={faRotateRight} />
                    <span>Try Again</span>
                  </Button>
                  <Button
                    to="/merchant/reward-programs"
                    variant="primary"
                    size="sm"
                  >
                    Return to Programs
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
                <span className="text-xs font-semibold uppercase tracking-wider text-[#23140C]/50">
                  Reward Program Overview
                </span>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#23140C] sm:text-3xl">
                  {program.name}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchProgram}
                  title="Refresh details"
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                {!isArchived && (
                  <Button
                    to={`/merchant/reward-programs/${program.id}/edit`}
                    variant="primary"
                    size="sm"
                  >
                    <FontAwesomeIcon icon={faPen} />
                    <span>Edit Program</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Program Details Presentation */}
            <RewardProgramDetailsCard program={program} />
          </div>
        )}
      </main>
    </div>
  );
};

export default RewardProgramDetails;
