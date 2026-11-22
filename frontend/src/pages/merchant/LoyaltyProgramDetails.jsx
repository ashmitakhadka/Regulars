import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faUserPlus,
  faSearch,
  faDownload,
  faPrint,
} from "@fortawesome/free-solid-svg-icons";

import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { LoyaltyProgramDetailsCard } from "../../components/merchant/rewards/LoyaltyProgramDetailsCard";
import { ArchiveConfirmation } from "../../components/merchant/rewards/ArchiveConfirmation";
import { EnrollCustomerModal } from "../../components/merchant/customers/EnrollCustomerModal";
import { AwardStampsModal } from "../../components/merchant/customers/AwardStampsModal";
import {
  Spinner,
  ErrorState,
  EmptyState,
  Button,
  BackButton,
  Input,
  Tag,
} from "../../components/ui";

import { loyaltyProgramService } from "../../services/loyaltyProgramService";
import { customerService } from "../../services/customerService";
import qrCodeService from "../../services/qrCodeService";

const slugify = (text = "qr-code") =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const LoyaltyProgramDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Program details state
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status toggle modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Archive modal state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // QR Code state
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);

  // Enrolled customers state
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customersReloadKey, setCustomersReloadKey] = useState(0);

  // Customer action modals
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [awardingCustomer, setAwardingCustomer] = useState(null);
  const [awardingCardId, setAwardingCardId] = useState(null);

  const loadProgram = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await loyaltyProgramService.getProgramDetails(id);
      setProgram(response.data);
    } catch (err) {
      console.error("Failed to fetch program details:", err);
      setError(
        err.response?.status === 404
          ? "Loyalty program not found. It may have been archived or does not exist."
          : err.response?.data?.message ||
              "Unable to load loyalty program details. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    loyaltyProgramService
      .getProgramDetails(id)
      .then((res) => {
        if (!ignore) {
          setProgram(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to fetch program details:", err);
          setError(
            err.response?.status === 404
              ? "Loyalty program not found. It may have been archived or does not exist."
              : err.response?.data?.message ||
                  "Unable to load loyalty program details. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  // Load Program QR Code whenever program is active
  const loadQrCode = useCallback(async () => {
    if (!id || !program || program.status !== "active") {
      setQrData(null);
      setQrLoading(false);
      return;
    }

    setQrLoading(true);
    setQrError(null);
    try {
      const data = await qrCodeService.getProgramQr(id);
      setQrData(data);
    } catch (err) {
      console.error("Failed to fetch program QR code:", err);
      setQrError(
        err.response?.data?.message ||
          "Unable to load QR code for this program.",
      );
    } finally {
      setQrLoading(false);
    }
  }, [id, program]);

  useEffect(() => {
    let ignore = false;

    if (program?.status === "active") {
      queueMicrotask(() => {
        if (!ignore) loadQrCode();
      });
    } else {
      queueMicrotask(() => {
        if (!ignore) {
          setQrData(null);
          setQrLoading(false);
          setQrError(null);
        }
      });
    }

    return () => {
      ignore = true;
    };
  }, [program?.status, loadQrCode]);

  // Load Enrolled Customers for this specific program
  const trimmedSearch = customerSearch.trim();

  useEffect(() => {
    if (!id) return;
    let ignore = false;

    queueMicrotask(() => {
      if (!ignore) {
        setCustomersLoading(true);
        setCustomersError(null);
      }
    });

    customerService
      .getCustomers({
        program_id: id,
        search: trimmedSearch || undefined,
      })
      .then((res) => {
        if (!ignore) {
          setCustomers(res.data || []);
          setCustomersError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load enrolled customers:", err);
          setCustomersError(
            err.response?.data?.message ||
              "Unable to load enrolled customers. Please check your connection.",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setCustomersLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id, trimmedSearch, customersReloadKey]);

  const reloadCustomers = () => {
    setCustomersReloadKey((k) => k + 1);
  };

  const isArchived = program?.status === "archived";
  const isActive = program?.status === "active";
  const targetStatus = isActive ? "inactive" : "active";

  const handleToggleStatus = async () => {
    if (!program || isArchived) return;

    setIsUpdatingStatus(true);
    try {
      const response = await loyaltyProgramService.updateProgramStatus(
        program.id,
        targetStatus,
      );

      setProgram((prev) => ({ ...prev, status: targetStatus }));

      toast.success(
        response.message ||
          `Program ${targetStatus === "active" ? "activated" : "deactivated"}.`,
      );
      setStatusModalOpen(false);
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(
        err.response?.data?.message ||
          "Couldn't update the program status. Try again.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleArchive = async () => {
    if (!program || isArchived) return;

    setIsArchiving(true);
    try {
      const response = await loyaltyProgramService.archiveProgram(program.id);
      toast.success(response.message || "Program archived.");
      setArchiveModalOpen(false);
      navigate("/merchant/loyalty-programs", { replace: true });
    } catch (err) {
      console.error("Archive loyalty program failed:", err);
      toast.error(
        err.response?.data?.message ||
          "Couldn't archive the program. Try again.",
      );
    } finally {
      setIsArchiving(false);
    }
  };

  // Download QR code as SVG
  const handleDownloadQr = () => {
    if (!program) return;
    const container = document.getElementById(`program-qr-${program.id}`);
    const svg = container?.querySelector("svg");
    if (!svg) return;

    const svgClone = svg.cloneNode(true);
    const svgData = new XMLSerializer().serializeToString(svgClone);

    const blob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${slugify(program.name)}-qr.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Print QR code
  const handlePrintQr = () => {
    if (!program) return;
    const container = document.getElementById(`program-qr-${program.id}`);
    const svg = container?.querySelector("svg");
    if (!svg) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the QR code.");
      return;
    }

    const title = program.name;
    const heading = printWindow.document.createElement("h2");
    heading.textContent = title;
    heading.style.textAlign = "center";
    heading.style.fontFamily = "sans-serif";
    heading.style.marginBottom = "8px";

    const subtitle = printWindow.document.createElement("p");
    subtitle.textContent = "Scan this QR code to join this loyalty program";
    subtitle.style.textAlign = "center";
    subtitle.style.fontFamily = "sans-serif";
    subtitle.style.color = "#666";
    subtitle.style.marginBottom = "24px";

    const qr = svg.cloneNode(true);
    qr.style.display = "block";
    qr.style.width = "260px";
    qr.style.height = "260px";

    printWindow.document.title = `${title} QR Code`;
    printWindow.document.body.style.display = "flex";
    printWindow.document.body.style.flexDirection = "column";
    printWindow.document.body.style.alignItems = "center";
    printWindow.document.body.style.justifyContent = "center";
    printWindow.document.body.style.padding = "30px";
    printWindow.document.body.style.minHeight = "90vh";
    printWindow.document.body.style.margin = "0";

    printWindow.document.body.appendChild(heading);
    printWindow.document.body.appendChild(subtitle);
    printWindow.document.body.appendChild(qr);

    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // Get active version details to know target stamps
  const activeVersion =
    program?.versions?.find((v) => v.status === "active") ||
    program?.versions?.[0] ||
    null;
  const targetStamps = activeVersion?.reward?.stamps_required
    ? Number(activeVersion.reward.stamps_required)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <MerchantSidebar />

      <main className="w-full min-w-0 flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#F4F0EA]/40 p-8">
            <Spinner size="md" />
            <p className="text-[14px] font-medium text-[#23140C]/75">
              Loading program...
            </p>
          </div>
        )}

        {/* Error / 404 */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50/40 p-8">
            <ErrorState
              title="Program not available"
              message={error}
              action={
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={loadProgram}>
                    Try again
                  </Button>
                  <Button
                    to="/merchant/loyalty-programs"
                    variant="primary"
                    size="sm"
                  >
                    Back to programs
                  </Button>
                </div>
              }
            />
          </div>
        )}

        {/* Program Content */}
        {!loading && !error && program && (
          <>
            {/* Header: Back arrow, title, and action buttons */}
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <BackButton
                  size="xs"
                  to="/merchant/loyalty-programs"
                  iconOnly
                />
                <h1 className="truncate font-display text-xl font-bold tracking-tight text-[#23140C] sm:text-2xl lg:text-3xl">
                  {program.name}
                </h1>
              </div>

              {!isArchived && (
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Button
                    to={`/merchant/loyalty-programs/${program.id}/edit`}
                    variant="soft"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                  >
                    Edit
                  </Button>

                  <Button
                    variant={isActive ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => setStatusModalOpen(true)}
                    className="flex-1 sm:flex-initial"
                  >
                    {isActive ? "Deactivate" : "Activate"}
                  </Button>

                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => setArchiveModalOpen(true)}
                    className="flex-1 sm:flex-initial"
                  >
                    Archive
                  </Button>
                </div>
              )}
            </header>

            {/* Program Details Card */}
            <LoyaltyProgramDetailsCard program={program} />

            {/* Dedicated Program QR Code Section */}
            <section
              className="rounded-2xl bg-white p-5 sm:p-7 shadow-[0_2px_12px_rgba(35,20,12,0.06)]"
              aria-label="Loyalty program QR code"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#23140C]">
                    Program QR Code
                  </h2>
                  <p className="mt-0.5 text-xs text-[#23140C]/65 sm:text-sm">
                    Customers can scan this QR code to join this loyalty program.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {isActive ? (
                  <>
                    {qrLoading && (
                      <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl bg-[#F4F0EA]/30 p-6">
                        <Spinner size="md" />
                        <p className="text-xs text-[#23140C]/60">
                          Generating program QR code…
                        </p>
                      </div>
                    )}

                    {!qrLoading && qrError && (
                      <div className="rounded-xl border border-red-100 bg-red-50/40 p-6">
                        <ErrorState
                          title="QR code unavailable"
                          message={qrError}
                          action={
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={loadQrCode}
                            >
                              Try again
                            </Button>
                          }
                        />
                      </div>
                    )}

                    {!qrLoading && !qrError && qrData && (
                      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                        <div
                          id={`program-qr-${program.id}`}
                          className="shrink-0 rounded-2xl border border-[#23140C]/[0.08] bg-white p-3.5 shadow-sm"
                        >
                          <QRCodeSVG
                            value={qrData.qr_url}
                            size={160}
                            level="H"
                            includeMargin
                          />
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-3">
                          <div>
                            <h3 className="font-display text-base font-bold text-[#23140C]">
                              {program.name}
                            </h3>
                            <p className="mt-1 text-xs text-[#23140C]/70 leading-relaxed max-w-lg">
                              Display this QR code in your store or share it
                              with customers to allow them to join this program
                              directly on their phone.
                            </p>
                          </div>

                          <div className="flex flex-wrap justify-center gap-2.5 sm:justify-start pt-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleDownloadQr}
                            >
                              <FontAwesomeIcon icon={faDownload} />
                              <span>Download SVG</span>
                            </Button>

                            <Button
                              variant="soft"
                              size="sm"
                              onClick={handlePrintQr}
                            >
                              <FontAwesomeIcon icon={faPrint} />
                              <span>Print</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#23140C]/15 bg-[#F4F0EA]/20 p-6 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-[#23140C]">
                          QR code is inactive
                        </h3>
                        <p className="mt-1 text-xs text-[#23140C]/65">
                          QR codes are only available while the loyalty program
                          is active. Activate this program to allow customer
                          scanning.
                        </p>
                      </div>

                      {!isArchived && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setStatusModalOpen(true)}
                        >
                          Activate program
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Program-specific Enrolled Customers Section */}
            <section
              className="rounded-2xl bg-white p-5 sm:p-7 shadow-[0_2px_12px_rgba(35,20,12,0.06)]"
              aria-label="Enrolled customers"
            >
              {/* Section Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#23140C]">
                    Enrolled Customers
                  </h2>
                  <p className="mt-0.5 text-xs text-[#23140C]/65 sm:text-sm">
                    Customers currently enrolled in {program.name}.
                  </p>
                </div>

                {!isArchived && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setEnrollModalOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <FontAwesomeIcon icon={faUserPlus} />
                    <span>Enroll customer</span>
                  </Button>
                )}
              </div>

              {/* Search & Count Controls */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-72">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-sm text-[#23140C]/40"
                  />
                  <Input
                    type="text"
                    placeholder="Search by name, code or phone"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>

                <p className="text-xs sm:text-sm text-[#23140C]/60">
                  {customers.length}{" "}
                  {customers.length === 1 ? "customer" : "customers"} enrolled
                </p>
              </div>

              {/* Customer List Content */}
              <div className="mt-5">
                {customersLoading && (
                  <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl bg-[#F4F0EA]/30 p-6">
                    <Spinner size="md" />
                    <p className="text-xs text-[#23140C]/60">
                      Loading enrolled customers…
                    </p>
                  </div>
                )}

                {!customersLoading && customersError && (
                  <div className="rounded-xl bg-red-50/40 p-6">
                    <ErrorState
                      title="Couldn't load customers"
                      message={customersError}
                      onRetry={reloadCustomers}
                    />
                  </div>
                )}

                {!customersLoading &&
                  !customersError &&
                  customers.length === 0 &&
                  !trimmedSearch && (
                    <div className="rounded-xl bg-[#F4F0EA]/40 p-8 text-center">
                      <EmptyState
                        icon={faUsers}
                        title="No customers enrolled yet"
                        description="Customers will appear here when they scan your program QR code, or you can enroll them directly."
                        action={
                          !isArchived ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setEnrollModalOpen(true)}
                            >
                              <FontAwesomeIcon icon={faUserPlus} />
                              <span>Enroll customer</span>
                            </Button>
                          ) : null
                        }
                      />
                    </div>
                  )}

                {!customersLoading &&
                  !customersError &&
                  customers.length === 0 &&
                  trimmedSearch && (
                    <div className="rounded-xl bg-[#F4F0EA]/30 p-8 text-center">
                      <EmptyState
                        icon={faSearch}
                        title="No matching customers"
                        description={`Nothing found matching "${trimmedSearch}". Check the code or phone number.`}
                        action={
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setCustomerSearch("")}
                          >
                            Clear search
                          </Button>
                        }
                      />
                    </div>
                  )}

                {!customersLoading &&
                  !customersError &&
                  customers.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-[#23140C]/[0.08] bg-white">
                      {/* Desktop / Tablet Table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#F4F0EA]/40 text-xs font-semibold text-[#23140C]">
                            <tr>
                              <th className="px-5 py-3">Customer</th>
                              <th className="px-5 py-3">Contact</th>
                              <th className="px-5 py-3">Reward Progress</th>
                              <th className="px-5 py-3">Status</th>
                              <th className="px-5 py-3">Enrolled</th>
                              <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-[#F4F0EA]">
                            {customers.map((c) => {
                              const card =
                                c.programs?.find(
                                  (p) =>
                                    Number(p.program_id) === Number(program.id),
                                ) || c.programs?.[0];

                              const stampsEarned = card?.stamps_earned ?? 0;
                              const isCardActive = card?.status === "active";
                              const isCompleted = card?.status === "completed";

                              return (
                                <tr
                                  key={c.id}
                                  className="transition-colors hover:bg-[#F4F0EA]/20"
                                >
                                  {/* Customer Name & Code */}
                                  <td className="px-5 py-3.5">
                                    <Link
                                      to={`/merchant/customers/${c.id}`}
                                      className="font-semibold text-xs sm:text-sm text-[#23140C] hover:underline"
                                    >
                                      {c.name}
                                    </Link>
                                    <p className="font-mono text-xs text-[#23140C]/60">
                                      {c.customer_code}
                                    </p>
                                  </td>

                                  {/* Contact */}
                                  <td className="px-5 py-3.5 text-xs sm:text-sm text-[#23140C]/80">
                                    <p>
                                      {c.phone || (
                                        <span className="text-[#23140C]/40">
                                          No phone
                                        </span>
                                      )}
                                    </p>
                                    {c.email && (
                                      <p className="max-w-[180px] truncate text-xs text-[#23140C]/50">
                                        {c.email}
                                      </p>
                                    )}
                                  </td>

                                  {/* Progress */}
                                  <td className="px-5 py-3.5">
                                    <div className="space-y-1">
                                      <span className="font-medium text-xs sm:text-sm text-[#23140C]">
                                        {targetStamps
                                          ? `${stampsEarned} / ${targetStamps} stamps`
                                          : `${stampsEarned} stamps`}
                                      </span>
                                      {targetStamps && (
                                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#F4F0EA]">
                                          <div
                                            className="h-full rounded-full bg-[#A51D27] transition-all"
                                            style={{
                                              width: `${Math.min(
                                                100,
                                                Math.round(
                                                  (stampsEarned /
                                                    targetStamps) *
                                                    100,
                                                ),
                                              )}%`,
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="px-5 py-3.5">
                                    {isCardActive && (
                                      <Tag variant="green">Active</Tag>
                                    )}
                                    {isCompleted && (
                                      <Tag variant="amber">Completed</Tag>
                                    )}
                                    {!isCardActive && !isCompleted && (
                                      <Tag variant="cream">
                                        {card?.status || "Enrolled"}
                                      </Tag>
                                    )}
                                  </td>

                                  {/* Enrolled Date */}
                                  <td className="px-5 py-3.5 text-xs text-[#23140C]/65">
                                    {formatDate(card?.started_at)}
                                  </td>

                                  {/* Actions */}
                                  <td className="px-5 py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {isCardActive && (
                                        <Button
                                          variant="primary"
                                          size="xs"
                                          onClick={() => {
                                            setAwardingCustomer(c);
                                            setAwardingCardId(
                                              card?.stamp_card_id || null,
                                            );
                                          }}
                                          title="Award stamps directly"
                                        >
                                          Award
                                        </Button>
                                      )}
                                      <Button
                                        to={`/merchant/customers/${c.id}`}
                                        variant="secondary"
                                        size="xs"
                                      >
                                        Details
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards View */}
                      <div className="divide-y divide-[#F4F0EA] sm:hidden">
                        {customers.map((c) => {
                          const card =
                            c.programs?.find(
                              (p) =>
                                Number(p.program_id) === Number(program.id),
                            ) || c.programs?.[0];

                          const stampsEarned = card?.stamps_earned ?? 0;
                          const isCardActive = card?.status === "active";
                          const isCompleted = card?.status === "completed";

                          return (
                            <div key={c.id} className="space-y-3 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <Link
                                    to={`/merchant/customers/${c.id}`}
                                    className="font-semibold text-sm text-[#23140C]"
                                  >
                                    {c.name}
                                  </Link>
                                  <p className="font-mono text-xs text-[#23140C]/60">
                                    {c.customer_code}
                                  </p>
                                </div>

                                <div>
                                  {isCardActive && (
                                    <Tag variant="green">Active</Tag>
                                  )}
                                  {isCompleted && (
                                    <Tag variant="amber">Completed</Tag>
                                  )}
                                  {!isCardActive && !isCompleted && (
                                    <Tag variant="cream">
                                      {card?.status || "Enrolled"}
                                    </Tag>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#23140C]/75">
                                <div>
                                  {c.phone && <span>{c.phone}</span>}
                                  {c.phone && c.email && <span> · </span>}
                                  {c.email && (
                                    <span className="truncate">{c.email}</span>
                                  )}
                                </div>

                                <span className="text-[#23140C]/50">
                                  Joined {formatDate(card?.started_at)}
                                </span>
                              </div>

                              <div className="rounded-lg bg-[#F4F0EA]/40 p-2.5">
                                <div className="flex items-center justify-between text-xs font-medium text-[#23140C]">
                                  <span>Reward Progress</span>
                                  <span>
                                    {targetStamps
                                      ? `${stampsEarned} / ${targetStamps} stamps`
                                      : `${stampsEarned} stamps`}
                                  </span>
                                </div>
                                {targetStamps && (
                                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white">
                                    <div
                                      className="h-full rounded-full bg-[#A51D27] transition-all"
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Math.round(
                                            (stampsEarned / targetStamps) *
                                              100,
                                          ),
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F4F0EA]">
                                <Button
                                  to={`/merchant/customers/${c.id}`}
                                  variant="secondary"
                                  size="xs"
                                >
                                  Details
                                </Button>

                                {isCardActive && (
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    onClick={() => {
                                      setAwardingCustomer(c);
                                      setAwardingCardId(
                                        card?.stamp_card_id || null,
                                      );
                                    }}
                                  >
                                    Award stamps
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            </section>

            {/* Status change confirmation modal */}
            {statusModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#23140C]/50 p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="status-modal-title"
              >
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
                  <h3
                    id="status-modal-title"
                    className="font-display text-[18px] font-bold text-[#23140C]"
                  >
                    {isActive
                      ? "Deactivate this program?"
                      : "Activate this program?"}
                  </h3>

                  <p className="mt-2 text-[14px] leading-relaxed text-[#23140C]/75">
                    {isActive
                      ? "Customers will stop earning stamps until you activate it again. Existing cards and vouchers stay valid."
                      : "Customers will start earning stamps on qualifying visits and purchases right away."}
                  </p>

                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusModalOpen(false)}
                      disabled={isUpdatingStatus}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>

                    <Button
                      variant={isActive ? "secondary" : "primary"}
                      size="sm"
                      onClick={handleToggleStatus}
                      loading={isUpdatingStatus}
                      disabled={isUpdatingStatus}
                      className="w-full sm:w-auto"
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Archive confirmation modal */}
            <ArchiveConfirmation
              isOpen={archiveModalOpen}
              programName={program.name}
              onConfirm={handleArchive}
              onCancel={() => setArchiveModalOpen(false)}
              isArchiving={isArchiving}
            />

            {/* Enroll Customer Modal (Pre-selected to this program) */}
            <EnrollCustomerModal
              isOpen={enrollModalOpen}
              programId={program.id}
              onClose={() => setEnrollModalOpen(false)}
              onEnrolled={reloadCustomers}
            />

            {/* Award Stamps Modal */}
            <AwardStampsModal
              isOpen={Boolean(awardingCustomer)}
              customer={awardingCustomer}
              initialCardId={awardingCardId}
              onClose={() => {
                setAwardingCustomer(null);
                setAwardingCardId(null);
              }}
              onSuccess={reloadCustomers}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default LoyaltyProgramDetails;