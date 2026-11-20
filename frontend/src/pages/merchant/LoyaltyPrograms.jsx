import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faGift,
  faBoxArchive,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { LoyaltyProgramCard } from "../../components/merchant/rewards/LoyaltyProgramCard";
import { EmptyState, ErrorState, Button } from "../../components/ui";
import { loyaltyProgramService } from "../../services/loyaltyProgramService";

const STATUS_TABS = [
  { id: "all", label: "All Programs" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "archived", label: "Archived" },
];

export const LoyaltyPrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await loyaltyProgramService.getAllPrograms();
      setPrograms(response.data || []);
    } catch (err) {
      console.error("Failed to fetch loyalty programs:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load your loyalty programs. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    loyaltyProgramService
      .getAllPrograms()
      .then((res) => {
        if (!ignore) {
          setPrograms(res.data || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to fetch loyalty programs:", err);
          setError(
            err.response?.data?.message ||
              "Unable to load your loyalty programs. Please check your connection and try again.",
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Normalize status once so filtering is consistent.
  const getStatus = (program) => program.status?.toLowerCase();

  const filteredPrograms = programs.filter(
    (program) => statusFilter === "all" || getStatus(program) === statusFilter,
  );

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Merchant Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area */}
      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Header Section */}
        <header className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-[26px] font-bold tracking-tight text-[#23140C] sm:text-[28px]">
            Loyalty Programs
          </h1>

          <Button
            to="/merchant/loyalty-programs/create"
            variant="primary"
            size="sm"
          >
            <span>Create</span>
            <FontAwesomeIcon icon={faPlus} />
          </Button>
        </header>

        {/* Status Filter Tabs */}
        {!loading && !error && programs.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 pb-4">
            {STATUS_TABS.map((tab) => {
              const isSelected = statusFilter === tab.id;

              return (
                <Button
                  key={tab.id}
                  variant={isSelected ? "primary" : "soft"}
                  size="xs"
                  onClick={() => setStatusFilter(tab.id)}
                  aria-pressed={isSelected}
                >
                  {tab.label}
                </Button>
              );
            })}
          </div>
        )}

        {/* Informational Banner for Archived Programs Filter */}
        {statusFilter === "archived" && !loading && (
          <div className="mt-5 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 text-[13.5px] text-amber-950">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon
                icon={faBoxArchive}
                className="mt-0.5 text-base text-amber-800"
              />
              <div>
                <p className="font-bold text-amber-950">
                  About archived programs
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-amber-900/90">
                  Archived programs are retired from active circulation and
                  preserved for historical audit. Existing customer loyalty
                  cards and redeemed vouchers remain valid in customer wallets,
                  but customers cannot earn new stamps under an archived
                  program.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content States */}
        <section className="mt-8" aria-label="Loyalty programs listing">
          {/* 2. Error State with Retry */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
              <ErrorState
                title="Could not load loyalty programs"
                message={error}
                onRetry={loadPrograms}
              />
            </div>
          )}

          {/* 3. Empty State (No programs at all) */}
          {!loading && !error && programs.length === 0 && (
            <div className="rounded-2xl bg-[#F4F0EA]/40 p-8">
              <EmptyState
                icon={faGift}
                title="No loyalty programs yet"
                description="Create your first loyalty program to start rewarding your repeat customers."
                action={
                  <Button
                    to="/merchant/loyalty-programs/create"
                    variant="primary"
                    size="md"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Create Your First Program</span>
                  </Button>
                }
              />
            </div>
          )}

          {/* 4. Empty Filter State (Programs exist, but none match filter) */}
          {!loading &&
            !error &&
            programs.length > 0 &&
            filteredPrograms.length === 0 && (
              <div className="rounded-2xl bg-[#F4F0EA]/30 p-8">
                <EmptyState
                  icon={
                    statusFilter === "archived" ? faBoxArchive : faInfoCircle
                  }
                  title={`No ${statusFilter} loyalty programs`}
                  description={`You do not have any loyalty programs currently marked as ${statusFilter}.`}
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                    >
                      View All Programs
                    </Button>
                  }
                />
              </div>
            )}

          {/* 5. Success Grid */}
          {!loading && !error && filteredPrograms.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredPrograms.map((program) => (
                <LoyaltyProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default LoyaltyPrograms;
