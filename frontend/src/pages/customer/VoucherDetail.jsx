import { useParams, Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";

export const VoucherDetail = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/vouchers"
          className="text-xs font-semibold text-brand-800 hover:underline mb-2 inline-block"
        >
          &larr; Back to vouchers
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-brand-900">
          Voucher Detail
        </h1>
        <p className="text-sm text-ink-soft">Himalayan Java Cafe</p>
      </div>

      <Card className="text-center py-8">
        <Tag variant="green" className="mb-4">
          Active &bull; 25 days remaining
        </Tag>

        <h2 className="font-display text-2xl font-extrabold text-brand-900 mb-2">
          Free Specialty Beverage
        </h2>
        <p className="text-sm text-ink-soft max-w-sm mx-auto mb-6">
          Show this code to the barista before placing your order.
        </p>

        {/* Voucher Code Box */}
        <div className="inline-block rounded-xl bg-blush-50 border-2 border-dashed border-blush-300 px-8 py-5">
          <p className="text-xs uppercase tracking-widest text-ink-soft mb-1">
            Redemption Code
          </p>
          <p className="font-mono text-2xl sm:text-3xl font-extrabold text-brand-900 tracking-wider">
            {id || "VCH-ACTIVE-992"}
          </p>
        </div>

        <p className="text-xs text-ink-soft mt-6">
          Valid at all Himalayan Java branches in Nepal until Nov 30, 2026.
        </p>
      </Card>
    </div>
  );
};

export default VoucherDetail;

