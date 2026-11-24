import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket } from "@fortawesome/free-solid-svg-icons";
import { voucherService } from "../../services/customer/voucherService";
import { VoucherCard } from "../../components/customer/VoucherCard";
import { TabBar } from "../../components/ui/TabBar";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/Button";

const VALID_FILTERS = ["all", "active", "used", "expired"];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "used", label: "Redeemed" },
  { id: "expired", label: "Expired" },
];

/**
 * Customer Vouchers page (/vouchers).
 * Lists customer vouchers with clean rounded filter pills (All, Active, Redeemed, Expired),
 * tab-specific empty states, error retry, and pagination.
 */
export const Vouchers = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced status filter (all, active, used, expired) and page number
  const rawStatus = searchParams.get("status") || "all";
  const status = VALID_FILTERS.includes(rawStatus) ? rawStatus : "all";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [vouchers, setVouchers] = useState([]);
  const [summary, setSummary] = useState({ active: 0, used: 0, expired: 0 });
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const fetchVouchers = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++activeRequestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const response = await voucherService.getVouchers(
        {
          status,
          page,
          per_page: 10,
        },
        controller.signal
      );

      if (requestId === activeRequestIdRef.current) {
        const data = response.data || {};
        setVouchers(data.vouchers || []);
        if (data.summary) {
          setSummary(data.summary);
        }
        if (data.pagination) {
          setPagination(data.pagination);
        }
        setLoading(false);
      }
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return;
      }
      if (requestId === activeRequestIdRef.current) {
        setError(
          err.response?.data?.message ||
            "We couldn't load your vouchers. Please try again."
        );
        setLoading(false);
      }
    }
  }, [status, page]);

  useEffect(() => {
    fetchVouchers();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchVouchers]);

  const handleTabChange = (newStatus) => {
    if (newStatus !== status) {
      setSearchParams({ status: newStatus, page: 1 });
    }
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ status, page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-[28px] font-bold text-brand-900">
          My Vouchers
        </h1>
        <p className="text-sm text-ink-soft mt-1 leading-normal">
          Show your active voucher code to the merchant at checkout.
        </p>
      </div>

      {/* Filter Buttons: matches Businesses category buttons (All, Active, Redeemed, Expired) */}
      <TabBar
        tabs={FILTERS}
        activeTab={status}
        onChange={handleTabChange}
        ariaLabel="Filter vouchers by status"
      />

      {/* Content Area */}
      <div
        id={`tabpanel-${status}`}
        role="tabpanel"
        aria-labelledby={`tab-${status}`}
      >
        {/* Loading Spinner */}
        {loading && (
          <div
            className="flex flex-col items-center justify-center py-16"
            aria-live="polite"
          >
            <Spinner size="lg" className="text-brand-800" />
            <p className="mt-3 text-sm text-ink-soft">Loading vouchers...</p>
          </div>
        )}

        {/* Error State with Retry */}
        {!loading && error && (
          <ErrorState
            title="Couldn't load vouchers"
            message={error}
            onRetry={fetchVouchers}
          />
        )}

        {/* Empty States per filter */}
        {!loading && !error && vouchers.length === 0 && (
          <div>
            {status === "all" && (
              <EmptyState
                icon={faTicket}
                title="No vouchers yet"
                description="Complete stamp cards or join promotions to earn vouchers."
                action={
                  <Button to="/wallet" variant="primary">
                    Go to wallet
                  </Button>
                }
              />
            )}
            {status === "active" && (
              <EmptyState
                icon={faTicket}
                title="No active vouchers"
                description="Complete a stamp card to earn one."
                action={
                  <Button to="/wallet" variant="primary">
                    Go to wallet
                  </Button>
                }
              />
            )}
            {status === "used" && (
              <EmptyState
                icon={faTicket}
                title="No redeemed vouchers"
                description="Vouchers you redeem will appear here."
              />
            )}
            {status === "expired" && (
              <EmptyState
                icon={faTicket}
                title="No expired vouchers"
                description="You have no expired vouchers."
              />
            )}
          </div>
        )}

        {/* Voucher Cards List */}
        {!loading && !error && vouchers.length > 0 && (
          <div className="space-y-4">
            {vouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                activeFilter={status}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && pagination.last_page > 1 && (
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-blush-100">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current_page <= 1 || loading}
              onClick={() => handlePageChange(pagination.current_page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs sm:text-sm text-ink-soft font-medium">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={
                pagination.current_page >= pagination.last_page || loading
              }
              onClick={() => handlePageChange(pagination.current_page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vouchers;
