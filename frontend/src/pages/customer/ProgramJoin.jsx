import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useCustomerAuth } from "../../auth/CustomerAuthContext";
import { businessService } from "../../services/customer/businessService";
import { useJoinProgram } from "../../hooks/useJoinProgram";
import { QrLandingCard } from "../../components/customer/QrLandingCard";
import { CustomerForbiddenState } from "../../components/customer/CustomerProtectedRoute";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Logo } from "../../components/ui/Logo";

/**
 * Public Program QR Landing Page (/businesses/:slug/programs/:id/join?qr={token}).
 * Checks program validity, routes joined customers directly to their wallet card,
 * allows direct join for logged in customers without a card,
 * and passes safe redirect parameters to login/register for guest users.
 */
export const ProgramJoin = () => {
  const { slug, id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { customer, loading: authLoading, authStatus } = useCustomerAuth();

  const [program, setProgram] = useState(null);
  const [programLoading, setProgramLoading] = useState(false);
  const [errorType, setErrorType] = useState(null); // '404' | '403' | 'error'

  const { join, isJoining, getError } = useJoinProgram();

  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Retrieve QR token from URL without logging or displaying it
  const qrToken = searchParams.get("qr");

  const rawSlug = slug || "";
  const readableSlug = rawSlug.replace(/-/g, " ");

  const programDetailPath = `/businesses/${rawSlug}/programs/${id}`;
  const targetPath = qrToken
    ? `${programDetailPath}?qr=${encodeURIComponent(qrToken)}`
    : programDetailPath;

  const fetchProgram = useCallback(async () => {
    if (!customer) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++activeRequestIdRef.current;

    setProgramLoading(true);
    setErrorType(null);

    try {
      const response = await businessService.getProgram(id, controller.signal);
      if (requestId === activeRequestIdRef.current) {
        const progData = response.data;

        // Verify slug match
        if (progData.business_slug && progData.business_slug !== rawSlug) {
          setErrorType("404");
          setProgramLoading(false);
          return;
        }

        // If customer already has a card for this program, redirect to wallet immediately
        if (progData.my_card?.card_id) {
          navigate(`/wallet/${progData.my_card.card_id}`, { replace: true });
          return;
        }

        setProgram(progData);
        setProgramLoading(false);
      }
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return;
      }
      if (requestId === activeRequestIdRef.current) {
        const status = err.response?.status;
        if (status === 403) {
          setErrorType("403");
        } else if (status === 404) {
          setErrorType("404");
        } else {
          setErrorType("error");
        }
        setProgramLoading(false);
      }
    }
  }, [customer, id, rawSlug, navigate]);

  useEffect(() => {
    if (customer) {
      fetchProgram();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [customer, fetchProgram]);

  const handleJoin = async () => {
    if (!program?.id) return;
    const res = await join(program.id);
    if (!res || !res.success) return;

    // Success (201 or 200 already_joined): navigate to wallet with replace
    navigate(`/wallet/${res.card.id}`, { replace: true });
  };

  // 1. Show only a Spinner while customer auth state is loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white" aria-live="polite">
        <Spinner size="lg" className="text-brand-800" />
      </div>
    );
  }

  // 2. Merchant or admin logged in
  if (authStatus === "forbidden" || errorType === "403") {
    return <CustomerForbiddenState />;
  }

  // 3. Logged-in customer handling
  if (customer) {
    if (programLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white" aria-live="polite">
          <Spinner size="lg" className="text-brand-800" />
        </div>
      );
    }

    if (errorType === "404") {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm sm:max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <Logo size="lg" to="/" />
            </div>
            <EmptyState
              title="Program not found"
              description="This loyalty program does not exist or does not belong to this business."
              action={
                <Button to="/businesses" variant="primary" size="md">
                  Browse businesses
                </Button>
              }
            />
          </div>
        </div>
      );
    }

    if (errorType === "error") {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm sm:max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <Logo size="lg" to="/" />
            </div>
            <ErrorState
              title="Couldn't load program"
              message="We were unable to load the loyalty program details. Please try again."
              onRetry={fetchProgram}
            />
          </div>
        </div>
      );
    }

    // Program loaded successfully, customer has no card yet
    const programName = program?.name;
    const subtitle = programName
      ? `Join ${programName} to collect stamps and earn rewards.`
      : "Collect stamps and earn rewards.";

    return (
      <QrLandingCard
        hint={readableSlug || "Loyalty Program"}
        title="Join this loyalty program"
        subtitle={subtitle}
        actionButton={
          <div className="w-full space-y-2">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              loading={isJoining(program?.id)}
              disabled={isJoining(program?.id)}
              onClick={handleJoin}
              className="min-h-[48px]"
            >
              Join and get card
            </Button>
            {getError(program?.id) && (
              <p className="text-xs sm:text-sm text-brand-900 font-medium text-center" role="alert">
                {getError(program?.id)}
              </p>
            )}
          </div>
        }
      />
    );
  }

  // 4. Guest / Unauthenticated customer
  return (
    <QrLandingCard
      hint={readableSlug || "Loyalty Program"}
      title="Join this loyalty program"
      subtitle="Collect stamps and earn rewards."
      actionButton={
        <Button
          to={`/login?redirect=${encodeURIComponent(targetPath)}`}
          variant="primary"
          fullWidth
          size="lg"
          className="min-h-[48px]"
        >
          Join and get card
        </Button>
      }
      secondaryLink={
        <p className="text-xs text-ink-soft">
          New here?{" "}
          <Link
            to={`/register?redirect=${encodeURIComponent(targetPath)}`}
            className="font-semibold text-brand-800 hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    />
  );
};

export default ProgramJoin;
