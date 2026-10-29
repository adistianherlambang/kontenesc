import { ExtractResult } from "./extractHarga";

export interface PromptOptions {
  kategori: string;
  format: "json" | "csv";
  count: number;
  startNo: number;
  priceData?: ExtractResult | null;
}

export function generateContentPrompt(options: PromptOptions): string {
  const { kategori, format, count, startNo, priceData } = options;
  const targetCategory = kategori.trim() || "Edukasi & Spesifikasi";
  const targetCount = count > 0 ? count : 10;
  const targetStartNo = startNo > 0 ? startNo : 1;

  const jsonExample = `[
  {
    "no": 61,
    "kategori": "Edukasi & Spesifikasi",
    "judul": "Perbedaan Kamera OIS vs EIS",
    "copywriting": "kamera stabil tanpa tripod?\\nkenali ois vs eis:\\n• ois: stabilisasi lensa fisik\\n• eis: stabilisasi sensor digital",
    "ambience": "Close-up modul lensa kamera bergerak halus di atas meja studio",
    "caption": "Kamera goyang saat jalan santai? OIS solusinya! Konsultasikan ke admin kami.\\n\\nWa admin : 088272202241",
    "platform": "Instagram Feed",
    "executed": false
  }
]`;

  const csvExample = `no,kategori,judul,copywriting,ambience,caption,platform,executed
61,Edukasi & Spesifikasi,Perbedaan Kamera OIS vs EIS,"kamera stabil tanpa tripod?
kenali ois vs eis:
• ois: stabilisasi lensa fisik
• eis: stabilisasi sensor digital","Close-up modul lensa kamera bergerak halus","Kamera goyang saat jalan santai? OIS jawabannya! Cek koleksi kamera stabil kami.","Instagram Feed",false
62,Tips & Perawatan,Tips Bersihkan Layar HP,"layar kotor jangan asal semprot!
1. pakai kain microfiber
2. hindari alkohol keras
3. lap searah perlahan","Tangan membersihkan layar smartphone berkilau bersih","Layar jernih bikin nyaman dipakai kerja seharian. Mampir pasang tempered glass rapi di store!","Instagram Carousel",false`;

  const priceSection = priceData
    ? `### DATA HARGA & STOK UNIT TERBARU DARI STORE (Berkas: ${priceData.fileName}):
Gunakan data tipe dan harga gadget resmi dari store berikut ini sebagai referensi produk riil:
\`\`\`json
${JSON.stringify(priceData.data, null, 2)}
\`\`\`
`
    : `### DATA HARGA & PRODUK:
Gunakan referensi produk smartphone/tablet dan aksesoris yang relevan dan terkini di Indonesia tahun 2026.`;

  const formatInstruction =
    format === "json"
      ? `### FORMAT OUTPUT WAJIB (JSON):
Berikan output berupa SATU array JSON valid tanpa teks pembuka atau penutup tambahan, dengan skema:
${jsonExample}`
      : `### FORMAT OUTPUT WAJIB (CSV):
Berikan output berupa data teks CSV yang valid (gunakan tanda kutip dua untuk teks multibaris/berkoma), dengan header dan format persis seperti ini:
${csvExample}`;

  return `Bertindaklah sebagai Senior Social Media Strategist & Content Creator untuk "Eldorado Semarang Cell", toko gadget dan servis terpercaya di Kota Metro (melayani penjualan HP Android/iPhone baru, jual-beli HP bekas bergaransi, servis teknisi profesional, dan aksesoris gadget lengkap).

TUGAS UTAMA:
Buatkan ${targetCount} ide konten Instagram feed/carousel berkualitas tinggi untuk kategori: "${targetCategory}".
Nomor urut (kolom "no") harus berurutan dimulai dari angka: ${targetStartNo}.

---

PANDUAN GAYA & FORMULA KONTEN ELDORADO SEMARANG CELL:
1. **Judul Konten**: Singkat, padat, memikat perhatian, dan spesifik membahas satu topik/permasalahan gadget.
2. **Teks Visual Feed (Copywriting)**:
   - Teks ini akan ditempel langsung pada visual gambar atau slide carousel feed Instagram.
   - Gunakan gaya bahasa santai, to-the-point, ramah, dan persuasif (bisa huruf kecil bersahabat seperti gaya Instagram kekinian).
   - Buat dalam baris-baris pendek atau poin sederhana (bullet point • atau angka 1, 2, 3) agar mudah dipindai dalam 3 detik.
   - Hindari paragraf panjang yang membosankan.
3. **Arahan Visual (Ambience)**:
   - Berikan deskripsi arahan visual/fotografi/ilustrasi yang jelas untuk tim desainer grafis (objek utama, nuansa visual, pencahayaan, atau peraga).
4. **Caption Instagram**:
   - Berikan penjelasan solusi yang lebih lengkap dengan nada akrab dan meyakinkan.
   - Sertakan Call to Action (CTA) dan kontak store:
     📍 Jl. Soekarno Hatta No 43 Metro Barat, Kota Metro
     Wa admin : 088272202241
     Wa servis : 089614351864 (sertakan jika topik terkait servis/kerusakan/ganti sparepart)
5. **Platform**: "Instagram Feed" atau "Instagram Carousel".
6. **Executed**: Nilai selalu false.

---

CONTOH KONTEN SEBELUMNYA (GAYA REFERENSI):

Contoh 1 (Layanan & Edukasi Store):
- Copywriting:
  "gak mau ribet cari sana sini? 
  ke eldorado aja

  layanan eldorado semarang cell :
  1. jual android/iphone baru
  2. jual beli gadget bekas
  3. jual aksesoris gadget

  datang ke store dan konsultasikan"
- Ambience: tumpukan hp dalam amplop
- Caption: "📱 Gak perlu ribet keliling cari gadget! Semua kebutuhan gadgetmu ada di Eldorado Semarang Cell. Mulai dari HP Android & iPhone baru, jual beli gadget bekas, aksesori lengkap, hingga layanan service yang terpercaya.\\n\\nYuk, datang langsung ke store dan temukan gadget impianmu!"

Contoh 2 (Servis & Troubleshooting):
- Copywriting:
  "singkat saja!!

  lcd hpmu rusak?
  baterai hp rusak?
  hpmu mati total?

  langsung saja datang ke store"
- Ambience: foto 3 hp dengan keluhan masing masing
- Caption: "Hp Rusak? Serahkan ke Eldorado Semarang! Service HP di Eldorado Semarang ditangani langsung oleh teknisi profesional dan berpengalaman, bergaransi ✨📱\\n\\nWa admin : 088272202241\\nWa servis : 089614351864"

Contoh 3 (Tips Beli Gadget Bekas):
- Copywriting:
  "worth it nggak? beli iphone bekas

  worth it jika kondisinya seperti ini
  1. battery health >= 80%
  2. fisik mulus
  3. layar normal
  4. kamera normal
  5. face id/touch id berfungsi
  6. tidak pernah kena air
  7. icloud sudah clear

  jangan sampai salah pilih! pastikan cek semua"
- Ambience: iphone png di atas karpet estetik
- Caption: "Tips Beli iPhone Bekas Biar Nggak Ketipu! Mau upgrade ke iPhone tapi budget terbatas? Tenang, iPhone bekas bisa jadi pilihan — asal teliti! Di toko kami unit ready, bergaransi, dan dijamin no tipu-tipu."

---

${priceSection}

---

${formatInstruction}
Pastikan seluruh ${targetCount} konten selesai dibuat secara lengkap tanpa terpotong.`;
}
