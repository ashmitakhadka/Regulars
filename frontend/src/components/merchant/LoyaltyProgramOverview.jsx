import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import loyaltyProgramService from "../../services/loyaltyProgramService";
import { Button } from "../../components/ui/Button";

const getLatestVersion = (program) => {
  return [...(program.versions || [])].sort(
    (a, b) => b.version_number - a.version_number,
  )[0];
};

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const getEarningSummary = (rule, stampsRequired) => {
  if (!rule) return "Earning details unavailable";

  const threshold = Number(rule.threshold);
  const earns = `earn ${plural(Number(rule.stamps_awarded), "stamp")}`;

  let text;

  switch (rule.earning_type) {
    case "visit":
      text =
        threshold > 1
          ? `Visit ${threshold} times, ${earns}`
          : `Every visit, ${earns}`;
      break;

    case "purchase":
      text =
        threshold > 0
          ? `Spend ${threshold} or more, ${earns}`
          : `Any purchase, ${earns}`;
      break;

    case "quantity":
      text =
        threshold > 1
          ? `Buy ${plural(threshold, "item")}, ${earns}`
          : `Buy 1 item, ${earns}`;
      break;

    default:
      text = "Earning rule";
  }

  return stampsRequired
    ? `${text} · ${plural(Number(stampsRequired), "stamp")} unlock the reward`
    : text;
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-emerald-50 text-emerald-800",
    inactive: "bg-[#F4F0EA] text-[#23140C]",
    archived: "bg-neutral-100 text-neutral-800",
  };

  return (
    <span
      className={`inline-flex h-7 min-w-[64px] items-center justify-center rounded-lg px-2.5 text-[12px] font-semibold capitalize ${
        styles[status] || "bg-gray-100 text-gray-700"
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

  const totalCount = nonArchivedPrograms.length;

  const activeCount = nonArchivedPrograms.filter(
    (program) => program.status === "active",
  ).length;

  // Show the latest two programs, with active programs first.
  const sortedPrograms = [...nonArchivedPrograms].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;

    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  const visiblePrograms = sortedPrograms.slice(0, 2);
  const hiddenCount = totalCount - visiblePrograms.length;

  return (
    <section className="mt-10 rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(35,20,12,0.06)] sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-display text-[18px] font-bold text-[#23140C]">
              Loyalty Programs
            </h2>

            {!loading && !error && (
              <p className="mt-0.5 text-[13px] text-[#23140C]/75">
                Total Programs{" "}
                <span className="font-bold text-[#A51D27]">{totalCount}</span>
                {" · "}
                {activeCount} Active
              </p>
            )}
          </div>
        </div>
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
              className="mt-3 cursor-pointer text-[14px] font-semibold text-[#A51D27] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : visiblePrograms.length === 0 ? (
          <div className="rounded-xl bg-[#F4F0EA]/60 px-4 py-8 text-center">
            <p className="text-[15px] font-semibold text-[#23140C]">
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

            const stampsRequired =
              reward?.stamps_required ?? version?.stamps_required;

            const enrolled = program.stamp_cards_count;

            return (
              <div
                key={program.id}
                className="flex flex-col justify-between gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-[15px] font-semibold text-[#23140C]">
                      {program.name}
                    </h3>

                    <span className="inline-flex items-center rounded-full bg-[#F4F0EA] px-2.5 py-0.5 text-[12.5px] font-semibold text-[#23140C]">
                      {reward?.title || "No reward set"}
                    </span>
                  </div>

                  <p className="mt-1 text-[13.5px] text-[#23140C]/75">
                    {getEarningSummary(rule, stampsRequired)}
                  </p>
                </div>

                <div className="flex items-center gap-3 sm:justify-end">
                  {enrolled != null && (
                    <div className="min-w-[48px] text-center leading-tight">
                      <p className="text-[15px] font-bold text-[#23140C]">
                        {Number(enrolled).toLocaleString()}
                      </p>
                      <p className="text-[12px] text-[#23140C]/70">Enrolled</p>
                    </div>
                  )}

                  <StatusBadge status={program.status} />

                  <Button
                    variant="secondary"
                    size="xs"
                    to={`/merchant/loyalty-programs/${program.id}`}
                    className="!h-7 !min-w-[64px] !rounded-lg !px-2.5"
                  >
                    View
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && !error && hiddenCount > 0 && (
        <div className="mt-2 flex justify-end pt-2">
          <Button
            variant="soft"
            size="xs"
            to="/merchant/loyalty-programs"
            className="!rounded-lg"
          >
            View more
          </Button>
        </div>
      )}
    </section>
  );
};

export default LoyaltyProgramOverview;
