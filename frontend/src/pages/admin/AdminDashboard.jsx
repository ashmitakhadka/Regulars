import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { StatTile, Spinner, ErrorState, Button } from "../../components/ui";
import adminService from "../../services/admin/adminService";

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await adminService.getStats();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load platform statistics. Please try again."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 tracking-tight">
            Platform Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Real-time aggregate analytics across businesses, customers, and rewards.
          </p>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStats(true)}
            loading={isRefreshing}
            disabled={isLoading || isRefreshing}
            className="w-full sm:w-auto"
          >
            <FontAwesomeIcon icon={faRotateRight} className="mr-2 text-current text-xs" />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-ink-soft">Loading platform statistics...</p>
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load stats"
          message={error}
          onRetry={() => fetchStats()}
        />
      ) : stats ? (
        <div className="space-y-8">
          {/* Section: Merchants */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
              Merchants & Businesses
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatTile
                label="Total Merchants"
                value={stats.merchants?.total ?? 0}
              />
              <StatTile
                label="Active"
                value={stats.merchants?.active ?? 0}
                subtext="Currently trading"
              />
              <StatTile
                label="Suspended"
                value={stats.merchants?.suspended ?? 0}
                subtext="Access blocked"
              />
              <StatTile
                label="Pro Accounts"
                value={stats.merchants?.pro ?? 0}
                subtext="Pro tier enabled"
              />
            </div>
          </div>

          {/* Section: Customers */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
              Customers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <StatTile
                label="Total Customers"
                value={stats.customers?.total ?? 0}
              />
              <StatTile
                label="New in Last 7 Days"
                value={stats.customers?.new_last_7_days ?? 0}
                subtext="Registered this week"
              />
            </div>
          </div>

          {/* Section: Loyalty Programs */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
              Loyalty Programs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <StatTile
                label="Total Programs"
                value={stats.loyalty_programs?.total ?? 0}
              />
              <StatTile
                label="Active Programs"
                value={stats.loyalty_programs?.active ?? 0}
                subtext="Open to customers"
              />
            </div>
          </div>

          {/* Section: Stamps Awarded */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
              Stamps Awarded
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <StatTile
                label="Total Stamps"
                value={stats.stamps_awarded?.total ?? 0}
              />
              <StatTile
                label="Last 7 Days"
                value={stats.stamps_awarded?.last_7_days ?? 0}
                subtext="Awarded this week"
              />
            </div>
          </div>

          {/* Section: Vouchers */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
              Vouchers
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatTile
                label="Issued (Total)"
                value={stats.vouchers?.issued_total ?? 0}
              />
              <StatTile
                label="Issued (7 Days)"
                value={stats.vouchers?.issued_last_7_days ?? 0}
                subtext="Issued this week"
              />
              <StatTile
                label="Redeemed (Total)"
                value={stats.vouchers?.redeemed_total ?? 0}
              />
              <StatTile
                label="Redeemed (7 Days)"
                value={stats.vouchers?.redeemed_last_7_days ?? 0}
                subtext="Redeemed this week"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
