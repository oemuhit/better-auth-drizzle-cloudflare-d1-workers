<script setup lang="ts">
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  ChevronLeft,
  Store,
  Palette,
  Receipt,
} from "lucide-vue-next";

const route = useRoute();

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Ürünler",
    icon: Package,
    href: "/admin/products",
  },
  {
    title: "Kategoriler",
    icon: FolderTree,
    href: "/admin/categories",
  },
  {
    title: "Siparişler",
    icon: ShoppingCart,
    href: "/admin/orders",
  },
  {
    title: "Müşteriler",
    icon: Users,
    href: "/admin/customers",
  },
];

const settingsItems = [
  {
    title: "Özellik Şablonları",
    icon: Palette,
    href: "/admin/attribute-templates",
  },
  {
    title: "Vergi Oranları",
    icon: Receipt,
    href: "/admin/tax-rates",
  },
];

const isCollapsed = ref(false);

function isActive(href: string) {
  if (href === "/admin") {
    return route.path === "/admin";
  }
  return route.path.startsWith(href);
}
</script>

<template>
  <aside
    class="flex flex-col border-r bg-card transition-all duration-300"
    :class="[isCollapsed ? 'w-16' : 'w-64']"
  >
    <!-- Header -->
    <div class="flex items-center justify-between h-16 px-4 border-b">
      <NuxtLink
        to="/admin"
        class="flex items-center gap-2 font-semibold"
        :class="[isCollapsed ? 'justify-center' : '']"
      >
        <Store class="h-6 w-6 text-primary" />
        <span v-if="!isCollapsed">Admin Panel</span>
      </NuxtLink>
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="[isCollapsed ? 'hidden' : '']"
        @click="isCollapsed = !isCollapsed"
      >
        <ChevronLeft class="h-4 w-4" />
      </Button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.href"
        :to="item.href"
        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        :class="[
          isActive(item.href)
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          isCollapsed ? 'justify-center' : '',
        ]"
      >
        <component :is="item.icon" class="h-5 w-5 shrink-0" />
        <span v-if="!isCollapsed">{{ item.title }}</span>
      </NuxtLink>

      <!-- Settings Section -->
      <div v-if="!isCollapsed" class="pt-4 mt-4 border-t">
        <p
          class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
        >
          Ayarlar
        </p>
      </div>
      <NuxtLink
        v-for="item in settingsItems"
        :key="item.href"
        :to="item.href"
        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        :class="[
          isActive(item.href)
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          isCollapsed ? 'justify-center' : '',
        ]"
      >
        <component :is="item.icon" class="h-5 w-5 shrink-0" />
        <span v-if="!isCollapsed">{{ item.title }}</span>
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="p-2 border-t">
      <NuxtLink
        to="/"
        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        :class="[isCollapsed ? 'justify-center' : '']"
      >
        <Store class="h-5 w-5 shrink-0" />
        <span v-if="!isCollapsed">Mağazaya Git</span>
      </NuxtLink>
    </div>

    <!-- Collapse Button (when collapsed) -->
    <Button
      v-if="isCollapsed"
      variant="ghost"
      size="icon"
      class="mx-auto mb-2"
      @click="isCollapsed = false"
    >
      <ChevronLeft class="h-4 w-4 rotate-180" />
    </Button>
  </aside>
</template>
