<script setup lang="ts">
import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-vue-next";

const currentYear = new Date().getFullYear();

const footerLinks = {
  company: [
    { label: "Hakkımızda", href: "/about" },
    { label: "Kariyer", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "SSS", href: "/faq" },
  ],
  shop: [
    { label: "Yeni Ürünler", href: "/shop?sort=newest" },
    { label: "İndirimli Ürünler", href: "/shop?sale=true" },
    { label: "Çok Satanlar", href: "/shop?sort=popular" },
    { label: "Tüm Ürünler", href: "/shop" },
  ],
  support: [
    { label: "İletişim", href: "/contact" },
    { label: "Kargo Takip", href: "/tracking" },
    { label: "İade ve Değişim", href: "/returns" },
    { label: "Gizlilik Politikası", href: "/privacy" },
  ],
  account: [
    { label: "Hesabım", href: "/account" },
    { label: "Siparişlerim", href: "/orders" },
    { label: "Favorilerim", href: "/wishlist" },
    { label: "Adreslerim", href: "/addresses" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
];
</script>

<template>
  <footer class="bg-muted/30 border-t">
    <div class="container mx-auto px-4 py-12">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
        <!-- Brand -->
        <div class="col-span-2 md:col-span-1">
          <NuxtLink to="/" class="flex items-center gap-2 mb-4">
            <div
              class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"
            >
              <span class="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span class="font-bold text-xl">Shop</span>
          </NuxtLink>
          <p class="text-sm text-muted-foreground mb-4">
            En kaliteli ürünleri en uygun fiyatlarla sunuyoruz. Müşteri
            memnuniyeti bizim için her şeyden önemli.
          </p>
          <!-- Social Links -->
          <div class="flex gap-3">
            <a
              v-for="social in socialLinks"
              :key="social.label"
              :href="social.href"
              class="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              :aria-label="social.label"
            >
              <component :is="social.icon" class="h-4 w-4" />
            </a>
          </div>
        </div>

        <!-- Company Links -->
        <div>
          <h3 class="font-semibold mb-4">Kurumsal</h3>
          <ul class="space-y-2">
            <li v-for="link in footerLinks.company" :key="link.href">
              <NuxtLink
                :to="link.href"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Shop Links -->
        <div>
          <h3 class="font-semibold mb-4">Mağaza</h3>
          <ul class="space-y-2">
            <li v-for="link in footerLinks.shop" :key="link.href">
              <NuxtLink
                :to="link.href"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Support Links -->
        <div>
          <h3 class="font-semibold mb-4">Destek</h3>
          <ul class="space-y-2">
            <li v-for="link in footerLinks.support" :key="link.href">
              <NuxtLink
                :to="link.href"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Account Links -->
        <div>
          <h3 class="font-semibold mb-4">Hesabım</h3>
          <ul class="space-y-2">
            <li v-for="link in footerLinks.account" :key="link.href">
              <NuxtLink
                :to="link.href"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Newsletter -->
      <div class="mt-12 pt-8 border-t">
        <div
          class="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div>
            <h3 class="font-semibold mb-1">Bültenimize Abone Olun</h3>
            <p class="text-sm text-muted-foreground">
              Yeni ürünler ve indirimlerden haberdar olun.
            </p>
          </div>
          <form class="flex gap-2 w-full md:w-auto" @submit.prevent>
            <Input
              type="email"
              placeholder="E-posta adresiniz"
              class="w-full md:w-64"
            />
            <Button type="submit">
              <Mail class="h-4 w-4 mr-2" />
              Abone Ol
            </Button>
          </form>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div
        class="mt-8 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground"
      >
        <p>&copy; {{ currentYear }} Shop. Tüm hakları saklıdır.</p>
        <div class="flex gap-4">
          <NuxtLink to="/terms" class="hover:text-foreground transition-colors">
            Kullanım Koşulları
          </NuxtLink>
          <NuxtLink
            to="/privacy"
            class="hover:text-foreground transition-colors"
          >
            Gizlilik Politikası
          </NuxtLink>
          <NuxtLink
            to="/cookies"
            class="hover:text-foreground transition-colors"
          >
            Çerez Politikası
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
