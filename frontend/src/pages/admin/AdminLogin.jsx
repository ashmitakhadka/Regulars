import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, Button, Input, Logo, Alert } from "../../components/ui";
import { useAdminAuth } from "../../auth/AdminAuthContext";
import { adminLoginSchema } from "../../lib/adminAuthSchema";

export const AdminLogin = () => {
  const { authStatus, login } = useAdminAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated as superadmin, redirect to /admin
  if (authStatus === "authenticated") {
    return <Navigate to="/admin" replace />;
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (generalError) setGeneralError("");
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setFormErrors({});

    const result = adminLoginSchema.safeParse(formData);
    if (!result.success) {
      const errors = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0]] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await login(formData);
      navigate("/admin", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setGeneralError("Email or password is incorrect.");
      } else if (status === 422) {
        const serverErrors = err.response?.data?.errors || {};
        const mapped = {};
        Object.keys(serverErrors).forEach((key) => {
          mapped[key] = serverErrors[key][0];
        });
        setFormErrors(mapped);
      } else if (status === 429) {
        setGeneralError(
          err.response?.data?.message || "Too many login attempts. Please try again later."
        );
      } else {
        setGeneralError(
          err.response?.data?.message || "Failed to log in. Please check your connection."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blush-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <Logo />
        </div>
        <span className="inline-block text-[11px] uppercase font-extrabold tracking-widest bg-blush-100 text-brand-900 px-2.5 py-1 rounded-md mb-2">
          Administration
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 tracking-tight">
          Admin sign in
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-ink-soft">
          Access the platform administration portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-8">
          {generalError && (
            <Alert variant="error" className="mb-5">
              {generalError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Admin Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={formErrors.email}
              required
              autoComplete="email"
              placeholder="admin@example.com"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              error={formErrors.password}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                disabled={isLoading}
                className="w-full justify-center"
              >
                Sign In to Admin
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
