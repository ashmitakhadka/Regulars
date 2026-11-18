import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faBox,
  faBoxesStacked,
  faRotateRight,
  faSearch,
  faPen,
  faTrash,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { ProductFormModal } from "../../components/merchant/products/ProductFormModal";
import { DeleteProductModal } from "../../components/merchant/products/DeleteProductModal";
import { Button, EmptyState, ErrorState, Spinner } from "../../components/ui";
import { productService } from "../../services/productService";

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getProducts();
      setProducts(response.data || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load products. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    productService
      .getProducts()
      .then((response) => {
        if (!ignore) {
          setProducts(response.data || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load products:", err);
          setError(
            err.response?.data?.message ||
              "Unable to load products. Please check your connection and try again.",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Filtered Products
  const filteredProducts = products.filter((product) => {
    const matchesStatus =
      statusFilter === "all" || product.status?.toLowerCase() === statusFilter;

    const matchesSearch =
      !searchQuery.trim() ||
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: products.length,
    active: products.filter((p) => p.status === "active").length,
    inactive: products.filter((p) => p.status === "inactive").length,
  };

  // Create or Update Product Handler
  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        const response = await productService.updateProduct(
          editingProduct.id,
          payload,
        );
        toast.success(response.message || "Product updated successfully.");

        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? response.data : p)),
        );
      } else {
        const response = await productService.createProduct(payload);
        toast.success(response.message || "Product created successfully.");

        setProducts((prev) => [response.data, ...prev]);
      }

      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error("Failed to save product:", err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(" ");
        toast.error(errorMessages || "Please correct the highlighted fields.");
      } else {
        toast.error(
          err.response?.data?.message ||
            "Unable to save product. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product Handler
  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);

    try {
      const response = await productService.deleteProduct(deletingProduct.id);
      toast.success(response.message || "Product deleted successfully.");

      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setDeletingProduct(null);
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast.error(
        err.response?.data?.message ||
          "Unable to delete product. It may be linked to a loyalty program.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Merchant Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area */}
      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-[#F4F0EA] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-[#23140C]/60">
                Merchant Portal
              </span>
              <span className="text-[#23140C]/30">•</span>
              <span className="text-[13px] font-semibold text-[#A51D27]">
                Product Catalog
              </span>
            </div>
            <h1 className="mt-1 font-display text-[26px] sm:text-[28px] font-bold tracking-tight text-[#23140C]">
              Products
            </h1>
            <p className="mt-1 text-[13.5px] sm:text-[14px] text-[#23140C]/75">
              Manage items eligible for quantity-based loyalty program stamp rewards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadProducts}
              disabled={loading}
              title="Refresh products"
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                className={loading ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button variant="primary" size="sm" onClick={openCreateModal}>
              <FontAwesomeIcon icon={faPlus} />
              <span>Add Product</span>
            </Button>
          </div>
        </header>

        {/* Search & Filter Bar */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F4F0EA] pb-5">
            {/* Search Input */}
            <div className="relative w-full max-w-sm">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#23140C]/40"
              />
              <input
                type="text"
                placeholder="Search products by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#F4F0EA] bg-white pl-10 pr-4 py-2 text-[14px] text-[#23140C] placeholder:text-[#23140C]/40 transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All Items", count: counts.all },
                { id: "active", label: "Active", count: counts.active },
                { id: "inactive", label: "Inactive", count: counts.inactive },
              ].map((tab) => {
                const isSelected = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold border transition cursor-pointer ${
                      isSelected
                        ? "border-[#A51D27] bg-[#A51D27]/10 text-[#A51D27]"
                        : "border-[#F4F0EA] bg-[#F4F0EA] text-[#23140C] hover:border-[#A51D27]/40"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[11px] font-bold ${
                        isSelected
                          ? "bg-[#A51D27] text-white"
                          : "bg-white text-[#23140C]/80"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Section */}
        <section className="mt-8" aria-label="Merchant products listing">
          {/* 1. Loading State */}
          {loading && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#F4F0EA]/40 p-8">
              <Spinner size="md" />
              <p className="text-[14px] font-medium text-[#23140C]/75">
                Loading your product catalog...
              </p>
            </div>
          )}

          {/* 2. Error State */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
              <ErrorState
                title="Could not load products"
                message={error}
                onRetry={loadProducts}
              />
            </div>
          )}

          {/* 3. Empty State (Zero Products in Catalog) */}
          {!loading && !error && products.length === 0 && (
            <div className="rounded-2xl bg-[#F4F0EA]/40 p-8">
              <EmptyState
                icon={faBoxesStacked}
                title="No products added yet"
                description="Add products to your catalog to use them in quantity-based loyalty programs."
                action={
                  <Button variant="primary" size="md" onClick={openCreateModal}>
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Add Your First Product</span>
                  </Button>
                }
              />
            </div>
          )}

          {/* 4. Empty Filter State */}
          {!loading &&
            !error &&
            products.length > 0 &&
            filteredProducts.length === 0 && (
              <div className="rounded-2xl bg-[#F4F0EA]/30 p-8">
                <EmptyState
                  icon={faBox}
                  title="No matching products found"
                  description="Try adjusting your search query or status filter."
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  }
                />
              </div>
            )}

          {/* 5. Products Grid */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const isActive = product.status === "active";
                return (
                  <article
                    key={product.id}
                    className="group flex flex-col justify-between rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(35,20,12,0.06)] transition-all hover:shadow-[0_6px_20px_rgba(35,20,12,0.1)]"
                  >
                    <div>
                      {/* Top Bar: Icon, Name and Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
                            <FontAwesomeIcon icon={faBox} className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-display text-[17px] font-bold text-[#23140C] leading-snug">
                              {product.name}
                            </h3>
                            <p className="mt-1 flex items-center gap-1.5 text-[15px] font-bold text-[#A51D27]">
                              <FontAwesomeIcon
                                icon={faTag}
                                className="h-3.5 w-3.5 text-[#23140C]/50"
                              />
                              <span>
                                NPR {Number(product.price).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Status Pill */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold capitalize ${
                            isActive
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                              : "bg-neutral-100 text-neutral-800 border-neutral-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-emerald-600" : "bg-neutral-500"
                            }`}
                          />
                          {product.status || "active"}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="mt-4 rounded-xl bg-[#F4F0EA]/60 p-3 text-[13px] text-[#23140C]/75">
                        {product.description ? (
                          <p className="line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        ) : (
                          <p className="italic text-[#23140C]/50">
                            No description provided.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#F4F0EA] pt-3.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-[#23140C]/80 hover:bg-[#F4F0EA] hover:text-[#23140C] transition cursor-pointer"
                        title="Edit product details"
                      >
                        <FontAwesomeIcon icon={faPen} className="text-xs" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingProduct(product)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-red-700 hover:bg-red-50 transition cursor-pointer"
                        title="Delete product"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Add/Edit Modal */}
        <ProductFormModal
          isOpen={isFormOpen}
          product={editingProduct}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation Modal */}
        <DeleteProductModal
          isOpen={Boolean(deletingProduct)}
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      </main>
    </div>
  );
};

export default Products;

