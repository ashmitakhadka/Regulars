import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { StatTile, Spinner, ErrorState, Button } from "../../components/ui";
import adminService from "../../services/admin/adminService";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortControllerRef = useRef(null);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await adminService.getStats(controller.signal);
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      if (
        err.name === "CanceledError" ||
        err.code === "ERR_CANCELED" ||
        controller.signal.aborted
      ) {
        return;
      }
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setError(
        err.response?.data?.message || "Failed to load platform statistics. Please try again."
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchStats();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
