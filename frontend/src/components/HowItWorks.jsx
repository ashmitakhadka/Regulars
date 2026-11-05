import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode, faStar, faGift } from "@fortawesome/free-solid-svg-icons";

const steps = [
  {
    icon: faQrcode,
    title: "Scan the QR code",
    text: "Customers point their phone camera at the code at your counter. There is nothing to install.",
  },
  {
    icon: faStar,
    title: "Collect stamps",
    text: "Each visit or purchase adds stamps to the right loyalty programs, and daily streaks keep people coming back.",
  },
  {
    icon: faGift,
    title: "Claim the reward",
    text: "A completed card becomes a voucher valid for 30 days. You enter its code once to redeem it.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="font-display text-3xl font-extrabold text-brand-900 sm:text-4xl">
          How it works
        </h2>
        <p className="mt-3 max-w-xl text-ink-soft">
          Three steps from a first visit to a free reward.
        </p>

        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush-100 text-brand-800">
                  <FontAwesomeIcon icon={s.icon} />
                </span>
                <span className="text-sm font-bold text-brand-700">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-extrabold text-brand-900">
                {s.title}
              </h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
