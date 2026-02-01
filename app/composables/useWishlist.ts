interface WishlistProduct {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  status: string;
  images?: { url: string; alt: string | null }[];
}

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: Date;
  product: WishlistProduct;
}

// Shared state across components
const wishlistProductIds = ref<string[]>([]);
const wishlistItems = ref<WishlistItem[]>([]);
const isLoading = ref(false);
const isInitialized = ref(false);

export function useWishlist() {
  // Fetch wishlist product IDs (for quick checking)
  async function fetchWishlistIds() {
    if (!import.meta.client) return;

    try {
      const response = await $fetch<{ data: string[] }>("/api/wishlist/check");
      wishlistProductIds.value = response.data || [];
    } catch (e) {
      // User might not be logged in
      wishlistProductIds.value = [];
    }
  }

  // Fetch full wishlist
  async function fetchWishlist() {
    if (!import.meta.client) return;

    isLoading.value = true;
    try {
      const response = await $fetch<{ data: WishlistItem[] }>("/api/wishlist");
      wishlistItems.value = response.data || [];
      wishlistProductIds.value = wishlistItems.value.map(
        (item) => item.productId,
      );
    } catch (e) {
      wishlistItems.value = [];
      wishlistProductIds.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // Check if product is in wishlist
  function isInWishlist(productId: string): boolean {
    return wishlistProductIds.value.includes(productId);
  }

  // Add to wishlist
  async function addToWishlist(productId: string) {
    if (isInWishlist(productId)) return;

    // Optimistic update
    wishlistProductIds.value.push(productId);

    try {
      await $fetch("/api/wishlist", {
        method: "POST",
        body: { productId },
      });
    } catch (e: any) {
      // Revert on error
      wishlistProductIds.value = wishlistProductIds.value.filter(
        (id) => id !== productId,
      );

      if (e.statusCode === 401) {
        // Redirect to login if not authenticated
        navigateTo("/sign-in");
      }
      throw e;
    }
  }

  // Remove from wishlist
  async function removeFromWishlist(productId: string) {
    // Optimistic update
    const previousIds = [...wishlistProductIds.value];
    wishlistProductIds.value = wishlistProductIds.value.filter(
      (id) => id !== productId,
    );
    wishlistItems.value = wishlistItems.value.filter(
      (item) => item.productId !== productId,
    );

    try {
      await $fetch(`/api/wishlist/${productId}`, {
        method: "DELETE",
      });
    } catch (e: any) {
      // Revert on error
      wishlistProductIds.value = previousIds;
      if (e.statusCode === 401) {
        navigateTo("/sign-in");
      }
      throw e;
    }
  }

  // Toggle wishlist
  async function toggleWishlist(product: { id: string }) {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  }

  // Clear wishlist (remove all items)
  async function clearWishlist() {
    const previousItems = [...wishlistItems.value];
    const previousIds = [...wishlistProductIds.value];

    // Optimistic update
    wishlistItems.value = [];
    wishlistProductIds.value = [];

    try {
      // Remove each item
      for (const id of previousIds) {
        await $fetch(`/api/wishlist/${id}`, { method: "DELETE" });
      }
    } catch (e) {
      // Revert on error
      wishlistItems.value = previousItems;
      wishlistProductIds.value = previousIds;
      throw e;
    }
  }

  // Format price
  function formatPrice(price: number) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  }

  // Computed
  const items = computed(() => wishlistItems.value);
  const itemCount = computed(() => wishlistProductIds.value.length);
  const isEmpty = computed(() => wishlistProductIds.value.length === 0);

  // Initialize on client
  async function init() {
    if (isInitialized.value || !import.meta.client) return;
    isInitialized.value = true;
    await fetchWishlistIds();
  }

  // Auto-init
  if (import.meta.client) {
    init();
  }

  return {
    items,
    itemCount,
    isEmpty,
    isLoading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    fetchWishlist,
    fetchWishlistIds,
    formatPrice,
  };
}
