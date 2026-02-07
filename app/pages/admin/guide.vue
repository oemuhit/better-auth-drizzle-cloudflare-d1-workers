<script setup lang="ts">
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  LifeBuoy,
  Palette,
  Receipt,
  BookOpen,
  CheckCircle2,
  Info,
} from "lucide-vue-next";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

useHead({
  title: "Panel Kılavuzu | Admin",
});
</script>

<template>
  <div class="space-y-8 max-w-4xl">
    <div>
      <h1 class="text-3xl font-bold flex items-center gap-2">
        <BookOpen class="h-8 w-8 text-primary" />
        Admin Panel Kılavuzu
      </h1>
      <p class="text-muted-foreground mt-2">
        Bu sayfa panelin yeteneklerini ve kullanım senaryolarını özetler. Site sahibi olarak neleri yapabileceğinizi buradan takip edebilirsiniz.
      </p>
    </div>

    <!-- Genel Bakış -->
    <section class="rounded-xl border bg-card p-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <LayoutDashboard class="h-5 w-5" />
        Genel Bakış
      </h2>
      <p class="text-muted-foreground">
        Admin panel üzerinden ürünler, kategoriler, siparişler, müşteriler ve destek talepleri yönetilir. Vergi oranları ve ürün özellik şablonları (beden, renk vb.) ayarlardan yapılandırılır.
      </p>
    </section>

    <!-- Ürünler -->
    <section class="rounded-xl border bg-card p-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Package class="h-5 w-5" />
        Ürünler
      </h2>
      <ul class="space-y-3 text-muted-foreground">
        <li class="flex items-start gap-2">
          <CheckCircle2 class="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          <span><strong class="text-foreground">Yeni ürün ekleme / düzenleme:</strong> Başlık, slug, açıklama, kategori, vergi oranı, fiyat ve varyantlar tanımlanır.</span>
        </li>
        <li class="flex items-start gap-2">
          <CheckCircle2 class="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          <span><strong class="text-foreground">Ürün durumu (status):</strong> Mağazada görünürlük ve sepete eklenebilirlik buna göre belirlenir.</span>
        </li>
      </ul>
      <div class="mt-4 p-4 rounded-lg bg-muted/50 space-y-2">
        <p class="font-medium text-foreground">Ürün durumları ve anlamları</p>
        <dl class="grid gap-2 text-sm">
          <div class="flex gap-2">
            <dt class="font-medium text-foreground w-32">Aktif</dt>
            <dd class="text-muted-foreground">Listede görünür, sepete eklenebilir.</dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-foreground w-32">Ön sipariş</dt>
            <dd class="text-muted-foreground">Listede görünür, "Ön sipariş" etiketi ile sepete eklenebilir.</dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-foreground w-32">Stokta yok</dt>
            <dd class="text-muted-foreground">Listede görünür, sepete eklenemez.</dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-foreground w-32">Gizli</dt>
            <dd class="text-muted-foreground">Listede görünmez; sadece doğrudan linkle açılabilir, sepete eklenebilir (özel kampanya / erken erişim linki için uygun).</dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-foreground w-32">Taslak / Pasif</dt>
            <dd class="text-muted-foreground">Mağazada hiç görünmez, sepete eklenemez.</dd>
          </div>
        </dl>
      </div>
      <ul class="mt-4 space-y-3 text-muted-foreground">
        <li class="flex items-start gap-2">
          <CheckCircle2 class="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          <span><strong class="text-foreground">Varyantlar:</strong> Her varyant için fiyat, stok, SKU ve <strong>Aktif</strong> kutusu vardır. Aktif olmayan varyant mağazada seçilemez ve sepete eklenemez.</span>
        </li>
        <li class="flex items-start gap-2">
          <CheckCircle2 class="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          <span><strong class="text-foreground">Özellik şablonları:</strong> Renk, beden vb. alanlar "Özellik Şablonları" sayfasından yönetilir; ürün formunda bu şablonlara göre varyant özellikleri seçilir.</span>
        </li>
      </ul>
    </section>

    <!-- Kategoriler -->
    <section class="rounded-xl border bg-card p-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <FolderTree class="h-5 w-5" />
        Kategoriler
      </h2>
      <p class="text-muted-foreground mb-3">
        Ürünleri gruplamak için kategoriler kullanılır. Alt kategori (parent) atanabilir; mağaza tarafında kategori sayfaları ve filtreleme buna göre çalışır.
      </p>
      <ul class="space-y-2 text-muted-foreground">
        <li class="flex items-start gap-2">
          <CheckCircle2 class="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          Kategori ekleme, düzenleme, sıralama (sort).
        </li>
        <li class="flex items-start gap-2">
          <CheckCircle2 class="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          Aktif olmayan kategoriler mağaza listesinde gösterilmez (isterseniz API ile tümünü alabilirsiniz).
        </li>
      </ul>
    </section>

    <!-- Siparişler -->
    <section class="rounded-xl border bg-card p-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <ShoppingCart class="h-5 w-5" />
        Siparişler
      </h2>
      <p class="text-muted-foreground mb-3">
        Müşteri siparişleri listelenir; sipariş detayında adres, ödeme durumu, sipariş kalemleri ve toplamlar görüntülenir.
      </p>
      <ul class="space-y-2 text-muted-foreground">
        <li class="flex items-start gap-2">
          <CheckCircle2 class="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          Sipariş listesi ve filtreleme.
        </li>
        <li class="flex items-start gap-2">
          <CheckCircle2 class="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          Sipariş detayında durum ve notlar takip edilebilir.
        </li>
      </ul>
    </section>

    <!-- Müşteriler -->
    <section class="rounded-xl border bg-card p-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users class="h-5 w-5" />
        Müşteriler
      </h2>
      <p class="text-muted-foreground">
        Kayıtlı kullanıcılar (müşteriler) listelenir; detay sayfasında iletişim bilgileri ve sipariş geçmişi görüntülenebilir.
      </p>
    </section>

    <!-- Destek Talepleri -->
    <section class="rounded-xl border bg-card p-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <LifeBuoy class="h-5 w-5" />
        Destek Talepleri
      </h2>
      <p class="text-muted-foreground">
        Müşterilerden gelen destek talepleri buradan yönetilir. Taleplere yanıt verilebilir ve durum güncellenebilir.
      </p>
    </section>

    <!-- Ayarlar -->
    <section class="rounded-xl border bg-card p-6">
      <h2 class="text-xl font-semibold mb-4">Ayarlar</h2>
      <div class="space-y-4">
        <div>
          <h3 class="font-medium flex items-center gap-2 mb-2">
            <Palette class="h-4 w-4" />
            Özellik Şablonları
          </h3>
          <p class="text-muted-foreground text-sm">
            Ürün varyantlarında kullanılan özellikleri tanımlar (örn. Renk, Beden, Depolama). Her şablon için seçenekler (ve renk kodu gibi ek alanlar) eklenebilir. Ürün formunda sadece aktif şablonlar listelenir.
          </p>
        </div>
        <div>
          <h3 class="font-medium flex items-center gap-2 mb-2">
            <Receipt class="h-4 w-4" />
            Vergi Oranları
          </h3>
          <p class="text-muted-foreground text-sm">
            KDV vb. vergi oranları buradan eklenir ve düzenlenir. Ürün oluştururken/düzenlerken her ürüne bir vergi oranı atanabilir. Fiyatlar KDV dahil girilir; vergi fatura/raporlama için kullanılır.
          </p>
        </div>
      </div>
    </section>

    <!-- Özet kullanım senaryoları -->
    <section class="rounded-xl border bg-card p-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Info class="h-5 w-5" />
        Kısa kullanım senaryoları
      </h2>
      <ul class="space-y-2 text-muted-foreground text-sm">
        <li>• Yeni ürün eklemek: <strong class="text-foreground">Ürünler → Yeni ürün</strong>; kategori ve vergi oranı seçin, varyantları ve durumu belirleyin.</li>
        <li>• Geçici stok biten ürün: Ürün durumunu <strong class="text-foreground">Stokta yok</strong> yapın; liste görünür ama sepete eklenemez.</li>
        <li>• Henüz stokta olmayan ürünü ön siparişe açmak: Durumu <strong class="text-foreground">Ön sipariş</strong> yapın; müşteri sepete ekleyebilir.</li>
        <li>• Link ile paylaşılacak ama listede görünmeyecek ürün: Durumu <strong class="text-foreground">Gizli</strong> yapın; sayfa sadece linkle açılır, sepete eklenebilir (kampanya / erken erişim için ideal).</li>
        <li>• Belirli varyantı satıştan kaldırmak: Ürünü düzenleyin, ilgili varyantın <strong class="text-foreground">Aktif</strong> kutusunu kaldırın.</li>
      </ul>
    </section>
  </div>
</template>
