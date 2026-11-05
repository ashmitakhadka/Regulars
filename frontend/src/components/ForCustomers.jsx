import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faMobileScreen,
  faFire,
  faTicket,
} from "@fortawesome/free-solid-svg-icons";

const benefits = [
  {
    icon: faWallet,
    title: "All your cards in one place",
    text: "Every business's loyalty card lives in one wallet on your phone.",
  },
  {
    icon: faMobileScreen,
    title: "No app to install",
    text: "Scan the QR code with your normal camera and your stamp is recorded.",
  },
  {
    icon: faFire,
    title: "Streaks",
    text: "Visit on consecutive days to build a streak at your favourite places.",
  },
  {
    icon: faTicket,
    title: "Clear vouchers",
    text: "Finished cards turn into vouchers, with the expiry date shown.",
  },
];

export const ForCustomers = () => {
  return (
    <section id="customers" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="font-display text-3xl font-extrabold text-brand-900 sm:text-4xl">
          For customers
        </h2>
        <p className="mt-3 max-w-xl text-ink-soft">
          No more lost paper cards. Scan at a participating business to start
          collecting.
        </p>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <li key={b.title}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush-100 text-brand-800">
                <FontAwesomeIcon icon={b.icon} />
              </span>
              <h3 className="mt-4 font-display text-lg font-extrabold text-brand-900">
                {b.title}
              </h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{b.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
