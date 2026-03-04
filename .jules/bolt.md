## 2025-03-04 - [Debounce Search API Calls]
**Learning:** Found that search inputs mapped directly to `useFetch` query objects (e.g. `filters.value.search`) can trigger un-debounced excessive API calls to `/api/products` when users type.
**Action:** Used `@vueuse/core` `refDebounced` to create a debounced ref with a delay to reduce request frequency. Check if any other input that directly triggers an API call may need it.

## 2025-03-04 - [Lazy Load Product Images]
**Learning:** Product grids were loading all images eagerly. In an e-commerce context, loading all images on mount hurts initial page load performance and wastes bandwidth.
**Action:** Added `loading="lazy"` to the product image inside the generic `DrinkifyProductCard.vue` component to utilize native browser lazy-loading. Next time, always check if images below the fold or in long lists are being lazy-loaded.
