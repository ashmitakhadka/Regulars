import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faLocationDot,
  faPhone,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { businessService } from "../../services/customer/businessService";
import { useJoinProgram } from "../../hooks/useJoinProgram";
import { Card } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { ProgramCard } from "../../components/customer/ProgramCard";

export const BusinessDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const {
    join,
    joinBulk,
    isJoining,
    isBulkJoining,
    getError,
    bulkError,
  } = useJoinProgram();

  const fetchBusiness = async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await businessService.getBusiness(slug);
      if (response.success && response.data) {
        setBusiness(response.data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err.response?.data?.message || "Failed to load business details. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusiness();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center py-16">
        <Spinner size="lg" className="text-brand-800" />
      </div>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        icon={faStore}
        title="Business not found"
        description="The business you are looking for does not exist, has been suspended, or is temporarily unavailable."
        action={
          <Button to="/businesses" variant="primary" size="md">
            Back to all businesses
          </Button>
        }
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load business"
        message={error}
        onRetry={fetchBusiness}
        action={
          <Button to="/businesses" variant="outline" size="sm">
            Back to businesses
          </Button>
        }
      />
    );
  }

  const programs = business?.programs || [];
  const hasLogo = Boolean(business?.logo) && !imgError;

  const isProgramJoined = (p) =>
    Boolean(p.already_joined || p.joined || p.is_joined);
  const unjoinedPrograms = programs.filter((p) => !isProgramJoined(p));

  const handleSingleJoin = async (programId) => {
    setBulkResult(null);
    const res = await join(programId);
    if (!res || !res.success) return;

    // Update local program state immediately
    setBusiness((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        programs: prev.programs.map((p) =>
          p.id === programId
            ? { ...p, already_joined: true, card_id: res.card.id }
            : p
        ),
      };
    });

    navigate(`/wallet/${res.card.id}`);
  };

  const handleBulkJoin = async () => {
    if (unjoinedPrograms.length === 0) return;
    setBulkResult(null);

    const idsToJoin = unjoinedPrograms.map((p) => p.id);
    const res = await joinBulk(idsToJoin);
    if (!res || !res.success) return;

    const results = res.results || [];
    const joinedOrAlready = results.filter(
      (r) => r.status === "joined" || r.status === "already_joined"
    );
    const unavailable = results.filter((r) => r.status === "unavailable");

    // Match unavailable program names from the loaded programs
    const unavailableWithNames = unavailable.map((r) => {
      const found = programs.find((p) => p.id === r.program_id);
      return {
        id: r.program_id,
        name: found?.name || `Program #${r.program_id}`,
      };
    });

    // Update local programs state without reload
    const joinedMap = new Map();
    joinedOrAlready.forEach((r) => {
      joinedMap.set(r.program_id, r.card?.id);
    });

    setBusiness((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        programs: prev.programs.map((p) => {
          if (joinedMap.has(p.id)) {
            return {
              ...p,
              already_joined: true,
              card_id: joinedMap.get(p.id) || p.card_id,
            };
          }
          return p;
        }),
      };
    });

    setBulkResult({
      joinedCount: joinedOrAlready.length,
      unavailable: unavailableWithNames,
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/businesses"
          className="inline-flex items-center gap-2 text-xs font-semibold text-brand-800 hover:underline min-h-[44px] py-2"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          <span>Back to all businesses</span>
        </Link>
      </div>

      {/* Business Header Card */}
      <Card padding="p-5 sm:p-6" className="border-none">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          {hasLogo && (
            <img
              src={business.logo}
              alt={`${business.name} logo`}
              onError={() => setImgError(true)}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border border-blush-200 shrink-0 shadow-sm"
            />
          )}

          {/* Business Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="font-display text-2xl sm:text-[28px] font-bold text-brand-900">
                {business.name}
              </h1>
              {business.category && (
                <Tag variant="cream" className="capitalize text-xs px-2.5 py-0.5">
                  {business.category}
                </Tag>
              )}
            </div>

            {business.description && (
              <p className="text-sm text-ink-soft leading-relaxed mt-1.5">
                {business.description}
              </p>
            )}

            {/* Address & Phone */}
            <div className="mt-4 pt-3 border-t border-blush-100 flex flex-wrap gap-4 text-xs sm:text-sm text-ink-soft">
              {business.address && (
                <div className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faLocationDot} className="text-brand-800 text-xs" />
                  <span>{business.address}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faPhone} className="text-brand-800 text-xs" />
                  <a
                    href={`tel:${business.phone}`}
                    className="hover:text-brand-900 hover:underline"
                  >
                    {business.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Loyalty Programs Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900">
              Active Loyalty Programs
            </h2>
            <span className="text-xs sm:text-sm font-medium text-ink-soft">
              {programs.length} {programs.length === 1 ? "program" : "programs"} available
            </span>
          </div>

          {/* Bulk Join Button when 2 or more unjoined programs exist */}
          {unjoinedPrograms.length >= 2 && (
            <Button
              variant="primary"
              size="md"
              loading={isBulkJoining}
              disabled={isBulkJoining}
              onClick={handleBulkJoin}
              className="w-full sm:w-auto text-xs sm:text-sm min-h-[44px]"
            >
              Join all {unjoinedPrograms.length} programs
            </Button>
          )}
        </div>

        {/* Bulk Result Feedback Banner */}
        {bulkResult && (
          <Card
            padding="p-4 sm:p-5"
            className="border-none bg-emerald-50/70 border border-emerald-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-display font-bold text-brand-900 text-sm sm:text-base">
                  {bulkResult.joinedCount > 0
                    ? `Joined ${bulkResult.joinedCount} ${
                        bulkResult.joinedCount === 1 ? "program" : "programs"
                      }`
                    : "No programs could be joined"}
                </p>
                {bulkResult.unavailable.length > 0 && (
                  <div className="mt-2 text-xs sm:text-sm text-brand-900 space-y-1">
                    <p className="font-semibold text-brand-800">
                      Unavailable programs:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {bulkResult.unavailable.map((u) => (
                        <li key={u.id}>
                          <span className="font-medium">{u.name}</span>: This
                          program is no longer available
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {bulkResult.joinedCount > 0 && (
                  <Button
                    to="/wallet"
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] text-xs sm:text-sm"
                  >
                    View in wallet
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBulkResult(null)}
                  className="text-xs text-ink-soft hover:text-brand-900 min-h-[44px]"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Bulk Error Message */}
        {bulkError && (
          <div
            className="rounded-lg bg-red-50 p-3.5 border border-red-200"
            role="alert"
          >
            <p className="text-xs sm:text-sm text-brand-900 font-medium">
              {bulkError}
            </p>
          </div>
        )}

        {programs.length === 0 ? (
          <EmptyState
            icon={faStore}
            title="No active loyalty programs"
            description="This business does not have any active stamp card programs right now."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                businessSlug={slug}
                onJoin={handleSingleJoin}
                isJoining={isJoining(program.id)}
                joinError={getError(program.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDetail;
