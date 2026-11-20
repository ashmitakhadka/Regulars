import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faLocationDot,
  faPhone,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { businessService } from "../../services/customer/businessService";
import { Card } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { ProgramCard } from "../../components/customer/ProgramCard";

export const BusinessDetail = () => {
  const { slug } = useParams();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [imgError, setImgError] = useState(false);

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
  const hasLogo = Boolean(business.logo) && !imgError;

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
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900">
            Active Loyalty Programs
          </h2>
          <span className="text-xs sm:text-sm font-medium text-ink-soft">
            {programs.length} {programs.length === 1 ? "program" : "programs"} available
          </span>
        </div>

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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDetail;
