import { Navigate, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../../auth/CustomerAuthContext";
import { Spinner } from "../ui/Spinner";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Logo } from "../ui/Logo";

export const CustomerForbiddenState = () => (
  <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-white">
    <div className="w-full max-w-[420px] text-center">
      <div className="mb-6 flex justify-center">
        <Logo size="md" to="/" />
      </div>

      <Card>
        <h2 className="font-display text-xl font-bold text-brand-900 mb-2">
          This area is for customer accounts
        </h2>
        <p className="text-sm text-ink-soft mb-6 leading-relaxed">
          You are currently logged in with a merchant or administrator account.
        </p>

        <div className="flex flex-col gap-3">
          <Button to="/merchant/dashboard" variant="primary" fullWidth size="md">
            Go to merchant dashboard
          </Button>
          <Button to="/login" variant="outline" fullWidth size="md">
            Log in as a customer
          </Button>
        </div>
      </Card>
    </div>
  </div>
);

export const CustomerProtectedRoute = ({ children }) => {
  const { customer, loading, authStatus, justLoggedOut } = useCustomerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spinner size="lg" className="text-brand-800" />
      </div>
    );
  }

  // If a merchant or admin is logged in, /api/customer/me returned 403
  if (authStatus === "forbidden") {
    return <CustomerForbiddenState />;
  }

  // If not logged in (/api/customer/me returned 401)
  if (!customer) {
    if (justLoggedOut) {
      return <Navigate to="/login" replace />;
    }
    const redirectTarget = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
  }

  return children;
};

export default CustomerProtectedRoute;
