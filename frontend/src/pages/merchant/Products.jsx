import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faBox,
  faBoxesStacked,
  faSearch,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { ProductFormModal } from "../../components/merchant/products/ProductFormModal";
import { DeleteProductModal } from "../../components/merchant/products/DeleteProductModal";
import { Button, EmptyState, ErrorState, Spinner } from "../../components/ui";
import { productService } from "../../services/productService";

const formatPrice = (price) =>
  `NPR ${Number(price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await productService.getProducts();
      setProducts(response.data || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load products. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    productService
      .getProducts()
      .then((res) => {
        if (!ignore) {
          setProducts(res.data || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load products:", err);
          setError(
            err.response?.data?.message ||
              "Unable to load products. Please try again.",
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

  // Product counts
  const counts = {
    all: products.length,
    active: products.filter((p) => p.status === "active").length,
    inactive: products.filter((p) => p.status === "inactive").length,
  };

  // Search and filter
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Open product form
  const openCreateModal = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  // Create or update product
  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      if (editingProduct) {
        const response = await productService.updateProduct(
          editingProduct.id,
          payload,
        );

        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? response.data : p)),
        );

        toast.success(response.message || "Product updated successfully.");
      } else {
        const response = await productService.createProduct(payload);

        setProducts((prev) => [response.data, ...prev]);

        toast.success(response.message || "Product created successfully.");
      }

      closeFormModal();
    } catch (err) {
      console.error("Failed to save product:", err);

      if (err.response?.status === 422 && err.response?.data?.errors) {
        const messages = Object.values(err.response.data.errors)
          .flat()
          .join(" ");

        toast.error(messages || "Please check your input.");
      } else {
        toast.error(err.response?.data?.message || "Unable to save product.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);

    try {
      const response = await productService.deleteProduct(deletingProduct.id);

      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));

      toast.success(response.message || "Product deleted successfully.");
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

  const filters = [
    { id: "all", label: "All", count: counts.all },
    { id: "active", label: "Active", count: counts.active },
    { id: "inactive", label: "Inactive", count: counts.inactive },
  ];

  return (
    <div className="flex min-h-screen bg-white md:flex-row">
      <MerchantSidebar />

      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#23140C] sm:text-3xl">
                Products
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={openCreateModal}>
                <FontAwesomeIcon icon={faPlus} />
                Add Product
              </Button>
            </div>
          </header>

          {/* Search and Filters */}
          {!loading && !error && products.length > 0 && (
            <div className="mt-8 flex flex-col gap-4 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#23140C]/40"
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-white py-2.5 pl-10 pr-4 text-sm text-[#23140C] placeholder:text-[#23140C]/40 shadow-sm outline-none ring-1 ring-[#23140C]/5 transition focus:shadow-md focus:ring-2 focus:ring-[#A51D27]/30"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => {
                  const selected = statusFilter === filter.id;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setStatusFilter(filter.id)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold border transition cursor-pointer ${
                        selected
                          ? "border-[#A51D27] bg-[#A51D27]/10 text-[#A51D27]"
                          : "border-[#F4F0EA] bg-[#F4F0EA] text-[#23140C] hover:border-[#A51D27]/40"
                      }`}
                    >
                      <span>{filter.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.2 text-[11px] font-bold ${
                          selected
                            ? "bg-[#A51D27] text-white"
                            : "bg-white text-[#23140C]/80"
                        }`}
                      >
                        {filter.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product Content */}
          <section className="mt-7" aria-label="Products">
            {loading && (
              <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
                <Spinner size="md" />
                <p className="text-sm text-[#23140C]/60">Loading products...</p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl bg-red-50/50 p-6">
                <ErrorState
                  title="Unable to load products"
                  message={error}
                  onRetry={loadProducts}
                />
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="rounded-xl bg-[#F4F0EA]/40 p-8">
                <EmptyState
                  icon={faBoxesStacked}
                  title="No products yet"
                  description="Add products to use them in your quantity-based loyalty programs."
                  action={
                    <Button
                      variant="primary"
                      size="md"
                      onClick={openCreateModal}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      Add Your First Product
                    </Button>
                  }
                />
              </div>
            )}

            {!loading &&
              !error &&
              products.length > 0 &&
              filteredProducts.length === 0 && (
                <div className="rounded-xl bg-[#F4F0EA]/30 p-8">
                  <EmptyState
                    icon={faBox}
                    title="No matching products"
                    description="Try another search or change the selected filter."
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

            {!loading && !error && filteredProducts.length > 0 && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-[#23140C]/60">
                    {filteredProducts.length}{" "}
                    {filteredProducts.length === 1 ? "product" : "products"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => {
                    const isActive = product.status === "active";

                    return (
                      <article
                        key={product.id}
                        className="flex flex-col rounded-xl bg-white p-5 shadow-[0_2px_12px_rgba(35,20,12,0.06)] transition hover:shadow-[0_4px_18px_rgba(35,20,12,0.10)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold text-[#23140C]">
                                {product.name}
                              </h3>

                              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#A51D27]">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-[#F4F0EA] text-[#23140C]/60"
                            }`}
                          >
                            {product.status || "active"}
                          </span>
                        </div>

                        <p className="mt-2 min-h-10 text-sm leading-relaxed text-[#23140C]/60 line-clamp-2">
                          {product.description || "No description provided."}
                        </p>

                        <div className="mt-1 flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#23140C]/70 transition hover:bg-[#F4F0EA] hover:text-[#23140C]"
                          >
                            <FontAwesomeIcon icon={faPen} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingProduct(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            Delete
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Add / Edit Product */}
        <ProductFormModal
          isOpen={isFormOpen}
          product={editingProduct}
          onClose={closeFormModal}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation */}
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
