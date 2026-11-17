import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift,
  faArrowRight,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import rewardProgramService from "../../services/rewardProgramService";

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
    active: "bg-green-50 text-green-700",
    inactive: "bg-[#F4F0EA] text-[#23140C]",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
};

export const RewardProgramOverview = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await rewardProgramService.getAllPrograms();

      setPrograms(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load reward programs.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
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
            <h2 className="font-display text-lg font-bold text-[#23140C]">
              Reward Programs
            </h2>
            <p className="mt-1 text-sm text-[#23140C]/60">
              Manage your loyalty offers
            </p>
          </div>
        </div>

        {!loading && !error && (
          <div className="flex items-center gap-3 sm:justify-end">
            <p className="text-sm font-medium text-[#23140C]/60">
              Total Programs
            </p>

            <p className="text-[18px] font-bold text-[#A51D27]">{totalCount}</p>

            <p className="text-xs text-[#23140C]/60">
              {activeCount} Active · {inactiveCount} Inactive
            </p>
          </div>
        )}
      </div>

      <div className="mt-7 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-[#23140C]/60">
            <FontAwesomeIcon icon={faRotate} className="mr-2 animate-spin" />
            Loading reward programs...
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchPrograms}
              className="mt-3 text-sm font-semibold text-[#A51D27]"
            >
              Try again
            </button>
          </div>
        ) : visiblePrograms.length === 0 ? (
          <div className="rounded-xl bg-[#F4F0EA]/60 px-4 py-8 text-center">
            <p className="font-semibold text-[#23140C]">
              No reward programs yet
            </p>
            <p className="mt-1 text-sm text-[#23140C]/60">
              Create a reward program to get started.
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
                  <h3 className="font-semibold text-[#23140C]">
                    {program.name}
                  </h3>

                  <p className="mt-1 text-sm text-[#23140C]/60">
                    {getEarningSummary(rule)}
                    {rule &&
                      ` · ${rule.stamps_awarded} stamp${rule.stamps_awarded === 1 ? "" : "s"} awarded`}
                  </p>

                  <p className="mt-1 text-sm text-[#23140C]/70">
                    Reward: {reward?.title || "Not specified"}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <StatusBadge status={program.status} />

                  <Link
                    to={`/merchant/reward-programs/${program.id}`}
                    className="text-sm font-semibold text-[#A51D27] hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4  pt-3">
        <Link
          to="/merchant/reward-programs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#A51D27] transition hover:gap-3"
        >
          Manage all programs
          <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </div>
    </section>
  );
};
