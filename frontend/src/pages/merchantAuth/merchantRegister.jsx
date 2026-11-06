import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MerchantRegisterSchema } from "../../schema/merchantRegistrationSchema";
import api from "../../services/api";
import toast from "react-hot-toast";

export const MerchantRegistration = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(MerchantRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      business_name: "",
      phone: "",
      address: "",
      description: "",
    },
  });

  const inputClass =
    "w-full rounded-lg border border-[#E5DED6] bg-white px-4 py-2.5 text-sm text-[#23140C] outline-none transition focus:border-[#91040C] focus:ring-2 focus:ring-[#91040C]/10";

  const labelClass = "mb-2 block text-sm font-semibold text-[#23140C]";

  const businessLabelClass = "mb-1 block text-sm font-semibold text-[#23140C]";

  // Validate account details before moving to the next step
  const handleNextStep = async () => {
    const isValid = await trigger([
      "name",
      "email",
      "password",
      "password_confirmation",
    ]);

    if (isValid) {
      setStep(2);
    }
  };

  // Handle final form submission
  const handleRegister = async (data) => {
    try {
      const response = await api.post("/register/merchant", data);

      console.log(response.data);

      toast.success("Registration successful!");

      navigate("/merchant/login");
    } catch (error) {
      if (error.response) {
        const message = error.response.data.message || "Registration failed!";
        toast.error(message);
        if (error.response.data.errors) {
          Object.values(error.response.data.errors)
            .flat()
            .forEach((errorMessage) => {
              toast.error(errorMessage);
            });
        }
      } else if (error.request) {
        toast.error("Unable to connect to the server. Please try again.");
      } else {
        toast.error(error.message || "Something went wrong!");
      }
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl lg:grid-cols-2">
        {/* Left Section */}
        <section className="flex flex-col justify-between bg-[#F4F0EA] p-6 sm:p-8">
          <Link
            to="/"
            className="text-3xl font-extrabold tracking-tight text-[#23140C]"
          >
            Regulars<span className="text-[#91040C]">.</span>
          </Link>

          <div className="my-12">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#91040C]">
              Welcome to Regulars
            </p>

            <h1 className="max-w-md text-4xl font-bold leading-tight text-[#23140C] sm:text-5xl">
              Turn your customers into regulars.
            </h1>

            <p className="mt-6 max-w-md leading-7 text-[#77716D]">
              Build stronger customer relationships with simple digital loyalty
              programs. Create your merchant account and start rewarding your
              customers.
            </p>
          </div>

          <div className="border-t border-[#D8CFC4] pt-6">
            <p className="text-sm text-[#77716D]">
              Simple loyalty. Stronger relationships.
            </p>
          </div>
        </section>

        {/* Right Section */}
        <section className="p-6 sm:p-8">
          <div className="mb-5">
            <p className="mb-2 text-sm font-semibold text-[#91040C]">
              MERCHANT REGISTRATION
            </p>

            <h2 className="text-3xl font-bold text-[#23140C]">
              Create your account
            </h2>

            <p className="mt-2 text-sm text-[#77716D]">
              Complete the following steps to register your business.
            </p>
          </div>

          {/* Progress */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#91040C] text-sm font-bold text-white">
                1
              </div>

              <span className="text-sm font-semibold text-[#23140C]">
                Account
              </span>
            </div>

            <div className="h-px flex-1 bg-[#E5DED6]" />

            <div className="flex flex-1 items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  step === 2
                    ? "bg-[#91040C] text-white"
                    : "bg-[#F4F0EA] text-[#77716D]"
                }`}
              >
                2
              </div>

              <span className="text-sm font-semibold text-[#23140C]">
                Business
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleRegister)}>
            {/* Step 1: Account Details */}
            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    Owner Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    {...register("name")}
                    placeholder="Enter your full name"
                    className={inputClass}
                  />

                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="you@example.com"
                    className={inputClass}
                  />

                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className={labelClass}>
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    {...register("password")}
                    placeholder="Enter your password"
                    className={inputClass}
                  />

                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password_confirmation" className={labelClass}>
                    Confirm Password
                  </label>

                  <input
                    id="password_confirmation"
                    type="password"
                    {...register("password_confirmation")}
                    placeholder="Confirm your password"
                    className={inputClass}
                  />

                  {errors.password_confirmation && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password_confirmation.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full rounded-lg bg-[#91040C] px-5 py-3.5 font-semibold text-white transition hover:bg-[#72030A]"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <div className="space-y-2.5">
                <div>
                  <label htmlFor="business_name" className={businessLabelClass}>
                    Business Name
                  </label>

                  <input
                    id="business_name"
                    type="text"
                    {...register("business_name")}
                    placeholder="Enter your business name"
                    className={inputClass}
                  />

                  {errors.business_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.business_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className={businessLabelClass}>
                    Business Phone
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    placeholder="Enter your business phone"
                    className={inputClass}
                  />

                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className={businessLabelClass}>
                    Business Address
                  </label>

                  <textarea
                    id="address"
                    {...register("address")}
                    placeholder="Enter your business address"
                    className={inputClass}
                    rows={2}
                  />

                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className={businessLabelClass}>
                    Business Description
                    <span className="ml-2 font-normal text-[#99918B]">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    id="description"
                    {...register("description")}
                    placeholder="Tell us about your business"
                    className={inputClass}
                    rows={2}
                  />

                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 rounded-lg border border-[#91040C] px-4 py-2.5 font-semibold text-[#91040C] transition hover:bg-[#F4F0EA]"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-[#91040C] px-4 py-2.5 font-semibold text-white transition hover:bg-[#72030A]"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-5 text-center text-sm text-[#77716D]">
            Already have an account?{" "}
            <Link
              to="/merchant/login"
              className="font-semibold text-[#91040C] hover:underline"
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
};
