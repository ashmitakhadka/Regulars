import { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <Card>
          <h1 className="font-display text-2xl font-extrabold text-brand-900 mb-2">
            Welcome to Regulars
          </h1>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            Enter your email to receive a secure login link. No password needed.
          </p>

          {submitted ? (
            <div className="rounded-lg bg-blush-100 p-4 text-sm text-brand-900">
              <p className="font-bold mb-1">Check your inbox!</p>
              <p className="text-xs text-ink-soft">
                We sent a magic link to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" variant="primary" fullWidth size="md">
                Send magic link
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Login;

