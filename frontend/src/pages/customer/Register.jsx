import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCustomerAuth } from "../../auth/CustomerAuthContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { getSafeRedirect } from "../../lib/safeRedirect";
import { customerRegisterSchema } from "../../lib/customerAuthSchema";

export const Register = () => {
  const { customer, register, loading: authLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
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
    const result = customerRegisterSchema.safeParse(formData);
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
      await register(result.data);
      const destination = getSafeRedirect(redirectParam);
      navigate(destination, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 429) {
        setGeneralError("Too many registration attempts. Please try again in a minute.");
      } else if (status === 422 && data?.errors) {
        const backendErrors = {};
        Object.entries(data.errors).forEach(([field, messages]) => {
          backendErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(backendErrors);
      } else {
        setGeneralError(data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const loginHref = redirectParam
    ? `/login?redirect=${encodeURIComponent(redirectParam)}`
    : "/login";

  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6 lg:py-16">
      <Card
        padding="p-0"
        className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl lg:grid-cols-2 text-left"
      >
        {/* Left Section */}
        <section className="flex flex-col justify-between bg-[#F4F0EA] p-6 sm:p-8 hidden sm:flex">
          <Logo size="lg" to="/" />

          <div className="my-12">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#91040C]">
              CUSTOMER REWARDS
            </p>

            <h1 className="max-w-md text-4xl font-bold leading-tight text-[#23140C] sm:text-5xl">
              All your rewards in one place.
            </h1>

            <p className="mt-6 max-w-md leading-7 text-[#77716D]">
              Never lose another paper stamp card. Track your progress, maintain daily streaks, and earn free rewards at your favorite local spots.
            </p>
          </div>

          <div className="border-t border-[#D8CFC4] pt-6">
            <p className="text-sm text-[#77716D]">
              Simple loyalty. No paper cards needed.
            </p>
          </div>
        </section>

        {/* Right Form Panel */}
        <section className="p-6 sm:p-8 flex flex-col justify-center">
          {/* Mobile Brand Header */}
          <div className="sm:hidden mb-4 flex justify-center">
            <Logo size="md" to="/" />
          </div>

          <div className="mb-5">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#91040C]">
              CUSTOMER REGISTRATION
            </p>

            <h2 className="text-3xl font-bold text-[#23140C]">
              Create your account
            </h2>

            <p className="mt-2 text-sm text-[#77716D]">
              Complete the details below to start collecting stamps.
            </p>
          </div>

          {generalError && (
            <div
              role="alert"
              className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 text-left font-medium"
            >
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Name and Phone */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange("name")}
                error={errors.name}
                autoComplete="name"
                disabled={submitting}
                required
              />

              <Input
                label="Mobile Number (Nepal)"
                type="tel"
                placeholder="98XXXXXXXX / 97XXXXXXXX"
                value={formData.phone}
                onChange={handleChange("phone")}
                error={errors.phone}
                autoComplete="tel"
                disabled={submitting}
                required
              />
            </div>

            {/* Row 2: Email (Full Width) */}
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange("email")}
              error={errors.email}
              autoComplete="email"
              disabled={submitting}
              required
            />

            {/* Row 3: Password and Confirm Password */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange("password")}
                error={errors.password}
                autoComplete="new-password"
                disabled={submitting}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={formData.password_confirmation}
                onChange={handleChange("password_confirmation")}
                error={errors.password_confirmation}
                autoComplete="new-password"
                disabled={submitting}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              loading={submitting}
              disabled={submitting}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-5 border-t border-blush-100 pt-4 text-center text-sm text-[#77716D] space-y-1.5">
            <p>
              Already have an account?{" "}
              <Link
                to={loginHref}
                className="font-semibold text-[#91040C] hover:underline"
              >
                Log In
              </Link>
            </p>

            <p>
              <Link
                to="/merchant/register"
                className="text-xs text-[#77716D] hover:text-[#91040C] transition"
              >
                Registering a business? Register here &rarr;
              </Link>
            </p>
          </div>
        </section>
      </Card>
    </main>
  );
};

export default Register;
