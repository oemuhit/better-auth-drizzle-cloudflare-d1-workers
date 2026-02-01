<script setup lang="ts">
import { 
  User, 
  MapPin, 
  Package, 
  LogOut, 
  Heart, 
  Settings, 
  Lock
} from "lucide-vue-next";

import { authClient } from "~/lib/auth-client";

const sessionRef = authClient.useSession();
const user = computed(() => sessionRef.value?.data?.user);

const menuItems = [
  { name: "Kişisel Bilgiler", path: "/account/profile", icon: User },
  { name: "Adreslerim", path: "/account/addresses", icon: MapPin },
  { name: "Siparişlerim", path: "/account/orders", icon: Package },
  { name: "Favorilerim", path: "/account/wishlist", icon: Heart },
  { name: "Ayarlar", path: "/account/settings", icon: Settings },
];

async function handleLogout() {
  await authClient.signOut();
  navigateTo("/auth/login");
}
</script>

<template>
  <div class="space-y-4">
    <!-- User Info Card -->
    <Card class="bg-muted/50 border-none">
      <CardContent class="p-6 flex items-center gap-4">
        <Avatar class="h-12 w-12">
          <AvatarImage :src="user?.image || ''" />
          <AvatarFallback>{{ user?.name?.charAt(0) || 'U' }}</AvatarFallback>
        </Avatar>
        <div class="flex-1 overflow-hidden">
          <p class="font-medium truncate">{{ user?.name }}</p>
          <p class="text-xs text-muted-foreground truncate">{{ user?.email }}</p>
        </div>
      </CardContent>
    </Card>

    <!-- Navigation Menu -->
    <nav class="space-y-1">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
        :class="[
          $route.path === item.path 
            ? 'bg-primary/10 text-primary' 
            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        ]"
      >
        <component :is="item.icon" class="h-4 w-4" />
        {{ item.name }}
      </NuxtLink>

      <button
        @click="handleLogout"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut class="h-4 w-4" />
        Çıkış Yap
      </button>
    </nav>
  </div>
</template>
