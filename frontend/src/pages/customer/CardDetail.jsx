import { useParams, Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";

export const CardDetail = () => {
  const { cardId } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/wallet"
          className="text-xs font-semibold text-brand-800 hover:underline mb-2 inline-block"
        >
          &larr; Back to wallet
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-brand-900">
          Stamp Card #{cardId}
        </h1>
        <p className="text-sm text-ink-soft">
          Himalayan Java Cafe &bull; Java Regulars Coffee Card
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-lg font-bold text-brand-900">
              Reward Progress
            </h2>
            <p className="text-xs text-ink-soft">9 of 10 stamps earned</p>
          </div>
          <Tag variant="amber">1 stamp left!</Tag>
        </div>

        {/* 10 Stamp Grid */}
        <div className="grid grid-cols-5 gap-3 py-4 max-w-sm mx-auto text-center">
          {Array.from({ length: 10 }).map((_, index) => {
            const isEarned = index < 9;
            return (
              <div
                key={index}
                className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition ${
                  isEarned
                    ? "bg-brand-800 text-white shadow-sm"
                    : "bg-blush-50 text-ink-soft border border-dashed border-blush-300"
                }`}
              >
                {isEarned ? "☕" : index + 1}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-blush-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft">Reward</p>
            <p className="text-sm font-bold text-brand-900">
              Free Specialty Beverage
            </p>
          </div>
          <Button to="/vouchers" variant="secondary" size="sm">
            View Vouchers
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CardDetail;

