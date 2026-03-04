## 2025-03-04 - [Debounce Search API Calls]
**Learning:** Found that search inputs mapped directly to `useFetch` query objects (e.g. `filters.value.search`) can trigger un-debounced excessive API calls to `/api/products` when users type.
**Action:** Used `@vueuse/core` `refDebounced` to create a debounced ref with a delay to reduce request frequency. Check if any other input that directly triggers an API call may need it.
