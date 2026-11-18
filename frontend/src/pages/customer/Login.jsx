import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCustomerAuth } from "../../auth/CustomerAuthContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { getSafeRedirect } from "../../lib/safeRedirect";
import { customerLoginSchema } from "../../lib/customerAuthSchema";

export const Login = () => {
  const { customer, login, loading: authLoading, resetLoggedOut } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  useEffect(() => {
    resetLoggedOut();
  }, [resetLoggedOut]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already logged in as a customer, redirect immediately
  if (!authLoading && customer) {
    const destination = getSafeRedirect(redirectParam);
    navigate(destination, { replace: true });
    return null;
  }

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (generalError) {
      setGeneralError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    // Validate with Zod
    const result = customerLoginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await login(result.data);
      const destination = getSafeRedirect(redirectParam);
      navigate(destination, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 401) {
        setGeneralError("Email or password is incorrect");
      } else if (status === 429) {
        setGeneralError("Too many login attempts. Please try again in a minute.");
      } else if (status === 422 && data?.errors) {
        const backendErrors = {};
        Object.entries(data.errors).forEach(([field, messages]) => {
          backendErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(backendErrors);
      } else {
        setGeneralError(data?.message || "Unable to log in. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const registerHref = redirectParam
    ? `/register?redirect=${encodeURIComponent(redirectParam)}`
    : "/register";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] text-center">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" to="/" />
        </div>

        <Card>
          <h1 className="font-display text-2xl font-extrabold text-brand-900 mb-1">
            Customer Log In
          </h1>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            Welcome back! Enter your details to access your cards and vouchers.
          </p>

          {generalError && (
            <div
              role="alert"
              className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 text-left font-medium"
            >
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange("email")}
              error={errors.email}
              autoComplete="email"
              disabled={submitting}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange("password")}
              error={errors.password}
              autoComplete="current-password"
              disabled={submitting}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              loading={submitting}
              disabled={submitting}
            >
              Log In
            </Button>
          </form>

          <div className="mt-6 border-t border-blush-100 pt-5 text-center text-sm text-ink-soft space-y-2">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                to={registerHref}
                className="font-bold text-brand-800 hover:text-brand-900 hover:underline transition"
              >
                Create an account
              </Link>
            </p>

            <p className="pt-1">
              <Link
                to="/merchant/login"
                className="text-xs text-ink-soft hover:text-brand-800 transition"
              >
                Own a business? Log in here &rarr;
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
