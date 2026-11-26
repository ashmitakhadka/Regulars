import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../auth/AdminAuthContext";
import { Spinner, Card, Button } from "../ui";

/**
 * Guard for protected admin pages.
 * - Loading: displays full spinner
 * - Unauthenticated: navigates to /admin/login
 * - Forbidden (logged in as merchant or customer): displays polite notice with return button
 */
export const AdminProtectedRoute = ({ children }) => {
  const { authStatus, loading } = useAdminAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-blush-50/50 flex flex-col items-center justify-center p-4">
        <Spinner size="lg" />
        <p className="text-sm text-ink-soft mt-3 font-medium">Loading admin portal...</p>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return <Navigate to="/admin/login" replace />;
  }

  if (authStatus === "forbidden") {
    return (
      <div className="min-h-screen bg-blush-50/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-900 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="font-display text-xl font-bold text-brand-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            This area is for admin accounts. You are currently signed in with a different role.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Go to Home Page
          </Button>
        </Card>
      </div>
    );
  }

  return children;
};

export default AdminProtectedRoute;
