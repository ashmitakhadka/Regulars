import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { MerchantSidebar } from "./MerchantSidebar";
import { Button, ErrorState, Spinner } from "../../components/ui";
import qrCodeService from "../../services/qrCodeService";
import loyaltyProgramService from "../../services/loyaltyProgramService";

const slugify = (text = "qr-code") =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const MerchantQrCode = () => {
  const [businessQr, setBusinessQr] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [programQrs, setProgramQrs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  // Download a QR code as an SVG file
  const handleDownload = (containerId, fileName) => {
    const container = document.getElementById(containerId);
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
    link.download = `${fileName}.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Print a QR code
  const handlePrint = (containerId, title) => {
    const container = document.getElementById(containerId);
    const svg = container?.querySelector("svg");
    if (!svg) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the QR code.");
      return;
    }

    const heading = printWindow.document.createElement("h2");
    heading.textContent = title;
    heading.style.textAlign = "center";
    heading.style.fontFamily = "sans-serif";
    heading.style.marginBottom = "24px";

    const qr = svg.cloneNode(true);
    qr.style.display = "block";
    qr.style.width = "260px";
    qr.style.height = "260px";

    printWindow.document.title = title;
    printWindow.document.body.style.display = "flex";
    printWindow.document.body.style.flexDirection = "column";
    printWindow.document.body.style.alignItems = "center";
    printWindow.document.body.style.justifyContent = "center";
    printWindow.document.body.style.padding = "30px";
    printWindow.document.body.style.minHeight = "90vh";
    printWindow.document.body.style.margin = "0";

    printWindow.document.body.appendChild(heading);
    printWindow.document.body.appendChild(qr);

    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  useEffect(() => {
    let ignore = false;

    const fetchQrCodes = async () => {
      try {
        setLoading(true);
        setError("");

        const [businessData, response] = await Promise.all([
          qrCodeService.getBusinessQr(),
          loyaltyProgramService.getAllPrograms(),
        ]);

        if (ignore) return;
        setBusinessQr(businessData);

        const allPrograms = response.data || [];
        const activePrograms = allPrograms.filter(
          (program) => program.status === "active",
        );
        setPrograms(activePrograms);

        const qrResults = await Promise.all(
          activePrograms.map(async (program) => {
            const qrData = await qrCodeService.getProgramQr(program.id);
            return { id: program.id, qr: qrData };
          }),
        );

        if (ignore) return;

        const qrMap = {};
        qrResults.forEach(({ id, qr }) => {
          qrMap[id] = qr;
        });
        setProgramQrs(qrMap);
      } catch (err) {
        if (ignore) return;
        console.error("Failed to fetch QR codes:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load QR codes. Please try again.",
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchQrCodes();
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <MerchantSidebar />

      <main className="w-full flex-1 bg-white p-4 sm:p-7 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="font-display text-xl font-bold text-[#23140C] sm:text-2xl">
              QR Codes
            </h1>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
              <Spinner size="md" />
              <p className="text-sm text-[#23140C]/60">
                Loading your QR codes…
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-red-200/60 bg-white p-8">
              <ErrorState
                title="QR codes unavailable"
                message={error}
                action={
                  <Button variant="outline" size="sm" onClick={reload}>
                    Try again
                  </Button>
                }
              />
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              {/* Business QR Code */}
              {businessQr && (
                <section className="rounded-xl border border-[#23140C]/[0.08] bg-white p-5 sm:p-6">
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                    <div
                      id="business-qr"
                      className="shrink-0 rounded-xl border border-[#23140C]/[0.08] bg-white p-3.5"
                    >
                      <QRCodeSVG
                        value={businessQr.qr_url}
                        size={168}
                        level="H"
                        includeMargin
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="font-display text-lg font-bold text-[#23140C]">
                        {businessQr.business_name || "Business QR Code"}
                      </h2>

                      <div className="mt-4 flex flex-wrap justify-center gap-2.5 sm:justify-start">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleDownload("business-qr", "business-qr-code")
                          }
                        >
                          <span>Download</span>
                        </Button>

                        <Button
                          variant="soft"
                          size="sm"
                          onClick={() =>
                            handlePrint(
                              "business-qr",
                              businessQr.business_name || "Business QR Code",
                            )
                          }
                        >
                          <span>Print</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Program QR Codes */}
              <section className="rounded-xl border border-[#23140C]/[0.08] bg-white p-5 sm:p-6">
                <h2 className="mb-5 font-display text-base font-bold text-[#23140C]">
                  Loyalty program QR codes
                </h2>

                {programs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#23140C]/15 bg-white px-4 py-12 text-center">
                    <h3 className="text-sm font-semibold text-[#23140C]">
                      No active loyalty programs
                    </h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {programs.map((program) => {
                      const qrData = programQrs[program.id];

                      return (
                        <article
                          key={program.id}
                          className="flex flex-col rounded-xl border border-[#23140C]/[0.08] bg-white p-5"
                        >
                          <div className="mb-4 text-center">
                            <h3 className="truncate text-sm font-bold text-[#23140C]">
                              {program.name}
                            </h3>
                            {program.description && (
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#23140C]/55">
                                {program.description}
                              </p>
                            )}
                          </div>

                          {qrData ? (
                            <>
                              <div
                                id={`program-qr-${program.id}`}
                                className="mx-auto mb-5 rounded-xl border border-[#23140C]/[0.08] bg-white p-3"
                              >
                                <QRCodeSVG
                                  value={qrData.qr_url}
                                  size={156}
                                  level="H"
                                  includeMargin
                                />
                              </div>

                              <div className="mt-auto grid grid-cols-2 gap-2">
                                <Button
                                  variant="secondary"
                                  size="xs"
                                  className="justify-center"
                                  onClick={() =>
                                    handleDownload(
                                      `program-qr-${program.id}`,
                                      `${slugify(program.name)}-qr`,
                                    )
                                  }
                                >
                                  <span>Download</span>
                                </Button>

                                <Button
                                  variant="soft"
                                  size="xs"
                                  className="justify-center"
                                  onClick={() =>
                                    handlePrint(
                                      `program-qr-${program.id}`,
                                      program.name,
                                    )
                                  }
                                >
                                  <span>Print</span>
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-1 items-center justify-center py-12 text-xs text-[#23140C]/50">
                              QR code unavailable.
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MerchantQrCode;
