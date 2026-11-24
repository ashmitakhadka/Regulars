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
}) => {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;

        return (
          <Button
            key={tab.id}
            variant={isSelected ? "primary" : "secondary"}
            size="sm"
            onClick={() => onChange && onChange(tab.id)}
            className="rounded-full text-xs shrink-0 capitalize px-4 py-1.5 min-h-[44px]"
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
