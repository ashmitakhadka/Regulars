import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faEye,
  faBan,
  faCheck,
  faCrown,
} from "@fortawesome/free-solid-svg-icons";
import {
  Card,
  Button,
  Tag,
  Spinner,
  EmptyState,
  ErrorState,
  Alert,
  TabBar,
  ConfirmDialog,
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

  // Action states
  const [actionAlert, setActionAlert] = useState(null); // { type: 'success' | 'error', message }
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    merchant: null,
    targetStatus: null,
    isLoading: false,
  });
  const [proLoadingId, setProLoadingId] = useState(null);

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
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
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
      setIsLoading(false);
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

  // Open confirmation modal for Suspend / Activate
  const handleOpenStatusModal = (merchant) => {
    const targetStatus = merchant.status === "active" ? "suspended" : "active";
    setConfirmModal({
      isOpen: true,
      merchant,
      targetStatus,
      isLoading: false,
    });
  };

  // Execute status update
  const handleConfirmStatus = async () => {
    const { merchant, targetStatus } = confirmModal;
    if (!merchant || !targetStatus || confirmModal.isLoading) return;

    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    setActionAlert(null);

    try {
      const res = await adminService.setMerchantStatus(merchant.id, targetStatus);
      if (res?.data) {
        // Update row in-place from server data
        setMerchants((prev) =>
          prev.map((m) => (m.id === merchant.id ? { ...m, ...res.data } : m))
        );
        setActionAlert({
          type: "success",
          message: `Business "${merchant.business_name}" is now ${targetStatus}.`,
        });
      }
      setConfirmModal({ isOpen: false, merchant: null, targetStatus: null, isLoading: false });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setActionAlert({
        type: "error",
        message: err.response?.data?.message || "Failed to update business status.",
      });
      setConfirmModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Toggle Pro status
  const handleTogglePro = async (merchant) => {
    if (proLoadingId) return; // Prevent double clicks
    setProLoadingId(merchant.id);
    setActionAlert(null);

    const newPro = !merchant.is_pro;

    try {
      const res = await adminService.setMerchantPro(merchant.id, newPro);
      if (res?.data) {
        setMerchants((prev) =>
          prev.map((m) => (m.id === merchant.id ? { ...m, ...res.data } : m))
        );
        setActionAlert({
          type: "success",
          message: `Updated Pro tier for "${merchant.business_name}" to ${newPro ? "Pro" : "Standard"}.`,
        });
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setActionAlert({
        type: "error",
        message: err.response?.data?.message || "Failed to update Pro status.",
      });
    } finally {
      setProLoadingId(null);
    }
  };

  const statusTabs = [
    { id: "all", label: "All Status" },
    { id: "active", label: "Active" },
    { id: "suspended", label: "Suspended" },
  ];

  const proTabs = [
    { id: "all", label: "All Tiers" },
    { id: "yes", label: "Pro Only" },
    { id: "no", label: "Standard" },
  ];

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

      {/* Action Feedback */}
      {actionAlert && (
        <Alert
          variant={actionAlert.type}
          onClose={() => setActionAlert(null)}
          className="animate-fadeIn"
        >
          {actionAlert.message}
        </Alert>
      )}

      {/* Search and Filters */}
      <Card className="p-4 sm:p-5 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft text-sm pointer-events-none"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by business name or owner email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blush-200 bg-white text-sm text-ink placeholder-ink-soft focus:outline-hidden focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 border-t border-blush-100">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft block">
              Status Filter
            </span>
            <TabBar
              tabs={statusTabs}
              activeTab={currentStatus}
              onChange={handleStatusFilterChange}
              ariaLabel="Filter merchants by status"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft block">
              Tier Filter
            </span>
            <TabBar
              tabs={proTabs}
              activeTab={currentPro}
              onChange={handleProFilterChange}
              ariaLabel="Filter merchants by tier"
            />
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
          <div className="hidden lg:block overflow-hidden rounded-2xl bg-white shadow-sm border border-blush-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-blush-50/70 border-b border-blush-100 text-xs font-bold uppercase tracking-wider text-ink-soft">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Business</th>
                  <th scope="col" className="px-4 py-3.5">Owner</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5">Tier</th>
                  <th scope="col" className="px-4 py-3.5 text-center">Programs</th>
                  <th scope="col" className="px-4 py-3.5 text-center">Customers</th>
                  <th scope="col" className="px-4 py-3.5">Joined</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-50">
                {merchants.map((m) => {
                  const isActive = m.status === "active";
                  const isProLoading = proLoadingId === m.id;

                  return (
                    <tr key={m.id} className="hover:bg-blush-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/merchants/${m.id}`}
                          className="font-bold text-brand-900 hover:underline block leading-tight"
                        >
                          {m.business_name}
                        </Link>
                        <span className="text-xs text-ink-soft block mt-0.5">
                          {m.category || "General"} &bull; /{m.slug}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-xs font-semibold text-ink leading-tight">
                          {m.owner?.name || "—"}
                        </div>
                        <div className="text-xs text-ink-soft truncate max-w-[180px]">
                          {m.owner?.email || "—"}
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

                      <td className="px-4 py-4 text-center font-semibold text-ink">
                        {m.programs_count ?? 0}
                      </td>

                      <td className="px-4 py-4 text-center font-semibold text-ink">
                        {m.customers_count ?? 0}
                      </td>

                      <td className="px-4 py-4 text-xs text-ink-soft whitespace-nowrap">
                        {formatKathmanduDate(m.created_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link to={`/admin/merchants/${m.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs">
                              <FontAwesomeIcon icon={faEye} className="mr-1 text-xs" />
                              View
                            </Button>
                          </Link>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePro(m)}
                            loading={isProLoading}
                            disabled={isProLoading}
                            className="h-8 px-2.5 text-xs"
                            title={m.is_pro ? "Downgrade to Standard" : "Upgrade to Pro"}
                          >
                            <FontAwesomeIcon icon={faCrown} className="mr-1 text-[10px]" />
                            {m.is_pro ? "Revoke Pro" : "Make Pro"}
                          </Button>

                          <Button
                            variant={isActive ? "outline" : "primary"}
                            size="sm"
                            onClick={() => handleOpenStatusModal(m)}
                            className={`h-8 px-2.5 text-xs ${
                              isActive
                                ? "text-brand-900 border-brand-200 hover:bg-red-50"
                                : ""
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={isActive ? faBan : faCheck}
                              className="mr-1 text-xs"
                            />
                            {isActive ? "Suspend" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="lg:hidden space-y-3.5">
            {merchants.map((m) => {
              const isActive = m.status === "active";
              const isProLoading = proLoadingId === m.id;

              return (
                <Card key={m.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/admin/merchants/${m.id}`}
                        className="font-bold text-brand-900 text-base leading-tight block hover:underline"
                      >
                        {m.business_name}
                      </Link>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {m.category || "General"} &bull; /{m.slug}
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

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-blush-50">
                    <div>
                      <span className="text-ink-soft block">Owner</span>
                      <span className="font-semibold text-ink truncate block">
                        {m.owner?.name || "—"}
                      </span>
                      <span className="text-ink-soft truncate block">
                        {m.owner?.email || "—"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-ink-soft block">Programs / Customers</span>
                      <span className="font-semibold text-ink block">
                        {m.programs_count ?? 0} progs &bull; {m.customers_count ?? 0} custs
                      </span>
                      <span className="text-ink-soft block">
                        Joined {formatKathmanduDate(m.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Link to={`/admin/merchants/${m.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full text-xs">
                        <FontAwesomeIcon icon={faEye} className="mr-1 text-xs" />
                        View
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePro(m)}
                      loading={isProLoading}
                      disabled={isProLoading}
                      className="text-xs"
                    >
                      {m.is_pro ? "Revoke Pro" : "Make Pro"}
                    </Button>

                    <Button
                      variant={isActive ? "outline" : "primary"}
                      size="sm"
                      onClick={() => handleOpenStatusModal(m)}
                      className={`text-xs ${
                        isActive ? "text-brand-900 border-brand-200 hover:bg-red-50" : ""
                      }`}
                    >
                      {isActive ? "Suspend" : "Activate"}
                    </Button>
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

      {/* Confirmation Dialog for Suspend / Activate */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() =>
          !confirmModal.isLoading &&
          setConfirmModal({ isOpen: false, merchant: null, targetStatus: null, isLoading: false })
        }
        onConfirm={handleConfirmStatus}
        loading={confirmModal.isLoading}
        variant={confirmModal.targetStatus === "suspended" ? "primary" : "primary"}
        title={
          confirmModal.targetStatus === "suspended"
            ? `Suspend "${confirmModal.merchant?.business_name}"?`
            : `Activate "${confirmModal.merchant?.business_name}"?`
        }
        confirmLabel={
          confirmModal.targetStatus === "suspended" ? "Suspend Business" : "Activate Business"
        }
        message={
          confirmModal.targetStatus === "suspended"
            ? "While suspended, this shop cannot log in or award stamps, customers cannot find it or join its programs, and customers cannot redeem its vouchers. You can activate it again at any time."
            : "Are you sure you want to activate this business? The merchant will be able to log in, award stamps, and receive customer joins again."
        }
      />
    </div>
  );
};

export default AdminMerchants;
