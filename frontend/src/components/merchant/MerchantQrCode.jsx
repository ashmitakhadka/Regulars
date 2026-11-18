import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQrcode,
  faDownload,
  faPrint,
  faStore,
  faGift,
} from "@fortawesome/free-solid-svg-icons";

import { MerchantSidebar } from "./MerchantSidebar";
import qrCodeService from "../../services/qrCodeService";
import loyaltyProgramService from "../../services/loyaltyProgramService";

const MerchantQrCode = () => {
  const [businessQr, setBusinessQr] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [programQrs, setProgramQrs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    // Give the browser time to start the download
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

    const qr = svg.cloneNode(true);
    qr.style.width = "250px";
    qr.style.height = "250px";

    printWindow.document.title = title;
    printWindow.document.body.style.display = "flex";
    printWindow.document.body.style.flexDirection = "column";
    printWindow.document.body.style.alignItems = "center";
    printWindow.document.body.style.justifyContent = "center";
    printWindow.document.body.style.padding = "30px";
    printWindow.document.body.style.minHeight = "90vh";
    printWindow.document.body.style.margin = "0";

    heading.style.textAlign = "center";
    heading.style.marginBottom = "25px";

    qr.style.display = "block";
    qr.style.width = "250px";
    qr.style.height = "250px";

    printWindow.document.body.appendChild(heading);
    printWindow.document.body.appendChild(qr);

    printWindow.focus();

    // Wait briefly for the print content to render
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  useEffect(() => {
    const fetchQrCodes = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch business QR code
        const businessData = await qrCodeService.getBusinessQr();
        setBusinessQr(businessData);

        // Fetch loyalty programs
        const response = await loyaltyProgramService.getAllPrograms();
        const allPrograms = response.data || [];

        // Only active programs need QR codes
        const activePrograms = allPrograms.filter(
          (program) => program.status === "active",
        );

        setPrograms(activePrograms);

        // Fetch QR code for each active program
        const qrResults = await Promise.all(
          activePrograms.map(async (program) => {
            const qrData = await qrCodeService.getProgramQr(program.id);

            return {
              id: program.id,
              qr: qrData,
            };
          }),
        );

        const qrMap = {};

        qrResults.forEach(({ id, qr }) => {
          qrMap[id] = qr;
        });

        setProgramQrs(qrMap);
      } catch (err) {
        console.error("Failed to fetch QR codes:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load QR codes. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQrCodes();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <MerchantSidebar />

      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4F0EA]">
              <FontAwesomeIcon
                icon={faQrcode}
                className="text-xl text-[#A51D27]"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#23140C]">QR Codes</h1>
              <p className="mt-1 text-sm text-gray-500">
                Let customers discover your business and join loyalty programs.
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center text-gray-500">
            Loading your QR codes...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Business QR Code */}
            {businessQr && (
              <section className="mb-8 rounded-2xl bg-white p-6 shadow-md">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F0EA]">
                    <FontAwesomeIcon
                      icon={faStore}
                      className="text-lg text-[#A51D27]"
                    />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-[#23140C]">
                      Business QR Code
                    </h2>
                    <p className="text-sm text-gray-500">
                      One QR code for your entire business
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6 rounded-xl bg-[#F4F0EA]/50 p-6 sm:flex-row sm:justify-between">
                  <div
                    id="business-qr"
                    className="rounded-xl bg-white p-4 shadow-sm"
                  >
                    <QRCodeSVG
                      value={businessQr.qr_url}
                      size={200}
                      level="H"
                      includeMargin
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="mb-2 font-semibold text-[#23140C]">
                      Share your business QR
                    </h3>

                    <p className="mb-4 text-sm leading-6 text-gray-600">
                      Display this QR code at your counter. Customers can scan
                      it to explore your active loyalty programs.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownload("business-qr", "business-qr-code")
                        }
                        className="rounded-lg bg-[#A51D27] px-4 py-2 text-sm font-medium text-white hover:bg-[#891822]"
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Download
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handlePrint(
                            "business-qr",
                            businessQr.business_name || "Business QR Code",
                          )
                        }
                        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#23140C] shadow-sm hover:bg-gray-50"
                      >
                        <FontAwesomeIcon icon={faPrint} className="mr-2" />
                        Print
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Program QR Codes */}
            <section className="rounded-2xl bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F0EA]">
                  <FontAwesomeIcon
                    icon={faGift}
                    className="text-lg text-[#A51D27]"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-[#23140C]">
                    Loyalty Program QR Codes
                  </h2>
                  <p className="text-sm text-gray-500">
                    Each active loyalty program has its own QR code.
                  </p>
                </div>
              </div>

              {programs.length === 0 ? (
                <div className="rounded-xl bg-[#F4F0EA]/50 px-4 py-12 text-center">
                  <FontAwesomeIcon
                    icon={faGift}
                    className="mb-3 text-3xl text-gray-400"
                  />
                  <h3 className="font-semibold text-[#23140C]">
                    No active loyalty programs
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create and activate a loyalty program to generate its QR
                    code.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {programs.map((program) => {
                    const qrData = programQrs[program.id];

                    return (
                      <article
                        key={program.id}
                        className="flex flex-col items-center rounded-xl bg-[#F4F0EA]/50 p-5"
                      >
                        <h3 className="mb-1 text-center font-semibold text-[#23140C]">
                          {program.name}
                        </h3>

                        <p className="mb-4 text-center text-sm text-gray-500">
                          {program.description || "No description provided."}
                        </p>

                        {qrData ? (
                          <>
                            <div
                              id={`program-qr-${program.id}`}
                              className="mb-5 rounded-xl bg-white p-4 shadow-sm"
                            >
                              <QRCodeSVG
                                value={qrData.qr_url}
                                size={180}
                                level="H"
                                includeMargin
                              />
                            </div>

                            <div className="flex flex-wrap justify-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handlePrint(
                                    `program-qr-${program.id}`,
                                    program.name,
                                  )
                                }
                                className="rounded-lg bg-[#A51D27] px-3 py-2 text-sm font-medium text-white hover:bg-[#891822]"
                              >
                                <FontAwesomeIcon
                                  icon={faDownload}
                                  className="mr-2"
                                />
                                Download
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handlePrint(
                                    `program-qr-${program.id}`,
                                    program.name,
                                  )
                                }
                                className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#23140C] shadow-sm hover:bg-gray-50"
                              >
                                <FontAwesomeIcon
                                  icon={faPrint}
                                  className="mr-2"
                                />
                                Print
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="py-12 text-sm text-gray-500">
                            QR code unavailable.
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default MerchantQrCode;
