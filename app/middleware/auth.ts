import { authClient } from "~/lib/auth-client";

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

  // Redirect if not authenticated
  if (!session.value?.data) {
    return navigateTo("/sign-in");
  }
});
