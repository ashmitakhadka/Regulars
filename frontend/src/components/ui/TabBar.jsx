import { Button } from "./Button";

/**
 * Reusable accessible TabBar / Filter pill component.
 * Uses the exact button style from the Businesses category filters:
 * - variant="primary" when active, variant="secondary" when inactive
 * - rounded-full, min-h-[44px]
 * - clean labels without numbers
 */
export const TabBar = ({
  tabs = [],
  activeTab,
  onChange,
  className = "",
  ariaLabel = "Filter options",
  size = "md",
}) => {
  const isSm = size === "sm";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-center gap-1.5 overflow-x-auto ${
        isSm ? "pb-0" : "pb-1"
      } scrollbar-none ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;

        return (
          <Button
            key={tab.id}
            variant={isSelected ? "primary" : "secondary"}
            size={isSm ? "xs" : "sm"}
            onClick={() => onChange && onChange(tab.id)}
            className={`rounded-full shrink-0 capitalize ${
              isSm
                ? "text-xs px-2.5 py-0.5 min-h-[30px] h-[30px]"
                : "text-xs px-4 py-1.5 min-h-[44px]"
            }`}
            role="tab"
            aria-selected={isSelected}
            id={`tab-${tab.id}`}
            aria-controls={`tabpanel-${tab.id}`}
          >
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
};

export default TabBar;
