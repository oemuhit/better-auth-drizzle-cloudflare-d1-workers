# Session ve Stateless Deployment (Cloudflare Workers + D1)

## Cookie cache (Better Auth)

Session doğrulamasını her istekte D1’e yapmak yerine **kısa ömürlü imzalı cookie** kullanıyoruz:

- **İlk** `getSession()` → D1’de session kontrolü yapılır, geçerliyse session bilgisi imzalı bir cookie’ye yazılır.
- **Sonraki istekler** (cookie’nin `maxAge` süresi içinde) → Session cookie’den doğrulanır, **D1’e gidilmez**.

Bu sayede aynı sayfa yükünde (ürün + ilgili ürünler + wishlist vb.) 3–4 D1 session sorgusu yerine sadece **ilk istek** D1’e gider; 1–2 saniye içindeki diğer istekler cookie’den cevaplanır.

### Yapılandırma

`server/utils/auth.ts` içinde:

```ts
session: {
  cookieCache: {
    enabled: true,
    maxAge: 2 * 60, // saniye (örn. 2 dakika)
    strategy: "compact", // "jwt" veya "jwe" de seçilebilir
  },
},
```

- **compact**: En küçük boyut, HMAC ile imzalı (varsayılan tercih).
- **jwt**: JWT uyumlu, harici sistemlerle kullanım için.
- **jwe**: Şifreli, en güvenli; cookie boyutu daha büyük.

### Revoke (oturum iptali) notu

Cookie cache açıkken, bir cihazda “çıkış yap” veya session iptal edildiğinde **diğer cihazlardaki cookie**, `maxAge` dolana kadar geçerli kalır. Yani iptal anında tüm cihazlarda kesilmesini istiyorsan:

- Hassas işlemlerde `getSession({ query: { disableCookieCache: true } })` kullanarak D1’den kontrol ettirebilirsin.
- Veya `maxAge`’i kısaltırsın (örn. 60 saniye).

Çoğu sayfa yükü senaryosunda 2 dakikalık cache, D1 yükünü ciddi azaltır ve revoke gecikmesi kabul edilebilir sayılır.
