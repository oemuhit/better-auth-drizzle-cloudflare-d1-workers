// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],

  nitro: {
    preset: "cloudflare_module",

    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  modules: ["nitro-cloudflare-dev", "shadcn-nuxt"],

  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: "./components/ui",
  },

  components: [
    {
      path: "~/components/ui",
      pathPrefix: false,
      extensions: [".vue"],
    },
    { path: "~/components", pathPrefix: false },
    { path: "~/components/block", pathPrefix: false },
    { path: "~/components/shared", pathPrefix: false },
    { path: "~/components/base", pathPrefix: false },
    { path: "~/components/forms", pathPrefix: false },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
