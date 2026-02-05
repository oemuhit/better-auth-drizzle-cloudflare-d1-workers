import { authClient } from "~/lib/auth-client";
import { toast } from "vue-sonner";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client-side to avoid SSR issues
  if (import.meta.server) return;

  const session = authClient.useSession();

  // Wait for session to load
  if (session.value?.isPending) {
    await new Promise<void>((resolve) => {
      const unwatch = watch(
        () => session.value?.isPending,
        (isPending) => {
          if (!isPending) {
            unwatch();
            resolve();
          }
        },
        { immediate: true },
      );
    });
  }

  // Check if authenticated
  if (!session.value?.data) {
    return navigateTo("/sign-in");
  }

  // Check for admin role
  if (session.value?.data?.user?.role !== "admin") {
    toast.error("Yetkisiz Erişim", {
      description: "Bu sayfaya erişim yetkiniz bulunmuyor."
    });
    return navigateTo("/");
  }
});
