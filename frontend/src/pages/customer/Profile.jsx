import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useCustomerAuth } from "../../auth/CustomerAuthContext";

export const Profile = () => {
  const { customer, logout } = useCustomerAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-[28px] font-bold text-brand-900">
          Customer Profile
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Your customer identification and account details.
        </p>
      </div>

      <Card>
        <div className="text-center sm:text-left sm:flex sm:items-center sm:justify-between py-2 border-b border-blush-100 pb-6 mb-6">
          <div>
            <h2 className="font-display text-xl font-bold text-brand-900">
              {customer?.name || "Customer"}
            </h2>
            <p className="text-xs text-ink-soft">{customer?.email || ""}</p>
          </div>

          <div className="mt-4 sm:mt-0 text-center sm:text-right">
            <span className="text-xs text-ink-soft uppercase tracking-wider block mb-1">
              Customer ID
            </span>
            <span className="inline-block rounded-lg bg-blush-100 px-3.5 py-1.5 font-mono text-base font-extrabold text-brand-900">
              {customer?.customer_code || "—"}
            </span>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between py-2 border-b border-blush-50">
            <span className="text-ink-soft">Phone Number</span>
            <span className="font-semibold text-ink">{customer?.phone || "—"}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-blush-50">
            <span className="text-ink-soft">Account Type</span>
            <span className="font-semibold text-ink capitalize">Customer</span>
          </div>
        </div>

        <div className="mt-8 pt-4">
          <Button variant="ghost" onClick={handleLogout} size="sm">
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
