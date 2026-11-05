import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLayerGroup,
  faQrcode,
  faBullhorn,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

const benefits = [
  {
    icon: faLayerGroup,
    title: "Several loyalty programs",
    text: "Reward visits, spending or specific products, and change the rules without affecting existing cards.",
  },
  {
    icon: faQrcode,
    title: "QR codes that fit your counter",
    text: "Print a permanent code, or show a rotating one on a tablet.",
  },
  {
    icon: faBullhorn,
    title: "Promo codes and offers",
    text: "Create shared or single-use codes, and send targeted offers to people who have visited before.",
  },
  {
    icon: faChartLine,
    title: "See your regulars",
    text: "Track repeat customers, visit history and redeemed vouchers in one dashboard.",
  },
];

export const ForBusinesses = () => {
  return (
    <section id="businesses" className="bg-blush-50 py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="font-display text-3xl font-extrabold text-brand-900 sm:text-4xl">
            For businesses
          </h2>
          <p className="mt-3 text-ink-soft">
            Cafes, salons, gyms and shops use Regulars to turn first visits into
            repeat customers.
          </p>
          <Link
            to="/merchant/register"
            className="mt-6 inline-flex rounded-lg bg-brand-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-800"
          >
            Register your business
          </Link>
        </div>

        <ul className="divide-y divide-blush-200 lg:col-span-3">
          {benefits.map((b) => (
            <li key={b.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-100 text-brand-800">
                <FontAwesomeIcon icon={b.icon} />
              </span>
              <div>
                <h3 className="font-display text-lg font-extrabold text-brand-900">
                  {b.title}
                </h3>
                <p className="mt-1 text-ink-soft">{b.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
