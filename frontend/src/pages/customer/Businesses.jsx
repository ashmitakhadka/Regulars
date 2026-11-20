import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faMagnifyingGlass, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { businessService } from "../../services/customer/businessService";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { BusinessCard } from "../../components/customer/BusinessCard";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "cafe", label: "Cafe" },
  { id: "restaurant", label: "Restaurant" },
  { id: "salon", label: "Salon" },
  { id: "gym", label: "Gym" },
  { id: "retail", label: "Retail" },
  { id: "bakery", label: "Bakery" },
];

export const Businesses = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const querySearch = searchParams.get("search") || "";
  const queryCategory = searchParams.get("category") || "all";
  const queryPage = parseInt(searchParams.get("page") || "1", 10);

  // Local state for immediate typing responsiveness
  const [searchInput, setSearchInput] = useState(querySearch);
  const [businesses, setBusinesses] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Request counter & abort controller to ignore outdated in-flight responses
  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Keep search input in sync if URL changes (e.g. browser Back/Forward)
  useEffect(() => {
    setSearchInput(querySearch);
  }, [querySearch]);

  // Debounce search input and update URL (resets page to 1)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== querySearch) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (searchInput.trim()) {
              next.set("search", searchInput.trim());
            } else {
              next.delete("search");
            }
            next.set("page", "1"); // Reset to page 1 on search change
            return next;
          },
          { replace: true }
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, querySearch, setSearchParams]);

  // Fetch businesses whenever querySearch, queryCategory, or queryPage changes
  const fetchBusinesses = useCallback(async () => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentReqId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);

    const params = {
      page: queryPage,
      per_page: 12,
    };
    if (querySearch.trim()) {
      params.search = querySearch.trim();
    }
    if (queryCategory && queryCategory !== "all") {
      params.category = queryCategory;
    }

    try {
      const response = await businessService.getBusinesses(params, controller.signal);

      // Only update state if this is the newest request
      if (currentReqId === activeRequestIdRef.current) {
        setBusinesses(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
        setLoading(false);
      }
    } catch (err) {
      // Ignore canceled request errors
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return;
      }

      if (currentReqId === activeRequestIdRef.current) {
        setError(err.response?.data?.message || "Failed to load businesses. Please try again.");
        setLoading(false);
      }
    }
  }, [querySearch, queryCategory, queryPage]);

  useEffect(() => {
    fetchBusinesses();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchBusinesses]);

  // Handle category selection (resets to page 1)
  const handleCategoryChange = (categoryId) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (categoryId && categoryId !== "all") {
          next.set("category", categoryId);
        } else {
          next.delete("category");
        }
        next.set("page", "1"); // Reset to page 1 on category change
        return next;
      },
      { replace: true }
    );
  };

  // Handle pagination navigation
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(newPage));
        return next;
      },
      { replace: true }
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput("");
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = Boolean(querySearch || (queryCategory && queryCategory !== "all"));

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="font-display text-2xl sm:text-[28px] font-bold text-brand-900">
          Discover Local Spots
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Explore shops in Nepal with Regulars digital loyalty programs and rewards.
        </p>
      </div>

      {/* Search Bar FIRST, then Category Options */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Input FIRST */}
        <div className="flex items-center gap-2 w-full md:w-72 lg:w-80 shrink-0">
          <div className="flex-1">
            <Input
              id="business-search"
              type="search"
              placeholder="Search by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search businesses"
              className="py-2 text-sm"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="shrink-0 text-xs px-2.5 min-h-[44px]"
              title="Reset search and filters"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="text-xs" />
            </Button>
          )}
        </div>

        {/* Category Options SECOND */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-1"
          role="tablist"
          aria-label="Category filter"
        >
          {CATEGORIES.map((cat) => {
            const isActive = queryCategory === cat.id;
            return (
              <Button
                key={cat.id}
                variant={isActive ? "primary" : "secondary"}
                size="sm"
                onClick={() => handleCategoryChange(cat.id)}
                className="rounded-full text-xs shrink-0 capitalize px-3.5 py-1.5 min-h-[44px]"
                role="tab"
                aria-selected={isActive}
              >
                {cat.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center py-16">
          <Spinner size="lg" className="text-brand-800" />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load businesses"
          message={error}
          onRetry={fetchBusinesses}
        />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={faStore}
          title="No businesses found"
          description={
            hasActiveFilters
              ? "We couldn't find any businesses matching your search or category."
              : "There are currently no active loyalty programs available."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Grid of Business Cards: matching Wallet page card layout (grid gap-4 sm:grid-cols-2) */}
          <div className="grid gap-4 sm:grid-cols-2">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-blush-200 pt-5 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
              >
                &larr; Previous
              </Button>

              <span className="text-xs sm:text-sm font-semibold text-ink-soft">
                Page {pagination.current_page} of {pagination.last_page}
                {pagination.total > 0 && (
                  <span className="hidden sm:inline text-ink-soft/70 ml-1">
                    ({pagination.total} spots)
                  </span>
                )}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.last_page}
              >
                Next &rarr;
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Businesses;
