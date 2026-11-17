import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faGift,
  faRotateRight,
  faBoxArchive,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { LoyaltyProgramCard } from "../../components/merchant/rewards/LoyaltyProgramCard";
import { EmptyState, ErrorState, Spinner, Button } from "../../components/ui";
import { loyaltyProgramService } from "../../services/loyaltyProgramService";

export const LoyaltyPrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadPrograms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await loyaltyProgramService.getAllPrograms();
      setPrograms(response.data || []);
    } catch (err) {
      console.error("Failed to fetch loyalty programs:", err);
      const message =
        err.response?.data?.message ||
        "Unable to load your loyalty programs. Please check your connection and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    loyaltyProgramService
      .getAllPrograms()
      .then((response) => {
        if (!ignore) {
          setPrograms(response.data || []);
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
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Filter programs based on selected status tab
  const filteredPrograms = programs.filter((program) => {
    if (statusFilter === "all") return true;
    return program.status?.toLowerCase() === statusFilter;
  });

  // Calculate actual counts from fetched data
  const counts = {
    all: programs.length,
    active: programs.filter((p) => p.status === "active").length,
    inactive: programs.filter((p) => p.status === "inactive").length,
    archived: programs.filter((p) => p.status === "archived").length,
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Merchant Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area */}
      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Header Section */}
        <header className="flex flex-col gap-4 border-b border-[#F4F0EA] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-[#23140C]/60">
                Merchant Portal
              </span>
              <span className="text-[#23140C]/30">•</span>
              <span className="text-[13px] font-semibold text-[#A51D27]">
                Loyalty Programs
              </span>
            </div>
            <h1 className="mt-1 font-display text-[26px] sm:text-[28px] font-bold tracking-tight text-[#23140C]">
              Loyalty Programs
            </h1>
            <p className="mt-1 text-[13.5px] sm:text-[14px] text-[#23140C]/75">
              Manage your digital stamp cards, earning rules, and customer rewards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadPrograms}
              disabled={loading}
              title="Refresh loyalty programs"
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                className={loading ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              to="/merchant/loyalty-programs/create"
              variant="primary"
              size="sm"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Create Loyalty Program</span>
            </Button>
          </div>
        </header>

        {/* Status Filter Tabs */}
        {!loading && !error && programs.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 border-b border-[#F4F0EA] pb-4">
            {[
              { id: "all", label: "All Programs", count: counts.all },
              { id: "active", label: "Active", count: counts.active },
              { id: "inactive", label: "Inactive", count: counts.inactive },
              { id: "archived", label: "Archived", count: counts.archived },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-[#23140C] text-white"
                      : "bg-[#F4F0EA] text-[#23140C] hover:bg-[#F4F0EA]/80"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-white text-[#23140C]/80"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
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
                  Archived Loyalty Programs Archive Notice
                </p>
                <p className="mt-1 text-[13px] text-amber-900/90 leading-relaxed">
                  Archived programs are retired from active circulation and preserved for historical audit.
                  Existing customer loyalty cards and redeemed vouchers remain valid in customer wallets,
                  but customers cannot earn new stamps under an archived program.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content States */}
        <section className="mt-8" aria-label="Loyalty programs listing">
          {/* 1. Loading State */}
          {loading && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#F4F0EA]/40 p-8">
              <Spinner size="md" />
              <p className="text-[14px] font-medium text-[#23140C]/75">
                Loading your loyalty programs...
              </p>
            </div>
          )}

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
                  icon={statusFilter === "archived" ? faBoxArchive : faInfoCircle}
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

