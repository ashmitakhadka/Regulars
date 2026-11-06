import { useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

export const Join = () => {
  const { merchantSlug } = useParams();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <Card>
          <span className="inline-block rounded-full bg-blush-100 text-brand-800 text-xs font-semibold px-3 py-1 mb-4">
            Join Loyalty Program
          </span>

          <h1 className="font-display text-2xl font-extrabold text-brand-900 mb-2 capitalize">
            {merchantSlug ? merchantSlug.replace(/-/g, " ") : "Merchant"}
          </h1>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            Scan confirmed! Become a regular here to collect stamps, build streaks,
            and earn free rewards.
          </p>

          <Button to="/wallet" variant="primary" fullWidth size="lg">
            Join & Get Card
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Join;

