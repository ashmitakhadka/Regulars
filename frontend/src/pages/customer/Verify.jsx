import { useSearchParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

export const Verify = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <Card>
          <div className="flex flex-col items-center justify-center py-6">
            <Spinner size="lg" className="text-brand-800 mb-4" />
            <h1 className="font-display text-xl font-bold text-brand-900 mb-2">
              Verifying your magic link
            </h1>
            <p className="text-xs text-ink-soft max-w-xs mb-6">
              {token
                ? "Connecting your account and logging you in..."
                : "Missing or invalid token. Please request a new magic link."}
            </p>

            <Button to="/wallet" variant="secondary" size="sm">
              Go to Wallet
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Verify;

