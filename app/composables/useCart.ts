import type { Product, ProductVariant } from "~~/server/db/schema";

export interface CartItem {
  id: string;
  productId: string;
  productVariantId: string | null;
  quantity: number;
  price: number;
  compareAtPrice: number | null;
  itemTotal: number;
  product: Product & { images?: Array<{ url: string; alt: string | null }> };
  productVariant: ProductVariant | null;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export function useCart() {
  const cart = useState<Cart | null>("cart", () => null);
  const isLoading = useState<boolean>("cart-loading", () => false);
  const error = useState<string | null>("cart-error", () => null);

  // Fetch cart from server
  async function fetchCart() {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch<{ success: boolean; data: Cart }>(
        "/api/cart",
      );
      if (response.success) {
        cart.value = response.data;
      }
    } catch (err: any) {
      // If unauthorized, cart is empty (guest user)
      if (err.statusCode === 401) {
        cart.value = null;
      } else {
        error.value = err.message || "Failed to fetch cart";
      }
    } finally {
      isLoading.value = false;
    }
  }

  // Add item to cart
  async function addToCart(
    productId: string,
    productVariantId?: string,
    quantity: number = 1,
  ) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch<{
        success: boolean;
        message: string;
        data: { itemCount: number };
      }>("/api/cart/add", {
        method: "POST",
        body: {
          productId,
          productVariantId,
          quantity,
        },
      });

      if (response.success) {
        // Refresh full cart data
        await fetchCart();
        return true;
      }
      return false;
    } catch (err: any) {
      error.value =
        err.data?.statusMessage || err.message || "Failed to add to cart";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Update item quantity
  async function updateQuantity(cartItemId: string, quantity: number) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch<{
        success: boolean;
        data: { subtotal: number; itemCount: number };
      }>("/api/cart/update", {
        method: "PATCH",
        body: {
          cartItemId,
          quantity,
        },
      });

      if (response.success) {
        await fetchCart();
        return true;
      }
      return false;
    } catch (err: any) {
      error.value =
        err.data?.statusMessage || err.message || "Failed to update cart";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Remove item from cart
  async function removeItem(cartItemId: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch<{
        success: boolean;
        data: { subtotal: number; itemCount: number };
      }>(`/api/cart/remove?cartItemId=${cartItemId}`, {
        method: "DELETE",
      });

      if (response.success) {
        await fetchCart();
        return true;
      }
      return false;
    } catch (err: any) {
      error.value =
        err.data?.statusMessage || err.message || "Failed to remove item";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Clear cart
  async function clearCart() {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch<{ success: boolean }>("/api/cart/clear", {
        method: "DELETE",
      });

      if (response.success) {
        cart.value = cart.value
          ? { ...cart.value, items: [], subtotal: 0, itemCount: 0 }
          : null;
        return true;
      }
      return false;
    } catch (err: any) {
      error.value =
        err.data?.statusMessage || err.message || "Failed to clear cart";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Computed values
  const itemCount = computed(() => cart.value?.itemCount || 0);
  const subtotal = computed(() => cart.value?.subtotal || 0);
  const items = computed(() => cart.value?.items || []);
  const isEmpty = computed(() => itemCount.value === 0);

  // Format price helper
  function formatPrice(price: number) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  }

  return {
    // State
    cart,
    isLoading,
    error,

    // Computed
    itemCount,
    subtotal,
    items,
    isEmpty,

    // Actions
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,

    // Helpers
    formatPrice,
  };
}
