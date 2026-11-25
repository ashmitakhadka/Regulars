import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faCheck, faCrown } from "@fortawesome/free-solid-svg-icons";
import {
  Card,
  Button,
  Tag,
  Spinner,
  EmptyState,
  ErrorState,
  Alert,
  BackButton,
  ConfirmDialog,
  StatTile,
} from "../../components/ui";
import adminService from "../../services/admin/adminService";
import {
  formatKathmanduDateTime,
  formatKathmanduDate,
} from "../../lib/formatKathmanduDate";

export const AdminMerchantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [merchant, setMerchant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [actionAlert, setActionAlert] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    targetStatus: null,
    isLoading: false,
  });
  const [isProLoading, setIsProLoading] = useState(false);

  const abortControllerRef = useRef(null);

  const fetchMerchant = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await adminService.getMerchant(id, controller.signal);
      if (res?.data) {
        setMerchant(res.data);
      }
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/admin/login", { replace: true });
        return;
      }
      if (err.response?.status === 404) {
        setError("404");
      } else {
        setError(
          err.response?.data?.message || "Failed to load merchant details."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchMerchant();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchMerchant]);

  // Handle status update confirmation
  const handleOpenStatusModal = () => {
    const targetStatus = merchant?.status === "active" ? "suspended" : "active";
    setConfirmModal({
      isOpen: true,
      targetStatus,
      isLoading: false,
    });
  };

  const handleConfirmStatus = async () => {
    if (!merchant || !confirmModal.targetStatus || confirmModal.isLoading) return;

    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    setActionAlert(null);

    try {
      const res = await adminService.setMerchantStatus(merchant.id, confirmModal.targetStatus);
      if (res?.data) {
        setMerchant((prev) => ({ ...prev, status: res.data.status }));
        setActionAlert({
          type: "success",
          message: `Business status successfully updated to ${res.data.status}.`,
        });
      }
      setConfirmModal({ isOpen: false, targetStatus: null, isLoading: false });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setActionAlert({
        type: "error",
        message: err.response?.data?.message || "Failed to update status.",
      });
      setConfirmModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Handle Pro toggle
  const handleTogglePro = async () => {
    if (isProLoading || !merchant) return;
    setIsProLoading(true);
    setActionAlert(null);

    const newPro = !merchant.is_pro;

    try {
      const res = await adminService.setMerchantPro(merchant.id, newPro);
      if (res?.data) {
        setMerchant((prev) => ({ ...prev, is_pro: res.data.is_pro }));
        setActionAlert({
          type: "success",
          message: `Updated Pro tier to ${newPro ? "Pro" : "Standard"}.`,
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
      setIsProLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-ink-soft">Loading merchant details...</p>
      </div>
    );
  }

  if (error === "404") {
    return (
      <div className="space-y-4">
        <BackButton fallbackPath="/admin/merchants" />
        <Card className="p-8">
          <EmptyState
            title="Merchant not found"
            message="The requested merchant does not exist or may have been removed."
          />
          <div className="mt-6 flex justify-center">
            <Button variant="primary" onClick={() => navigate("/admin/merchants")}>
              Back to Merchants
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <BackButton fallbackPath="/admin/merchants" />
        <ErrorState
          title="Could not load merchant"
          message={error}
          onRetry={fetchMerchant}
        />
      </div>
    );
  }

  const isActive = merchant?.status === "active";
  const stats = merchant?.stats || {};
  const recentActivity = merchant?.recent_activity || [];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <BackButton fallbackPath="/admin/merchants" />
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <Alert
          variant={actionAlert.type}
          onClose={() => setActionAlert(null)}
          className="animate-fadeIn"
        >
          {actionAlert.message}
        </Alert>
      )}

      {/* Header Card */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 tracking-tight">
                {merchant.business_name}
              </h1>
              <Tag variant={isActive ? "green" : "red"}>
                {isActive ? "Active" : "Suspended"}
              </Tag>
              {merchant.is_pro && (
                <Tag variant="cream" className="font-bold">
                  <FontAwesomeIcon icon={faCrown} className="mr-1 text-[10px] text-brand-800" />
                  PRO
                </Tag>
              )}
            </div>

            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              {merchant.category || "General"} &bull; Slug: <span className="font-mono">/{merchant.slug}</span> &bull; Joined {formatKathmanduDate(merchant.created_at)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePro}
              loading={isProLoading}
              disabled={isProLoading}
            >
              <FontAwesomeIcon icon={faCrown} className="mr-1.5 text-xs" />
              {merchant.is_pro ? "Revoke Pro" : "Upgrade to Pro"}
            </Button>

            <Button
              variant={isActive ? "outline" : "primary"}
              size="sm"
              onClick={handleOpenStatusModal}
              className={isActive ? "text-brand-900 border-brand-200 hover:bg-red-50" : ""}
            >
              <FontAwesomeIcon
                icon={isActive ? faBan : faCheck}
                className="mr-1.5 text-xs"
              />
              {isActive ? "Suspend Business" : "Activate Business"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
          Business Performance & Activity
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatTile
            label="Programs"
            value={stats.programs_total ?? 0}
            subtext={`${stats.programs_active ?? 0} active`}
          />
          <StatTile
            label="Customers Enrolled"
            value={stats.customers_count ?? 0}
            subtext="Unique members"
          />
          <StatTile
            label="Stamps Awarded"
            value={stats.stamps_awarded ?? 0}
            subtext="Total lifetime stamps"
          />
          <StatTile
            label="Vouchers"
            value={stats.vouchers_issued ?? 0}
            subtext={`${stats.vouchers_redeemed ?? 0} redeemed`}
          />
        </div>
      </div>

      {/* Two Column Layout: Profile Info & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="p-5 sm:p-6 lg:col-span-1 space-y-4">
          <h2 className="font-display text-lg font-bold text-brand-900">
            Business Profile
          </h2>

          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <span className="text-ink-soft block text-[11px] uppercase tracking-wider font-semibold">
                Description
              </span>
              <p className="mt-0.5 text-ink leading-relaxed">
                {merchant.description || "No description provided."}
              </p>
            </div>

            <div className="pt-2 border-t border-blush-50">
              <span className="text-ink-soft block text-[11px] uppercase tracking-wider font-semibold">
                Owner Account
              </span>
              <p className="font-semibold text-ink mt-0.5">
                {merchant.owner?.name || "—"}
              </p>
              <p className="text-xs text-ink-soft">
                {merchant.owner?.email || "—"}
              </p>
            </div>

            <div className="pt-2 border-t border-blush-50">
              <span className="text-ink-soft block text-[11px] uppercase tracking-wider font-semibold">
                Contact & Address
              </span>
              <p className="text-ink mt-0.5">{merchant.phone || "No phone listed"}</p>
              <p className="text-xs text-ink-soft">{merchant.address || "No address listed"}</p>
            </div>

            <div className="pt-2 border-t border-blush-50 flex justify-between">
              <div>
                <span className="text-ink-soft block text-[11px] uppercase tracking-wider font-semibold">
                  Timezone
                </span>
                <span className="text-ink font-medium">{merchant.timezone || "Asia/Kathmandu"}</span>
              </div>
              <div className="text-right">
                <span className="text-ink-soft block text-[11px] uppercase tracking-wider font-semibold">
                  Currency
                </span>
                <span className="text-ink font-mono font-bold">{merchant.currency || "NPR"}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity List (stamp_transactions only) */}
        <Card className="p-5 sm:p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-brand-900">
              Recent Stamp Activity
            </h2>
            <span className="text-xs text-ink-soft font-medium">
              Last 10 transactions
            </span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-soft">
              No recent stamp transactions recorded for this business.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-blush-50/70 border-b border-blush-100 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">Date & Time</th>
                    <th scope="col" className="px-3 py-2.5">Customer</th>
                    <th scope="col" className="px-3 py-2.5">Program</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Stamps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blush-50">
                  {recentActivity.map((act) => (
                    <tr key={act.id} className="hover:bg-blush-50/40 transition-colors">
                      <td className="px-3 py-3 text-xs text-ink-soft whitespace-nowrap">
                        {formatKathmanduDateTime(act.occurred_at)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-ink block leading-tight">
                          {act.customer?.name || "Customer"}
                        </span>
                        <span className="text-[11px] font-mono text-ink-soft block">
                          {act.customer?.customer_code || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-ink font-medium">
                        {act.program_name || "Loyalty Program"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Tag variant="green" className="font-bold">
                          +{act.stamps_awarded}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() =>
          !confirmModal.isLoading &&
          setConfirmModal({ isOpen: false, targetStatus: null, isLoading: false })
        }
        onConfirm={handleConfirmStatus}
        loading={confirmModal.isLoading}
        title={
          confirmModal.targetStatus === "suspended"
            ? `Suspend "${merchant.business_name}"?`
            : `Activate "${merchant.business_name}"?`
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

export default AdminMerchantDetail;
