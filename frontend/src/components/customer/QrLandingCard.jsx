import { Card } from "../ui/Card";
import { Logo } from "../ui/Logo";

/**
 * Reusable QrLandingCard for QR landing pages (/join/:slug and /businesses/:slug/programs/:id/join).
 * Standardized centered card layout with brand Logo, hint tag, typography, action button, and secondary link.
 */
export const QrLandingCard = ({
  hint,
  title,
  subtitle,
  actionButton,
  secondaryLink,
  children,
}) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="mb-8 flex justify-center">
          <Logo size="lg" to="/" />
        </div>

        {/* Card Container */}
        <Card padding="p-6 sm:p-8" className="text-center">
          {hint && (
            <span className="inline-block rounded-full bg-blush-100 text-brand-800 text-xs font-semibold px-3 py-1 mb-4 capitalize">
              {hint}
            </span>
          )}

          <h1 className="font-display text-2xl sm:text-[26px] font-bold text-brand-900 mb-2">
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm text-ink-soft mb-6 leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Action button & secondary links */}
          <div className="space-y-3">
            {actionButton}
            {secondaryLink && (
              <div className="pt-2">{secondaryLink}</div>
            )}
          </div>

          {children}
        </Card>
      </div>
    </div>
  );
};

export default QrLandingCard;
