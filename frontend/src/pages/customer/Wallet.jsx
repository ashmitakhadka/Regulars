import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { Card } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";

export const Wallet = () => {
  const demoCards = [
    {
      id: "1",
      merchant: "Himalayan Java Cafe",
      program: "Java Regulars Coffee Card",
      stamps: 9,
      threshold: 10,
      streak: 5,
      tag: "1 stamp left!",
      tagVariant: "amber",
    },
    {
      id: "2",
      merchant: "Glow Beauty Salon",
      program: "Glow VIP Treatment Card",
      stamps: 4,
      threshold: 8,
      streak: 1,
      tag: "Active",
      tagVariant: "green",
    },
    {
      id: "3",
      merchant: "Kavre Fitness & Gym",
      program: "Iron Streak Workout Card",
      stamps: 2,
      threshold: 12,
      streak: 0,
      tag: "Active",
      tagVariant: "green",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-900">
          My Wallet
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Your loyalty stamp cards across all local businesses.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {demoCards.map((card) => (
          <Link key={card.id} to={`/wallet/${card.id}`} className="group block">
            <Card className="h-full group-hover:shadow-[0_4px_16px_rgba(43,17,20,0.1)] transition-all">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-brand-900 group-hover:text-brand-800 transition">
                    {card.merchant}
                  </h2>
                  <p className="text-xs text-ink-soft">{card.program}</p>
                </div>
                <Tag variant={card.tagVariant}>{card.tag}</Tag>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold text-ink-soft mb-1.5">
                  <span>Stamps collected</span>
                  <span className="text-brand-900 font-bold">
                    {card.stamps} / {card.threshold}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-blush-100">
                  <div
                    className="h-full rounded-full bg-brand-800 transition-all duration-300"
                    style={{
                      width: `${(card.stamps / card.threshold) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Streak badge */}
              <div className="mt-4 pt-3 border-t border-blush-100 flex items-center justify-between text-xs text-ink-soft">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <FontAwesomeIcon icon={faFire} className="text-brand-800" />
                  {card.streak} day streak
                </span>
                <span className="font-semibold text-brand-800 group-hover:underline">
                  View details &rarr;
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Wallet;

