import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { MerchantLoginSchema } from "../../schema/merchantLoginSchema";

export const MerchantLogin = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(MerchantLoginSchema),
  });

  const handleLogin = async (data) => {
    try {
      const response = await api.post("/login/merchant", data);

      console.log(response.data);

      // Store Sanctum token
      localStorage.setItem("token", response.data.token);

      toast.success(response.data.message || "Login successful!");

      navigate("/merchant/dashboard");
    } catch (error) {
      console.error("Login failed:", error);

      if (error.response) {
        const message = error.response.data.message || "Login failed!";

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
    <div className="min-h-screen flex items-center justify-center bg-[#f8f5ef] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#23140c]">Welcome Back!</h1>

          <p className="mt-2 text-gray-500">
            Login to manage your business and rewards.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="mb-2 block font-medium text-[#23140c]">
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              {...register("email")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#91040c]"
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block font-medium text-[#23140c]">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#91040c]"
            />

            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#91040c] py-3 font-semibold text-white transition hover:bg-[#72030a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Registration Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have a merchant account?{" "}
          <Link
            to="/merchant/register"
            className="font-semibold text-[#91040c] hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
