<template>
  <div class="min-h-screen flex flex-col">
    <Navbar />
    <main class="flex-1 container mx-auto px-4 py-8 md:py-12">
      <div class="grid lg:grid-cols-4 gap-8">
        <!-- Sidebar -->
        <aside class="lg:col-span-1">
          <AccountSidebar />
        </aside>

        <!-- Main Content -->
        <div class="lg:col-span-3">
          <slot />
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
// Basic layout for account pages
</script>
