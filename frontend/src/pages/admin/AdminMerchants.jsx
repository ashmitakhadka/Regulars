import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faEye,
  faCrown,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import {
  Card,
  Button,
  Tag,
  Spinner,
  EmptyState,
  ErrorState,
} from "../../components/ui";
import adminService from "../../services/admin/adminService";
import { formatKathmanduDate } from "../../lib/formatKathmanduDate";

export const AdminMerchants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL query parameters
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "all";
  const currentPro = searchParams.get("pro") || "all";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [merchants, setMerchants] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateFilters = useCallback((updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (!val || val === "all" || (key === "page" && val === 1)) {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      });
      return next;
    });
  }, [setSearchParams]);

  // Fetch merchants from backend
  const fetchMerchants = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    const params = {
      page: currentPage,
      per_page: 15,
    };
    if (currentSearch) params.search = currentSearch;
    if (currentStatus !== "all") params.status = currentStatus;
    if (currentPro !== "all") params.pro = currentPro;

    try {
      const res = await adminService.getMerchants(params, controller.signal);
      if (res?.data) {
        setMerchants(res.data.merchants || []);
        setPagination(res.data.pagination || null);
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
        err.response?.data?.message || "Failed to load merchants. Please try again."
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [currentPage, currentSearch, currentStatus, currentPro, navigate]);

  useEffect(() => {
    fetchMerchants();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMerchants]);

  // Debounced search typing handler
  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateFilters({ search: value.trim(), page: 1 });
    }, 300);
  };

  const handleStatusFilterChange = (status) => {
    updateFilters({ status, page: 1 });
  };

  const handleProFilterChange = (pro) => {
    updateFilters({ pro, page: 1 });
  };

  const handlePageChange = (newPage) => {
    updateFilters({ page: newPage });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 tracking-tight">
          Merchants Directory
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1">
          Review, search, and manage registered businesses and loyalty program statuses.
        </p>
      </div>

      {/* Search and Filters - 1 Compact Row */}
      <Card className="p-2.5 sm:p-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft text-xs pointer-events-none"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by business name or owner email..."
              className="w-full pl-8 pr-3 py-1.5 h-8 rounded-lg border border-blush-200 bg-white text-xs text-ink placeholder-ink-soft focus:outline-hidden focus:ring-1.5 focus:ring-brand-800 focus:border-transparent transition"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={currentStatus}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                aria-label="Filter by status"
                className="w-full sm:w-auto appearance-none h-8 pl-3 pr-8 rounded-lg border border-blush-200 bg-white text-xs text-ink font-medium transition focus:border-brand-800 focus:outline-none focus:ring-1.5 focus:ring-brand-800/20 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft text-[10px]"
              />
            </div>

            {/* Tier Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={currentPro}
                onChange={(e) => handleProFilterChange(e.target.value)}
                aria-label="Filter by tier"
                className="w-full sm:w-auto appearance-none h-8 pl-3 pr-8 rounded-lg border border-blush-200 bg-white text-xs text-ink font-medium transition focus:border-brand-800 focus:outline-none focus:ring-1.5 focus:ring-brand-800/20 cursor-pointer"
              >
                <option value="all">All Tiers</option>
                <option value="yes">Pro Only</option>
                <option value="no">Standard</option>
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft text-[10px]"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Table / Cards List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-ink-soft">Loading merchants...</p>
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load merchants"
          message={error}
          onRetry={fetchMerchants}
        />
      ) : merchants.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="No merchants found"
            message="No merchants match your current filters. Try adjusting your search query or status filter."
          />
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-2xl bg-white shadow-sm border border-blush-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-blush-50/70 border-b border-blush-100 text-xs font-bold uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Business</th>
                    <th scope="col" className="px-4 py-3.5">Owner</th>
                    <th scope="col" className="px-4 py-3.5">Status</th>
                    <th scope="col" className="px-4 py-3.5">Tier</th>
                    <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Joined</th>
                    <th scope="col" className="px-5 py-3.5 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blush-50">
                  {merchants.map((m) => {
                    const isActive = m.status === "active";

                    return (
                      <tr key={m.id} className="hover:bg-blush-50/40 transition-colors">
                        <td className="px-5 py-4">
                          <Link
                            to={`/admin/merchants/${m.id}`}
                            className="font-bold text-brand-900 hover:underline block leading-tight"
                          >
                            {m.business_name || "Unnamed Business"}
                          </Link>
                          <span className="text-xs text-ink-soft block mt-0.5">
                            {m.category || "General"} &bull; /{m.slug || "—"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-xs font-semibold text-ink leading-tight">
                            {m.owner?.name || "Not provided"}
                          </div>
                          <div className="text-xs text-ink-soft truncate max-w-[180px]">
                            {m.owner?.email || "Not provided"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <Tag variant={isActive ? "green" : "red"}>
                            {isActive ? "Active" : "Suspended"}
                          </Tag>
                        </td>

                        <td className="px-4 py-4">
                          {m.is_pro ? (
                            <Tag variant="cream" className="font-bold">
                              <FontAwesomeIcon icon={faCrown} className="mr-1 text-[10px] text-brand-800" />
                              PRO
                            </Tag>
                          ) : (
                            <span className="text-xs text-ink-soft">Standard</span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-xs text-ink-soft whitespace-nowrap">
                          {formatKathmanduDate(m.created_at)}
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <Link to={`/admin/merchants/${m.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                              <FontAwesomeIcon icon={faEye} className="mr-1.5 text-xs" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="lg:hidden space-y-3.5">
            {merchants.map((m) => {
              const isActive = m.status === "active";

              return (
                <Card key={m.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/admin/merchants/${m.id}`}
                        className="font-bold text-brand-900 text-base leading-tight block hover:underline"
                      >
                        {m.business_name || "Unnamed Business"}
                      </Link>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {m.category || "General"} &bull; /{m.slug || "—"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Tag variant={isActive ? "green" : "red"}>
                        {isActive ? "Active" : "Suspended"}
                      </Tag>
                      {m.is_pro && (
                        <Tag variant="cream" className="font-bold">
                          PRO
                        </Tag>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-y border-blush-50">
                    <div>
                      <span className="text-ink-soft block text-[11px]">Owner</span>
                      <span className="font-semibold text-ink truncate block">
                        {m.owner?.name || "Not provided"}
                      </span>
                      <span className="text-ink-soft truncate block text-[11px]">
                        {m.owner?.email || "Not provided"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-ink-soft block text-[11px]">Joined</span>
                      <span className="text-ink font-medium">
                        {formatKathmanduDate(m.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link to={`/admin/merchants/${m.id}`} className="block">
                      <Button variant="ghost" size="sm" className="w-full text-xs">
                        <FontAwesomeIcon icon={faEye} className="mr-1.5 text-xs" />
                        View
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <span className="text-xs text-ink-soft">
                Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} total merchants)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.last_page}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminMerchants;
