import { toast } from "vue-sonner";

export default defineNuxtPlugin((nuxtApp) => {
  const { $fetch } = useNuxtApp();
  
  // We cannot easily overwrite $fetch if it's already bound, but we can try to wrap it
  // or use the 'app:error' hook for general Vue errors.
  // However, catching 403s from useFetch/fetch requires intercepting the fetcher.
  
  // A more robust way in Nuxt 3 is often creating a custom fetch wrapper, 
  // but to apply it globally to existing useFetch calls is tricky without changing nuxt.config.
  
  // Let's try to overwrite globalThis.$fetch on client side.
  const originalFetch = globalThis.$fetch;
  
  globalThis.$fetch = originalFetch.create({
    onResponseError({ response }) {
      if (response.status === 403) {
        const message = response._data?.statusMessage || response._data?.message;
        
        if (message?.includes("Admin access required") || message?.includes("Forbidden")) {
          toast.error("Erişim Reddedildi", {
            description: "Bu işlem için yönetici yetkisi gerekiyor.",
            action: {
              label: "Tamam",
              onClick: () => {}
            }
          });
        }
      }
    }
  });
});
