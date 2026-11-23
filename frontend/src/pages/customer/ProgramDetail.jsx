import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift,
  faArrowLeft,
  faCheckCircle,
  faCalendarDays,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { businessService } from "../../services/customer/businessService";
import { useJoinProgram } from "../../hooks/useJoinProgram";
import { Card } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { BackButton } from "../../components/ui/BackButton";
import { StampProgress } from "../../components/customer/StampProgress";

export const ProgramDetail = () => {
  const { slug, id } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const { join, isJoining, getError } = useJoinProgram();

  const fetchProgram = async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await businessService.getProgram(id);
      if (response.success && response.data) {
        const data = response.data;

        // URL safety check: ensure the program belongs to the business slug in the URL
        if (data.business_slug && data.business_slug !== slug) {
          setNotFound(true);
          return;
        }

        setProgram(data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err.response?.data?.message || "Failed to load program details. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgram();
  }, [slug, id]);

  const handleJoin = async () => {
    if (!program?.id) return;
    const res = await join(program.id);
    if (!res || !res.success) return;

    // Update state to show Joined without a full reload
    setProgram((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        already_joined: true,
        my_card: res.card,
        card_id: res.card.id,
      };
    });

    navigate(`/wallet/${res.card.id}`);
  };

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
        icon={faCircleInfo}
        title="Program not found"
        description="This loyalty program does not exist, is currently inactive, or does not belong to this business."
        action={
          <Button to={`/businesses/${slug}`} variant="primary" size="md">
            Back to business
          </Button>
        }
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load program"
        message={error}
        onRetry={fetchProgram}
        action={
          <Button to={`/businesses/${slug}`} variant="outline" size="sm">
            Back to business
          </Button>
        }
      />
    );
  }

  const isJoined = Boolean(program?.already_joined || program?.joined || program?.my_card);
  const myCard = program?.my_card;
  const cardId = myCard?.card_id || program?.card_id;

  const rewardTitle =
    program?.reward?.title || program?.reward_title || "Program Reward";
  const rewardDesc =
    program?.reward?.description || program?.reward_description;
  const validityDays =
    program?.reward?.voucher_validity_days || program?.voucher_validity_days || 30;

  const isVisit = (program?.earning_method || "visit") === "visit";
  const stampsRequired = program?.stamps_required || (program?.threshold ? Number(program.threshold) : 10);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <BackButton to={`/businesses/${slug}`} iconOnly />
      </div>

      {/* Program Header Card */}
      <Card padding="p-5 sm:p-6" className="border-none">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-2xl sm:text-[28px] font-bold text-brand-900">
                {program?.name}
              </h1>
              {isJoined ? (
                <Tag variant="green" className="text-xs px-2.5 py-0.5">Joined</Tag>
              ) : (
                <Tag variant="cream" className="text-xs px-2.5 py-0.5">Available</Tag>
              )}
            </div>

            <p className="text-sm font-medium text-ink-soft mt-1.5">
              Offered by{" "}
              <Link
                to={`/businesses/${slug}`}
                className="text-brand-800 hover:underline"
              >
                {program?.business_name}
              </Link>
            </p>

            {program?.description && (
              <p className="text-sm text-ink-soft leading-relaxed mt-2.5">
                {program.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Membership & Stamp Progress Card */}
      <Card padding="p-5 sm:p-6" className="border-none">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900">
            Card Progress
          </h2>
          {isJoined && myCard?.status && (
            <Tag variant="green" className="capitalize text-xs px-2.5 py-0.5">
              {myCard.status}
            </Tag>
          )}
        </div>

        {isJoined && myCard ? (
          <div className="space-y-4">
            <StampProgress
              stamps={myCard.stamps_earned}
              total={stampsRequired}
              label="Current Progress"
            />

            <div className="pt-2">
              <Button
                to={`/wallet/${cardId}`}
                variant="primary"
                size="md"
                className="w-full sm:w-auto min-h-[44px]"
              >
                View my card in wallet
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-blush-50 p-4 sm:p-5 border border-blush-200 space-y-3">
            <p className="text-sm text-ink-soft leading-relaxed">
              You haven't joined this loyalty program yet. Join now to get your digital stamp card and start collecting stamps.
            </p>
            <div className="pt-1">
              <Button
                variant="primary"
                size="md"
                loading={isJoining(program?.id)}
                disabled={isJoining(program?.id)}
                onClick={handleJoin}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Join and get card
              </Button>
              {getError(program?.id) && (
                <p className="text-xs sm:text-sm text-brand-900 font-medium mt-2" role="alert">
                  {getError(program?.id)}
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Reward Details Card */}
      <Card padding="p-5 sm:p-6" className="border-none">
        <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3.5 flex items-center gap-2">
          <FontAwesomeIcon icon={faGift} className="text-brand-800" />
          <span>Reward Details</span>
        </h2>

        <div className="space-y-3.5">
          <div className="rounded-lg bg-blush-50 p-4 border border-blush-200">
            <h3 className="font-display text-base font-bold text-brand-900 mb-1">
              {rewardTitle}
            </h3>
            {rewardDesc && (
              <p className="text-sm text-ink-soft leading-relaxed">
                {rewardDesc}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="rounded-lg bg-white border border-blush-200 p-3 flex items-center gap-2.5">
              <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-700 text-sm shrink-0" />
              <div>
                <span className="font-semibold text-ink-soft block text-xs">Earning Rule</span>
                <span className="font-bold text-brand-900 text-sm">
                  {isVisit ? `1 stamp per visit (${stampsRequired} required)` : `Threshold: ${program?.threshold}`}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-white border border-blush-200 p-3 flex items-center gap-2.5">
              <FontAwesomeIcon icon={faCalendarDays} className="text-brand-800 text-sm shrink-0" />
              <div>
                <span className="font-semibold text-ink-soft block text-xs">Voucher Validity</span>
                <span className="font-bold text-brand-900 text-sm">
                  {validityDays} days after completion
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProgramDetail;
