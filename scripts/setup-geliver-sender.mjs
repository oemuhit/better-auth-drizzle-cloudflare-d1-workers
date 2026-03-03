#!/usr/bin/env node
/**
 * Geliver Gönderici Adres Kurulumu
 * Bu scripti bir kere çalıştırın, dönen ID'yi GELIVER_SENDER_ID olarak wrangler secret'a ekleyin.
 *
 * Kullanım:
 *   GELIVER_TOKEN=<your_token> node scripts/setup-geliver-sender.mjs
 */

const token = process.env.GELIVER_TOKEN;
if (!token) {
  console.error("Hata: GELIVER_TOKEN environment variable ayarlanmamış.");
  process.exit(1);
}

// ────────────────────────────────────────────────
// Mağaza gönderici bilgilerini buraya girin:
const senderAddress = {
  name: "Mağaza Adı",          // Şirket veya mağaza adı
  email: "info@magazasiniz.com",
  phone: "+905551112233",       // +90 ile başlayan format
  address1: "Mahalle Adı ve Cadde No",
  countryCode: "TR",
  cityName: "İstanbul",
  cityCode: "34",              // İl plaka kodu (İstanbul → 34)
  districtName: "Kadıköy",    // İlçe adı
  zip: "34000",
  shortName: "Ana Depo",
  isRecipientAddress: false,
};
// ────────────────────────────────────────────────

async function main() {
  const res = await fetch("https://api.geliver.io/api/v1/addresses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(senderAddress),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  if (!res.ok) {
    console.error("Geliver API hatası:", json);
    process.exit(1);
  }

  const data = json?.data ?? json;
  console.log("\n✅ Gönderici adres oluşturuldu!");
  console.log("ID:", data.id);
  console.log("\nŞimdi aşağıdaki komutu çalıştırın:");
  console.log(`\n  wrangler secret put GELIVER_SENDER_ID\n`);
  console.log(`Girmeniz gereken değer: ${data.id}\n`);
}

main().catch(console.error);
