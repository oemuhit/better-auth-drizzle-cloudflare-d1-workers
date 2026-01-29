<script setup lang="ts">
import { Bell, User } from "lucide-vue-next";
import { authClient } from "~/lib/auth-client";

const sessionRef = authClient.useSession();

// Computed for easier access
const session = computed(() => sessionRef.value?.data);
const isPending = computed(() => sessionRef.value?.isPending ?? true);

// Client-side redirect if not authenticated
watchEffect(() => {
  if (import.meta.client && !isPending.value && !session.value) {
    navigateTo("/sign-in");
  }
});
</script>

<template>
  <!-- Loading State -->
  <div
    v-if="isPending"
    class="flex h-screen items-center justify-center bg-background"
  >
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>

  <!-- Admin Layout -->
  <div v-else-if="session" class="flex h-screen bg-background">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header
        class="h-16 border-b bg-card flex items-center justify-between px-6"
      >
        <div>
          <!-- Breadcrumb or page title can go here -->
        </div>

        <div class="flex items-center gap-4">
          <!-- Cart Drawer for quick access -->
          <CartDrawer />

          <!-- Notifications -->
          <Button variant="ghost" size="icon">
            <Bell class="h-5 w-5" />
          </Button>

          <!-- User Menu -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="flex items-center gap-2">
                <Avatar class="h-8 w-8">
                  <AvatarImage
                    v-if="session?.user?.image"
                    :src="session.user.image"
                  />
                  <AvatarFallback>
                    {{ session?.user?.name?.charAt(0).toUpperCase() || "U" }}
                  </AvatarFallback>
                </Avatar>
                <span class="hidden sm:inline">{{
                  session?.user?.name || "Admin"
                }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem as-child>
                <NuxtLink to="/dashboard">Profil</NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem as-child>
                <NuxtLink to="/">Mağazaya Git</NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-destructive">
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
