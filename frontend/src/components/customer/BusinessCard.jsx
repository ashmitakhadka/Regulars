import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { Tag } from "../ui/Tag";

/**
 * Reusable BusinessCard for customer directory listings.
 * Matching the exact card size, padding, and font styling of Wallet cards.
 * Notice: No icon is used for the business name.
 */
export const BusinessCard = ({ business }) => {
  const programsCount = business.active_programs_count ?? 0;
  const programLabel =
    programsCount === 1 ? "1 active program" : `${programsCount} active programs`;

  return (
    <Link
      to={`/businesses/${business.slug}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-800 focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className="h-full flex flex-col justify-between group-hover:shadow-[0_4px_16px_rgba(43,17,20,0.1)] transition-all">
        <div>
          {/* Card Header: Business Name & Category Tag (matching Wallet card header) */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-brand-900 group-hover:text-brand-800 transition line-clamp-1">
                {business.business_name}
              </h2>
              {business.address && (
                <p className="text-xs text-ink-soft mt-0.5 line-clamp-1">
                  {business.address}
                </p>
              )}
            </div>

            {business.category && (
              <Tag variant="cream" className="capitalize shrink-0">
                {business.category}
              </Tag>
            )}
          </div>

          {/* Description */}
          {business.short_description && (
            <p className="text-sm text-ink-soft leading-relaxed line-clamp-2 mt-3">
              {business.short_description}
            </p>
          )}
        </div>

        {/* Card Footer: Programs count & View details (matching Wallet card footer) */}
        <div className="mt-4 pt-3 border-t border-blush-100 flex items-center justify-between text-xs text-ink-soft">
          <span className="font-medium">
            {programLabel}
          </span>
          <span className="font-semibold text-brand-800 group-hover:underline">
            View details &rarr;
          </span>
        </div>
      </Card>
    </Link>
  );
};

export default BusinessCard;
