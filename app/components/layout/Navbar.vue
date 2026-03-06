<script setup lang="ts">
import { Heart, User, Search, Menu, X, ChevronDown, Package, LayoutDashboard, LogOut } from "lucide-vue-next";
import { authClient } from "~/lib/auth-client";

const { itemCount: wishlistCount } = useWishlist();
const sessionRef = authClient.useSession();
const session = computed(() => sessionRef.value?.data);

const mobileMenuOpen = ref(false);
const searchOpen = ref(false);
const searchQuery = ref("");

// Navigation links
const navLinks = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Ürünler", href: "/shop" },
  { label: "Kategoriler", href: "/shop", hasDropdown: true },
  { label: "İletişim", href: "/contact" },
];

// Fetch categories for dropdown
const { data: categoriesData } = await useFetch("/api/categories", {
  query: { parentOnly: true },
});
const categories = computed(() => categoriesData.value?.data || []);

function handleSearch() {
  if (searchQuery.value.trim()) {
    navigateTo(`/shop?search=${encodeURIComponent(searchQuery.value)}`);
    searchOpen.value = false;
    searchQuery.value = "";
  }
}

async function handleLogout() {
  await authClient.signOut();
  navigateTo("/");
}
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="container mx-auto px-4">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <div
            class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"
          >
            <span class="text-primary-foreground font-bold text-lg">S</span>
          </div>
          <span class="font-bold text-xl hidden sm:inline">Shop</span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-6">
          <template v-for="link in navLinks" :key="link.href">
            <div v-if="link.hasDropdown" class="relative group">
              <button
                class="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ link.label }}
                <ChevronDown class="h-4 w-4" />
              </button>
              <!-- Dropdown -->
              <div
                class="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
              >
                <div
                  class="bg-background border rounded-lg shadow-lg py-2 min-w-[200px]"
                >
                  <NuxtLink
                    v-for="cat in categories"
                    :key="cat.id"
                    :to="`/shop/category/${cat.slug}`"
                    class="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {{ cat.title }}
                  </NuxtLink>
                </div>
              </div>
            </div>
            <NuxtLink
              v-else
              :to="link.href"
              class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ link.label }}
            </NuxtLink>
          </template>
        </nav>

        <!-- Right Actions -->
        <div class="flex items-center gap-2">
          <!-- Search -->
          <Button variant="ghost" size="icon" aria-label="Arama yap" @click="searchOpen = !searchOpen">
            <Search class="h-5 w-5" />
          </Button>

          <!-- Wishlist -->
          <NuxtLink to="/account/wishlist">
            <Button variant="ghost" size="icon" aria-label="Favorilerim" class="relative">
              <Heart class="h-5 w-5" />
              <span
                v-if="wishlistCount > 0"
                class="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium"
              >
                {{ wishlistCount > 99 ? "99+" : wishlistCount }}
              </span>
            </Button>
          </NuxtLink>

          <!-- Cart Drawer -->
          <CartDrawer />

          <!-- User Menu -->
          <div v-if="session" class="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Kullanıcı menüsü">
                  <User class="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-48">
                <DropdownMenuLabel>{{
                  session.user?.name || session.user?.email
                }}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NuxtLink to="/account/profile" class="flex items-center gap-2">
                    <User class="h-4 w-4" />
                    <span>Hesabım</span>
                  </NuxtLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NuxtLink to="/account/orders" class="flex items-center gap-2">
                    <Package class="h-4 w-4" />
                    <span>Siparişlerim</span>
                  </NuxtLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NuxtLink to="/admin" class="flex items-center gap-2">
                    <LayoutDashboard class="h-4 w-4" />
                    <span>Admin Panel</span>
                  </NuxtLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  @click="handleLogout"
                  class="text-destructive flex items-center gap-2"
                >
                  <LogOut class="h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <NuxtLink v-else to="/sign-in" class="hidden sm:block">
            <Button variant="ghost" size="sm">Giriş Yap</Button>
          </NuxtLink>

          <!-- Mobile Menu Toggle -->
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menüyü aç/kapat"
            class="md:hidden"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <Menu v-if="!mobileMenuOpen" class="h-5 w-5" />
            <X v-else class="h-5 w-5" />
          </Button>
        </div>
      </div>

      <!-- Search Bar -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="searchOpen" class="py-4 border-t">
          <form @submit.prevent="handleSearch" class="flex gap-2">
            <Input
              v-model="searchQuery"
              placeholder="Ürün ara..."
              class="flex-1"
              autofocus
            />
            <Button type="submit">Ara</Button>
          </form>
        </div>
      </Transition>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div v-if="mobileMenuOpen" class="md:hidden border-t bg-background">
        <nav class="container mx-auto px-4 py-4 space-y-2">
          <NuxtLink
            v-for="link in navLinks.filter((l) => !l.hasDropdown)"
            :key="link.href"
            :to="link.href"
            class="block py-2 text-foreground font-medium"
            @click="mobileMenuOpen = false"
          >
            {{ link.label }}
          </NuxtLink>

          <!-- Categories in mobile -->
          <div class="py-2">
            <p class="text-sm font-medium text-muted-foreground mb-2">
              Kategoriler
            </p>
            <div class="pl-4 space-y-2">
              <NuxtLink
                v-for="cat in categories"
                :key="cat.id"
                :to="`/shop/category/${cat.slug}`"
                class="block py-1 text-sm text-muted-foreground hover:text-foreground"
                @click="mobileMenuOpen = false"
              >
                {{ cat.title }}
              </NuxtLink>
            </div>
          </div>

          <Separator />

          <div v-if="session" class="pt-2 space-y-2">
            <NuxtLink
              to="/account/profile"
              class="flex items-center gap-2 py-2 text-foreground"
              @click="mobileMenuOpen = false"
            >
              <User class="h-5 w-5" />
              <span>Hesabım</span>
            </NuxtLink>
            <NuxtLink
              to="/account/orders"
              class="flex items-center gap-2 py-2 text-foreground"
              @click="mobileMenuOpen = false"
            >
              <Package class="h-5 w-5" />
              <span>Siparişlerim</span>
            </NuxtLink>
            <NuxtLink
              to="/admin"
              class="flex items-center gap-2 py-2 text-foreground"
              @click="mobileMenuOpen = false"
            >
              <LayoutDashboard class="h-5 w-5" />
              <span>Admin Panel</span>
            </NuxtLink>
            <button
              @click="handleLogout"
              class="flex items-center gap-2 py-2 text-destructive w-full text-left font-medium"
            >
              <LogOut class="h-5 w-5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
          <NuxtLink
            v-else
            to="/sign-in"
            class="block py-2 text-foreground"
            @click="mobileMenuOpen = false"
          >
            Giriş Yap
          </NuxtLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>
