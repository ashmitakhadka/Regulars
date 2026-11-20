import { useParams, useSearchParams, Link } from "react-router-dom";
import { useCustomerAuth } from "../../auth/CustomerAuthContext";
import { QrLandingCard } from "../../components/customer/QrLandingCard";
import { CustomerForbiddenState } from "../../components/customer/CustomerProtectedRoute";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";

/**
 * Public Business QR Landing Page (/join/:merchantSlug?qr={token}).
 * Directs customers to the business profile or to login/register with safe redirects.
 */
export const Join = () => {
  const { merchantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { customer, loading: authLoading, authStatus } = useCustomerAuth();

  // Show only a Spinner while customer auth state is loading (no flash of logged-out state)
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white" aria-live="polite">
        <Spinner size="lg" className="text-brand-800" />
      </div>
    );
  }

  // Merchant or admin logged in
  if (authStatus === "forbidden") {
    return <CustomerForbiddenState />;
  }

  const rawSlug = merchantSlug || "";
  const readableSlug = rawSlug.replace(/-/g, " ");

  // Retrieve QR token from URL without logging or displaying it
  const qrToken = searchParams.get("qr");

  // Destination path
  const businessPath = `/businesses/${rawSlug}`;
  const targetPath = qrToken
    ? `${businessPath}?qr=${encodeURIComponent(qrToken)}`
    : businessPath;

  const isLoggedIn = Boolean(customer);

  return (
    <QrLandingCard
      hint={readableSlug || "Local Business"}
      title="Explore this business"
      subtitle="You scanned a Regulars QR code. See what this business offers."
      actionButton={
        isLoggedIn ? (
          <Button to={businessPath} variant="primary" fullWidth size="lg">
            Explore business
          </Button>
        ) : (
          <Button
            to={`/login?redirect=${encodeURIComponent(targetPath)}`}
            variant="primary"
            fullWidth
            size="lg"
          >
            Explore business
          </Button>
        )
      }
      secondaryLink={
        !isLoggedIn && (
          <p className="text-xs text-ink-soft">
            New here?{" "}
            <Link
              to={`/register?redirect=${encodeURIComponent(targetPath)}`}
              className="font-semibold text-brand-800 hover:underline"
            >
              Create an account
            </Link>
          </p>
        )
      }
    />
  );
};

export default Join;
