import { Link } from "react-router-dom";
import heroImage from "../assets/hero-cafe.jpg";

export const Hero = () => {
  return (
    <section className="relative isolate overflow-hidden bg-[#F4F0EA]">
      {/* Background photo, shown in its natural colours */}
      <img
        src={heroImage}
        alt="People enjoying a modern loyalty experience"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[center_25%]"
      />
      {/* Neutral dark gradient: only enough on the left to keep text readable */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-black/35 via-black/15 to-transparent"
      />

      <div className="mx-auto flex min-h-[34rem] max-w-6xl items-center px-5 py-20 lg:min-h-[40rem]">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            The punch card your customers can’t lose
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-white/90">
            Regulars gives your business a digital loyalty program. Customers
            scan a QR code, collect stamps and claim rewards from their phone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/merchant/register"
              className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3.5 text-base font-bold text-brand-900 transition hover:bg-blush-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Register your business
            </Link>
            <Link
              to="/merchant/login"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white/80 px-7 py-3.5 text-base font-bold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Log in
            </Link>
          </div>
          <p className="mt-5 text-base text-white/80">
            Customers only need their phone camera.
          </p>
        </div>
      </div>
    </section>
  );
};
