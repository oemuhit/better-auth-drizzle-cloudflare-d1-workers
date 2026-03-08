# Drizzle schema ve migration kılavuzu

Bu projede veritabanı şeması **Drizzle ORM** ile yönetiliyor; migration’lar **Cloudflare D1** için SQL dosyaları olarak tutuluyor.

## 1. Şemaya bir şey eklemek

Şema dosyaları `server/db/schema/` altında (örn. `ecommerce-schema.ts`, `index.ts`). Yeni tablo/kolon eklemek için bu TypeScript şema dosyalarını düzenliyorsun; **SQL dosyasını elle yazmıyorsun** — Drizzle Kit bunu senin yerine üretiyor.

Örnek: `order` tablosuna yeni kolon eklemek için ilgili schema dosyasında tabloyu bulup kolonu ekle:

```ts
returnShipmentId: text('return_shipment_id'),
returnBarcode: text('return_barcode'),
returnLabelUrl: text('return_label_url'),
```

## 2. Migration üretmek (SQL dosyalarını Drizzle’ın yazması)

Şemayı değiştirdikten sonra migration SQL’ini **otomatik üretmek** için:

```bash
npm run db:generate
```

Bu komut:

- `drizzle.config.ts` içindeki `schema` yolunu (`./server/db/schema/index.ts`) okur
- Mevcut migration geçmişiyle (drizzle meta/snapshot) karşılaştırır
- Farkları yansıtan yeni bir SQL dosyası oluşturur: `drizzle/XXXX_isim.sql`
- `drizzle/meta/_journal.json` dosyasına bu migration’ı ekler

Yani **`drizzle/` altındaki SQL dosyalarını normalde sen yazmıyorsun**; `db:generate` ile Drizzle Kit yazıyor. İstersen üretilen SQL’i açıp kontrol edebilir veya küçük düzeltmeler yapabilirsin (dikkatli ol, journal ile uyumlu kalsın).

## 3. Migration’ları veritabanına uygulamak

Üretilen migration’lar D1’e iki şekilde uygulanır:

- **Yerel (geliştirme):**
  ```bash
  npm run db:migrate:local
  ```
- **Uzak (production/staging):**
  ```bash
  npm run db:migrate:remote
  ```

Bunlar sırasıyla `wrangler d1 migrations apply nuxtdb --local` ve `--remote` çalıştırır. D1, `drizzle/meta/_journal.json` içindeki sıraya göre henüz uygulanmamış `.sql` dosyalarını çalıştırır.

## Özet akış

1. **Şemayı değiştir** → `server/db/schema/` altındaki ilgili `.ts` dosyalarını düzenle.
2. **Migration üret** → `npm run db:generate` (SQL dosyası + journal güncellemesi otomatik).
3. **Uygula** → `npm run db:migrate:local` veya `npm run db:migrate:remote`.

Bu akışta SQL’i elle yazmak zorunda değilsin; sadece şemayı güncellemek ve `db:generate` çalıştırmak yeterli.

## Elle SQL yazmak (isteğe bağlı)

İstisnai durumlarda migration SQL’ini kendin yazabilirsin. O zaman:

1. `drizzle/` altında `XXXX_açıklayıcı_isim.sql` adında bir dosya oluştur (XXXX = sıradaki numara).
2. `drizzle/meta/_journal.json` içindeki `entries` dizisine, diğer entry’lerle aynı formatta yeni bir entry ekle (örn. `tag: "0014_açıklayıcı_isim"`).
3. Sonra `db:migrate:local` / `db:migrate:remote` ile uygula.

Bunu yaparken journal’daki sıra ve isimlendirme (tag) ile dosya adının birebir uyumlu olması gerekir; aksi halde D1 migration’ları yanlış veya eksik çalıştırabilir.
