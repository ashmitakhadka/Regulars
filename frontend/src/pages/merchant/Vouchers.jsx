import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket, faCheck } from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import {
  Button,
  Input,
  Tag,
  Spinner,
  EmptyState,
  ErrorState,
} from "../../components/ui";
import { voucherService } from "../../services/voucherService";

const PER_PAGE = 10;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const daysLeftText = (value) => {
  if (!value) return null;
  const diff = Math.ceil((new Date(value) - Date.now()) / 86400000);
  if (Number.isNaN(diff) || diff < 0) return null;
  if (diff === 0) return "Today";
  return diff === 1 ? "Tomorrow" : `In ${diff} days`;
};

const TABS = [
  {
    key: "active",
    label: "Active",
    dateLabel: "Expires",
    dateField: "expires_at",
  },
  {
    key: "redeemed",
    label: "Redeemed",
    dateLabel: "Redeemed",
    dateField: "redeemed_at",
  },
  {
    key: "expired",
    label: "Expired",
    dateLabel: "Expired",
    dateField: "expires_at",
  },
];

const STATUS_TAG = { active: "green", redeemed: "cream", expired: "red" };

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatReward = (type, value) => {
  switch (type) {
    case "free_item":
    case "free_product":
      return "Free item";
    case "discount_percentage":
      return `${value}% off`;
    case "fixed_discount":
      return `Rs. ${value} off`;
    default:
      return type || "Reward";
  }
};

const getErrorMessage = (err) => {
  const status = err.response?.status;
  const serverMsg = err.response?.data?.message || "";
  const lower = serverMsg.toLowerCase();

  if (status === 404) {
    return "Voucher not found. Check the code and try again.";
  }
  if (status === 422) {
    if (lower.includes("expired")) {
      return "This voucher has expired and can't be redeemed.";
    }
    if (lower.includes("already") || lower.includes("inactive")) {
      return "This voucher has already been redeemed or is inactive.";
    }
    return serverMsg || "Unable to redeem voucher.";
  }
  return serverMsg || "Something went wrong. Please try again.";
};

const cardClass =
  "rounded-2xl bg-white shadow-[0_2px_12px_rgba(35,20,12,0.08)]";

export const Vouchers = () => {
  // Redeem form
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastRedeemed, setLastRedeemed] = useState(null);

  // Vouchers table
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [vouchers, setVouchers] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  // Bumped after a redemption so the table reloads.
  const [refreshKey, setRefreshKey] = useState(0);

  const activeTab = TABS.find((t) => t.key === tab);

  // Debounce the search box
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Vouchers table
  useEffect(() => {
    let ignore = false;
    setTableLoading(true);

    voucherService
      .getVouchers({
        status: tab,
        search: debouncedSearch || undefined,
        page,
        per_page: PER_PAGE,
      })
      .then((response) => {
        if (ignore) return;
        setVouchers(response.data || []);
        setMeta(response.meta || { current_page: 1, last_page: 1, total: 0 });
        setTableError(null);
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Failed to load vouchers:", err);
        setTableError(
          err.response?.data?.message ||
            "Unable to load vouchers. Please try again.",
        );
      })
      .finally(() => {
        if (!ignore) setTableLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [tab, debouncedSearch, page, refreshKey, retryKey]);

  const handleTabChange = (key) => {
    setTab(key);
    setPage(1);
  };

  const handleInputChange = (e) => {
    setCode(e.target.value.toUpperCase().replace(/\s+/g, ""));
    if (errorMessage) setErrorMessage(null);
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setErrorMessage("Enter a voucher code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await voucherService.redeemVoucher(trimmedCode);

      toast.success(response.message || "Voucher redeemed successfully.");
      setLastRedeemed(response.data);
      setCode("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Voucher redemption error:", err);
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedeemAnother = () => {
    setLastRedeemed(null);
    setCode("");
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <MerchantSidebar />

      <main className="w-full flex-1 p-5 sm:p-8">
        <div className="mx-auto w-full max-w-6xl">
          <div>
            <h1 className="font-display text-[26px] font-bold tracking-tight text-[#23140C] sm:text-[28px]">
              Vouchers
            </h1>
            <p className="mt-1 text-[14px] text-[#23140C]/65">
              Redeem vouchers and manage customer rewards.
            </p>
          </div>

          {/* Redeem voucher */}
          <section className="mt-6">
            <div className={`${cardClass} p-5 sm:p-6`}>
              {lastRedeemed ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <FontAwesomeIcon icon={faCheck} />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-[#23140C]">
                        Voucher redeemed successfully
                      </h2>
                      <p className="mt-1 text-sm text-[#23140C]/65">
                        {lastRedeemed.reward_title} · {lastRedeemed.code}
                      </p>
                      <p className="mt-1 text-sm text-[#23140C]/65">
                        {formatReward(
                          lastRedeemed.reward_type,
                          lastRedeemed.reward_value,
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    onClick={handleRedeemAnother}
                  >
                    Redeem another
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleRedeem}
                  className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
                  noValidate
                >
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#23140C]">
                      Redeem a voucher
                    </h2>
                    <p className="mt-0.5 text-sm text-[#23140C]/60">
                      Enter the customer's voucher code.
                    </p>
                  </div>

                  <div className="flex w-full items-start gap-3 sm:w-[420px]">
                    <div className="flex-1">
                      <Input
                        aria-label="Voucher code"
                        placeholder="Enter voucher code"
                        value={code}
                        onChange={handleInputChange}
                        error={errorMessage}
                        disabled={isSubmitting}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={isSubmitting}
                      disabled={isSubmitting || !code.trim()}
                    >
                      Redeem
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Voucher history */}
          <section className="mt-8">
            <div className={`${cardClass} overflow-hidden`}>
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-[18px] font-bold text-[#23140C]">
                    Voucher history
                  </h2>
                  {!tableLoading && !tableError && (
                    <p className="mt-0.5 text-[13px] text-[#23140C]/60">
                      {plural(meta.total ?? vouchers.length, "voucher")}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {TABS.map((t) => (
                    <Button
                      key={t.key}
                      type="button"
                      size="xs"
                      variant={tab === t.key ? "primary" : "soft"}
                      onClick={() => handleTabChange(t.key)}
                    >
                      {t.label}
                    </Button>
                  ))}

                  <div className="w-full sm:w-56 [&>div]:m-0 [&_input]:h-8 [&_input]:py-0 [&_input]:text-[13px]">
                    <input
                      type="text"
                      placeholder="Search vouchers..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoComplete="off"
                      className="h-10 w-full rounded-lg border border-[#E7E2DA] bg-white px-4 text-[13.5px] text-[#23140C] transition placeholder:text-[#23140C]/45 focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20 sm:w-56"
                    />
                  </div>
                </div>
              </div>

              {tableLoading ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <Spinner size="md" />
                </div>
              ) : tableError ? (
                <div className="p-6">
                  <ErrorState
                    title="Could not load vouchers"
                    message={tableError}
                    onRetry={() => setRetryKey((k) => k + 1)}
                  />
                </div>
              ) : vouchers.length === 0 ? (
                <EmptyState
                  icon={faTicket}
                  title={
                    debouncedSearch
                      ? "No vouchers found"
                      : `No ${activeTab.label.toLowerCase()} vouchers`
                  }
                  description={
                    debouncedSearch
                      ? "Try a different code or customer name."
                      : "Vouchers will show up here as customers earn them."
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[14px]">
                    <thead>
                      <tr className="bg-[#F4F0EA]/50 text-[12px] uppercase tracking-wide text-[#23140C]/55">
                        <th className="px-5 py-3 font-medium">Code</th>
                        <th className="px-5 py-3 font-medium">Customer</th>
                        <th className="px-5 py-3 font-medium">Reward</th>
                        <th className="px-5 py-3 font-medium">
                          {activeTab.dateLabel}
                        </th>
                        <th className="px-5 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F0EA]">
                      {vouchers.map((v) => {
                        const dateValue = v[activeTab.dateField];
                        const hint =
                          tab === "active" ? daysLeftText(dateValue) : null;

                        return (
                          <tr
                            key={v.id ?? v.code}
                            className="transition-colors hover:bg-[#F4F0EA]/30"
                          >
                            <td className="px-5 py-3.5 font-mono text-[13.5px] font-semibold text-[#A51D27]">
                              {v.code}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <span className="text-[#23140C]">
                                  {v.customer_name || "—"}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="text-[#23140C]">{v.reward_title}</p>
                              <p className="text-[12.5px] text-[#23140C]/55">
                                {formatReward(v.reward_type, v.reward_value)}
                              </p>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="text-[#23140C]">
                                {formatDate(dateValue)}
                              </p>
                              {hint && (
                                <p className="text-[12.5px] text-[#23140C]/55">
                                  {hint}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <Tag variant={STATUS_TAG[v.status] || "cream"}>
                                {v.status
                                  ? v.status.charAt(0).toUpperCase() +
                                    v.status.slice(1)
                                  : "—"}
                              </Tag>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!tableLoading && !tableError && meta.last_page > 1 && (
                <div className="flex items-center justify-between p-4 text-[13.5px] text-[#23140C]/70">
                  <span>
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={page >= meta.last_page}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Vouchers;
