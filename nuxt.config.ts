// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],

  runtimeConfig: {
    // iyzico configuration (server-side only)
    iyzicoApiKey: process.env.IYZICO_API_KEY || "",
    iyzicoSecretKey: process.env.IYZICO_SECRET_KEY || "",
    iyzicoSandbox: (process.env.IYZICO_SANDBOX || "true") === "true",
    // Geliver cargo (server-side only)
    geliverToken: process.env.GELIVER_TOKEN || "",
    geliverSenderId: process.env.GELIVER_SENDER_ID || "",
    geliverStoreUrl: process.env.GELIVER_STORE_URL || "https://nuxt.oertugrulmuhit.workers.dev",
    geliverTestMode: (process.env.GELIVER_TEST_MODE || "false") === "true",
    geliverReturnProviderCode: process.env.GELIVER_RETURN_PROVIDER_CODE || "GELIVER_STANDART",
    // Public URL for callbacks
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
  },

  nitro: {
    // Use Node.js for development to support @huggingface/transformers
    // Use Cloudflare for production build
    preset: "cloudflare_module",

    experimental: {},

    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    runtimeConfig: {
      bodySizeLimit: "10mb",
    },
    // Cache storage — Cloudflare KV (remote in both dev and production)
    storage: {
      cache: {
        driver: "cloudflare-kv-binding",
        binding: "CACHE",
      },
    },
  },

  // Route-level caching for static/semi-static endpoints
  routeRules: {
    "/api/locations/**": { cache: { maxAge: 86400 } },  // 24 hours
    "/api/tax-rates": { cache: { maxAge: 3600 } },      // 1 hour
  },

  build: {
    transpile: ["@jsquash/resize", "@jsquash/webp"]
  },

  modules: ["nitro-cloudflare-dev", "shadcn-nuxt", "@nuxt/image", "@nuxt/icon"],

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

  image: {
    providers: {
      r2: {
        name: 'r2',
        provider: '~/providers/r2.ts',
        options: {
          baseURL: '/images'
        }
      }
    },
    provider: 'r2',
    presets: {
      avatar: {
        modifiers: {
          width: 160
        }
      },
      thumbnail: {
        modifiers: {
          width: 256
        }
      },
      medium: {
        modifiers: {
          width: 512
        }
      },
      large: {
        modifiers: {
          width: 1024
        }
      }
    }
  },

  vite: {
    plugins: [tailwindcss()],
  },

});
