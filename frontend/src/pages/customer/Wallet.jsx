import { useState, useEffect, useRef, useCallback } from "react";
import { walletService } from "../../services/customer/walletService";
import { WalletCard } from "../../components/customer/WalletCard";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/Button";

/**
 * Customer Wallet page (/wallet).
 * Displays active stamp cards with stamps progress, shop info, streaks, and wallet summary.
 */
export const Wallet = () => {
  const [walletData, setWalletData] = useState({ cards: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const fetchWallet = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++activeRequestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const response = await walletService.getWallet(controller.signal);
      if (requestId === activeRequestIdRef.current) {
        setWalletData(response.data || { cards: [], summary: {} });
        setLoading(false);
      }
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return;
      }
      if (requestId === activeRequestIdRef.current) {
        setError(
          err.response?.data?.message || "We couldn't load your wallet. Please try again."
        );
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchWallet]);

  const cards = walletData.cards || [];
  const summary = walletData.summary || {};

  const activeCount = summary.active_cards_count ?? cards.length;
  const bizCount =
    summary.businesses_joined_count ??
    new Set(cards.map((c) => c.business?.id).filter(Boolean)).size;

  const cardLabel = activeCount === 1 ? "card" : "cards";
  const bizLabel = bizCount === 1 ? "business" : "businesses";
  const summaryText =
    activeCount > 0
      ? `${activeCount} ${cardLabel} from ${bizCount} ${bizLabel}`
      : "Your active loyalty stamp cards across local businesses.";

  return (
    <div className="space-y-6">
      {/* Page Heading & One-line Summary */}
      <div>
        <h1 className="font-display text-2xl sm:text-[28px] font-bold text-brand-900">
          My wallet
        </h1>
        <p className="text-sm text-ink-soft mt-1 leading-normal">
          {summaryText}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16" aria-live="polite">
          <Spinner size="lg" className="text-brand-800" />
          <p className="mt-3 text-sm text-ink-soft">Loading your stamp cards...</p>
        </div>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <ErrorState
          title="Couldn't load your wallet"
          message={error}
          onRetry={fetchWallet}
        />
      )}

      {/* Empty State */}
      {!loading && !error && cards.length === 0 && (
        <EmptyState
          title="No cards yet"
          description="No cards yet. Scan a shop's QR code or browse businesses to join a loyalty program."
          action={
            <Button to="/businesses" variant="primary" size="md">
              Browse businesses
            </Button>
          }
        />
      )}

      {/* Responsive Grid of Wallet Cards (1 col on mobile, 2 col on desktop) */}
      {!loading && !error && cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {cards.map((card) => (
            <WalletCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wallet;
