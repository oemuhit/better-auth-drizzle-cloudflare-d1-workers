import { authClient } from "~/lib/auth-client";

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (to.path === "/dashboard") {
    const { data: session } = await authClient.useSession(useFetch);
    if (!session.value) {
      return navigateTo("/");
    }
  }
});
