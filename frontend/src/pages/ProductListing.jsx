import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import ProductCard from "../components/ProductCard";

export default function ProductListing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const page = Number(searchParams.get("page")) || 1;
  const sort = searchParams.get("sort") || "";

  // NEW: read price/rating filters from the URL, same pattern as everything else
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const minRating = searchParams.get("minRating") || "";

  // NEW: local input state for the price boxes.
  // This is SEPARATE from the URL state above — typing here does NOT
  // trigger a re-fetch. It only syncs to the URL (and triggers a fetch)
  // when the user clicks "Apply".
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  const LIMIT = 8;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const params = { page, limit: LIMIT };
        if (search) params.search = search;
        if (category) params.category = category;
        if (sort) params.sort = sort;
        // NEW: forward price/rating filters to the API, same as before
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (minRating) params.minRating = minRating;

        const response = await axiosInstance.get("/products", { params });

        setProducts(response.data.products);
        setTotalPages(response.data.totalPages);
        setTotalProducts(response.data.totalProducts);
      } catch (err) {
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // NEW: also re-run when minPrice/maxPrice/minRating change in the URL
  }, [search, category, page, sort, minPrice, maxPrice, minRating]);

  // Helper: builds the "next" params object carrying forward every filter
  // that should survive the change, minus page (so it resets to 1).
  // This avoids repeating the same 6 lines in every handler below.
  const buildParams = (overrides) => {
    const merged = {
      category,
      search,
      sort,
      minPrice,
      maxPrice,
      minRating,
      ...overrides,
    };

    const next = {};
    Object.entries(merged).forEach(([key, value]) => {
      // Only keep values that are actually meaningful
      if (value !== undefined && value !== null && value !== "") {
        next[key] = String(value);
      }
    });

    return next;
  };

  const handleCategoryClick = (cat) => {
    setSearchParams(buildParams({ category: cat || undefined }));
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSearchParams(buildParams({ sort: newSort || undefined }));
  };

  // NEW: applies the price range typed into the local inputs
  const handleApplyPrice = () => {
    setSearchParams(
      buildParams({
        minPrice: minPriceInput || undefined,
        maxPrice: maxPriceInput || undefined,
      })
    );
  };

  // NEW: rating filter — clicking a star tier applies immediately
  const handleRatingClick = (rating) => {
    // Clicking the already-active rating again clears it (toggle behavior)
    const newRating = minRating === String(rating) ? undefined : rating;
    setSearchParams(buildParams({ minRating: newRating }));
  };

  // NEW: clears price + rating filters, keeps search/category/sort as-is
  const handleClearFilters = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    setSearchParams(
      buildParams({ minPrice: undefined, maxPrice: undefined, minRating: undefined })
    );
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setSearchParams(buildParams({ page: String(newPage) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters = minPrice || maxPrice || minRating;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      {/* CHANGED - Week 10: horizontal scroll instead of wrapping, so
            category chips stay on one line at all screen sizes. "shrink-0"
            on each button stops them from squishing to fit — they keep
            their natural width and the row scrolls instead. "-mx-1 px-1"
            is a small trick so the button's focus/hover ring isn't clipped
            by the scroll container's edge. scrollbar-hide-ish styling via
            a thin native scrollbar is left as-is (no extra library needed). */}
        <div className="flex items-center gap-3 overflow-x-auto -mx-1 px-1 pb-1">
          <span className="text-sm text-gray-500 shrink-0">Filter:</span>
          {["", "Electronics", "Clothing", "Home", "Books"].map((cat) => (
            <button
              key={cat || "all"}
              onClick={() => handleCategoryClick(cat)}
              className={`text-sm px-3 py-1 rounded-full border shrink-0 whitespace-nowrap ${
                category === cat
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
              }`}
            >
              {cat || "All"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-500">
            Sort by:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={handleSortChange}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
          >
            <option value="">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popularity">Popularity</option>
          </select>
        </div>
      </div>

      {/* NEW: Advanced filter panel — price range + rating */}
      <div className="flex flex-wrap items-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Price range */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Price:</span>
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            className="w-20 text-sm border border-gray-300 rounded-md px-2 py-1"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            className="w-20 text-sm border border-gray-300 rounded-md px-2 py-1"
          />
          <button
            onClick={handleApplyPrice}
            className="text-sm px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Apply
          </button>
        </div>

        {/* Rating filter — CHANGED again: switched from wrapping to
            horizontal scroll, matching the category filter above, for
            consistency and to avoid wasting vertical space. */}
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          <span className="text-sm text-gray-500 shrink-0">Rating:</span>
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => handleRatingClick(r)}
              className={`text-sm px-3 py-1 rounded-full border shrink-0 whitespace-nowrap ${
                minRating === String(r)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
              }`}
            >
              {r}★ & up
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-red-500 hover:underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {search && (
        <p className="text-sm text-gray-500 mb-4">
          Showing results for "<span className="font-medium">{search}</span>"
        </p>
      )}

      {loading && <p className="text-gray-500">Loading products...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="text-gray-500">No products found.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="text-sm px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-indigo-400"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="text-sm px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-indigo-400"
          >
            Next
          </button>
        </div>
      )}

      {!loading && !error && totalProducts > 0 && (
        <p className="text-center text-xs text-gray-400 mt-3">
          {totalProducts} product{totalProducts !== 1 ? "s" : ""} total
        </p>
      )}
    </div>
  );
}