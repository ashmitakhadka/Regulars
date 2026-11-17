import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift,
  faArrowRight,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import loyaltyProgramService from "../../services/loyaltyProgramService";

const getLatestVersion = (program) => {
  return [...(program.versions || [])].sort(
    (a, b) => b.version_number - a.version_number,
  )[0];
};

const getEarningSummary = (rule) => {
  if (!rule) return "Earning details unavailable";

  const threshold = Number(rule.threshold);

  switch (rule.earning_type) {
    case "visit":
      return `${threshold} ${threshold === 1 ? "visit" : "visits"}`;
    case "purchase":
      return `Purchase amount: ${threshold}`;
    case "quantity":
      return `${threshold} ${threshold === 1 ? "item" : "items"}`;
    default:
      return "Earning rule";
  }
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-emerald-50 text-emerald-800 border-emerald-300",
    inactive: "bg-[#F4F0EA] text-[#23140C] border-neutral-300",
    archived: "bg-neutral-100 text-neutral-800 border-neutral-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[13px] font-semibold capitalize ${
        styles[status] || "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
};

export const LoyaltyProgramOverview = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await loyaltyProgramService.getAllPrograms();
      setPrograms(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load loyalty programs.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    loyaltyProgramService
      .getAllPrograms()
      .then((response) => {
        if (!ignore) {
          setPrograms(Array.isArray(response.data) ? response.data : []);
          setError("");
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err.response?.data?.message || "Unable to load loyalty programs.",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Exclude archived programs from dashboard counts.
  const nonArchivedPrograms = programs.filter((program) =>
    ["active", "inactive"].includes(program.status),
  );

  // Total, active and inactive program counts.
  const totalCount = nonArchivedPrograms.length;

  const activeCount = nonArchivedPrograms.filter(
    (program) => program.status === "active",
  ).length;

  const inactiveCount = nonArchivedPrograms.filter(
    (program) => program.status === "inactive",
  ).length;

  // Show the latest three programs, with active programs first.
  const visiblePrograms = [...nonArchivedPrograms]
    .sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;

      return new Date(b.updated_at) - new Date(a.updated_at);
    })
    .slice(0, 3);

  return (
    <section className="mt-10 rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(35,20,12,0.06)] sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
            <FontAwesomeIcon icon={faGift} />
          </div>

          <div>
            <h2 className="font-display text-[18px] font-bold text-[#23140C]">
              Loyalty Programs
            </h2>
            <p className="mt-0.5 text-[13.5px] text-[#23140C]/75">
              Manage your customer loyalty programs
            </p>
          </div>
        </div>

        {!loading && !error && (
          <div className="flex items-center gap-3 sm:justify-end">
            <p className="text-[13.5px] font-medium text-[#23140C]/75">
              Total Programs
            </p>

            <p className="text-[18px] font-bold text-[#A51D27]">{totalCount}</p>

            <p className="text-[13px] text-[#23140C]/75">
              {activeCount} Active · {inactiveCount} Inactive
            </p>
          </div>
        )}
      </div>

      <div className="mt-7 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-[14px] text-[#23140C]/75">
            <FontAwesomeIcon icon={faRotate} className="mr-2 animate-spin" />
            Loading loyalty programs...
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-[14px] text-red-600">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 text-[14px] font-semibold text-[#A51D27] hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : visiblePrograms.length === 0 ? (
          <div className="rounded-xl bg-[#F4F0EA]/60 px-4 py-8 text-center">
            <p className="font-semibold text-[#23140C] text-[15px]">
              No loyalty programs yet
            </p>
            <p className="mt-1 text-[13.5px] text-[#23140C]/75">
              Create a loyalty program to get started.
            </p>
          </div>
        ) : (
          visiblePrograms.map((program) => {
            const version = getLatestVersion(program);
            const rule = version?.earning_rule;
            const reward = version?.reward;

            return (
              <div
                key={program.id}
                className="flex flex-col justify-between gap-3 rounded-xl bg-[#F4F0EA]/50 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#23140C] text-[15px]">
                    {program.name}
                  </h3>

                  <p className="mt-1 text-[13.5px] text-[#23140C]/75">
                    {getEarningSummary(rule)}
                    {rule &&
                      ` · ${rule.stamps_awarded} stamp${rule.stamps_awarded === 1 ? "" : "s"} awarded`}
                  </p>

                  <p className="mt-1 text-[13.5px] text-[#23140C]/85">
                    Reward: {reward?.title || "Not specified"}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <StatusBadge status={program.status} />

                  <Link
                    to={`/merchant/loyalty-programs/${program.id}`}
                    className="text-[14px] font-semibold text-[#A51D27] hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-3">
        <Link
          to="/merchant/loyalty-programs"
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#A51D27] transition hover:gap-3"
        >
          Manage loyalty programs
          <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </div>
    </section>
  );
};

export default LoyaltyProgramOverview;
