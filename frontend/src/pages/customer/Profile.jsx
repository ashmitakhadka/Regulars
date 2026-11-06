import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export const Profile = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-900">
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
              Demo Customer
            </h2>
            <p className="text-xs text-ink-soft">demo-customer@example.com</p>
          </div>

          <div className="mt-4 sm:mt-0 text-center sm:text-right">
            <span className="text-xs text-ink-soft uppercase tracking-wider block mb-1">
              My Customer Code
            </span>
            <span className="inline-block rounded-lg bg-blush-100 px-3.5 py-1.5 font-mono text-base font-extrabold text-brand-900">
              RG-DEM789
            </span>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between py-2 border-b border-blush-50">
            <span className="text-ink-soft">Phone Number</span>
            <span className="font-semibold text-ink">9801234567</span>
          </div>

          <div className="flex justify-between py-2 border-b border-blush-50">
            <span className="text-ink-soft">Account Type</span>
            <span className="font-semibold text-ink capitalize">Customer</span>
          </div>

          <div className="flex justify-between py-2 border-b border-blush-50">
            <span className="text-ink-soft">Active Memberships</span>
            <span className="font-semibold text-ink">3 merchants</span>
          </div>
        </div>

        <div className="mt-8 pt-4">
          <Button variant="ghost" to="/login" size="sm">
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;

