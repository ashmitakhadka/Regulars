import { Link, useSearchParams } from "react-router-dom";
import { Logo } from "./Logo";
import { OptionCard } from "./OptionCard";
import { getSafeRedirect } from "../../lib/safeRedirect";

export const AuthChoiceLayout = ({
  title,
  subtitle,
  customerOption,
  businessOption,
  footerPrompt,
  footerLinkText,
  footerLinkTo,
}) => {
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const safeRedirect = redirectParam ? getSafeRedirect(redirectParam) : null;

  // Pass ?redirect= ONLY to customer and footer links, never to business links
  const customerTo = safeRedirect
    ? `${customerOption.to}?redirect=${encodeURIComponent(safeRedirect)}`
    : customerOption.to;

  const footerTo = safeRedirect
    ? `${footerLinkTo}?redirect=${encodeURIComponent(safeRedirect)}`
    : footerLinkTo;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" to="/" />
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#23140c] mb-2 tracking-tight">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-ink-soft mb-10 max-w-md mx-auto leading-relaxed">
          {subtitle}
        </p>

        <div className="grid sm:grid-cols-2 gap-6 mb-8 items-stretch">
          <OptionCard
            icon={customerOption.icon}
            title={customerOption.title}
            text={customerOption.text}
            buttonLabel={customerOption.buttonLabel}
            to={customerTo}
            variant="primary"
          />
          <OptionCard
            icon={businessOption.icon}
            title={businessOption.title}
            text={businessOption.text}
            buttonLabel={businessOption.buttonLabel}
            to={businessOption.to}
            variant="outline"
          />
        </div>

        <p className="text-sm text-ink-soft">
          {footerPrompt}{" "}
          <Link
            to={footerTo}
            className="font-bold text-brand-800 hover:text-brand-900 hover:underline transition"
          >
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthChoiceLayout;
