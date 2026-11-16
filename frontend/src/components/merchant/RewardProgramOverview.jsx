import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGift, faArrowRight } from "@fortawesome/free-solid-svg-icons";

export const RewardProgramOverview = () => {
  return (
    <section className="mt-10 rounded-2xl bg-white p-7 shadow-[0_4px_24px_rgba(35,20,12,0.06)]">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
              <FontAwesomeIcon icon={faGift} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#23140C]">
                Reward Program
              </h2>
              <p className="mt-1 text-sm text-[#23140C]/50">
                Your current loyalty offer
              </p>
            </div>
          </div>

          <h3 className="mt-7 text-xl font-bold text-[#23140C]">
            Buy 5 coffees, get 1 free
          </h3>
          <p className="mt-2 text-sm text-[#23140C]/55">
            Customers earn one stamp for each eligible visit.
          </p>
        </div>

        <div className="sm:text-right">
          <span className="inline-flex rounded-full bg-[#F4F0EA] px-4 py-2 text-xs font-semibold text-[#23140C]">
            Active
          </span>
          <p className="mt-4 text-sm text-[#23140C]/50">Stamps required</p>
          <p className="mt-1 text-3xl font-bold text-[#A51D27]">
            5{" "}
            <span className="text-base font-medium text-[#23140C]/50">
              stamps
            </span>
          </p>
        </div>
      </div>

      <div className="mt-7 border-t border-[#F4F0EA] pt-5">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-semibold text-[#A51D27] transition hover:gap-3"
        >
          Manage reward program
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </section>
  );
};
