import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";

export const Vouchers = () => {
  const demoVouchers = [
    {
      id: "VCH-ACTIVE-992",
      merchant: "Himalayan Java Cafe",
      title: "Free Specialty Beverage",
      status: "active",
      tagVariant: "green",
      expiry: "Valid until Nov 30, 2026",
    },
    {
      id: "VCH-EXPIRED-114",
      merchant: "Kavre Fitness & Gym",
      title: "Free 1-Day Guest Pass",
      status: "expired",
      tagVariant: "red",
      expiry: "Expired on Oct 21, 2026",
    },
    {
      id: "VCH-REDEEMED-773",
      merchant: "Glow Beauty Salon",
      title: "Express Manicure Treatment",
      status: "redeemed",
      tagVariant: "cream",
      expiry: "Redeemed on Nov 3, 2026",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-900">
          My Vouchers
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Show your active voucher code to the merchant at checkout.
        </p>
      </div>

      <div className="space-y-4">
        {demoVouchers.map((vch) => (
          <Link key={vch.id} to={`/vouchers/${vch.id}`} className="group block">
            <Card className="group-hover:shadow-[0_4px_16px_rgba(43,17,20,0.1)] transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    {vch.merchant}
                  </span>
                  <h2 className="font-display text-lg font-bold text-brand-900 group-hover:text-brand-800 transition mt-0.5">
                    {vch.title}
                  </h2>
                  <p className="text-xs text-ink-soft mt-2">{vch.expiry}</p>
                </div>

                <div className="text-right">
                  <Tag variant={vch.tagVariant} className="capitalize">
                    {vch.status}
                  </Tag>
                  <p className="mt-3 font-mono text-xs font-bold text-brand-900">
                    {vch.id}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Vouchers;

