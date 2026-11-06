import { ExtractResult, HargaItem } from "./extractHarga";

export interface PromptOptions {
  kategori: string;
  format: "json" | "csv";
  count: number;
  priceData?: ExtractResult | null;
}

export interface SelectedToccoUnit extends HargaItem {
  id: string;
  merk: string;
}

function toRupiahNumber(val: number): number {
  if (!val || isNaN(val)) return 0;
  return val > 0 && val < 100000 ? val * 1000 : val;
}

export function generateToccoPrompt(units: SelectedToccoUnit[]): string {
  if (!units || units.length === 0) return "";

  const formattedUnits = units.map((u, idx) => {
    const hargaNormal = toRupiahNumber(u.harga);
    const nominalCashback = toRupiahNumber(u.cashback);
    const hargaDiskon = nominalCashback > 0 ? Math.max(0, hargaNormal - nominalCashback) : "";
    const sku = `ANDROID-${u.merk.toUpperCase()}-${u.tipe.toUpperCase()}${u.ram ? `-${u.ram}` : ""}`;
    return {
      no_urut: idx + 1,
      sku,
      merk: u.merk,
      tipe: u.tipe,
      nama_lengkap: u.nama ? `${u.merk} ${u.tipe} (${u.nama})` : `${u.merk} ${u.tipe}`,
      ram_rom: u.ram ? `${u.ram}GB` : "-",
      harga_rupiah: hargaNormal,
      cashback_rupiah: nominalCashback,
      harga_diskon_rupiah: hargaDiskon,
    };
  });

  const exampleOutput = `[
  {
    "Main Category": "handphone-tablet",
    "Sub Category 1": "handphone",
    "Sub Category 2": "android-os",
    "Judul": "realme 16 5G 12/256GB Prosesor Dimensity 6400 Turbo Layar 6.57” AMOLED 120Hz Kamera 50MP Sony AI Baterai 7000mAh 60W Ultra Charge Garansi Resmi 1 Tahun",
    "Deskripsi": "Produk dijamin 100% original dan baru. Kami menyediakan garansi uang kembali apabila terjadi kehilangan selama proses pengiriman, garansi penukaran unit jika produk diterima dalam kondisi rusak atau cacat, serta garansi resmi 1 tahun dengan dukungan penuh untuk proses klaim.\\n\\nKeterangan : Barang akan kami open box sebelum pengiriman untuk mengambil kartu garansi bagian penjual. Hal ini wajib dilakukan untuk aktivasi garansi resmi REALME, sehingga apabila terjadi kendala pada perangkat, klaim dapat dilakukan di seluruh service center REALME di Indonesia.\\n\\nProsesor : MediaTek Dimensity 6400 Turbo\\nUkuran : 6.57”\\nTeknologi : AMOLED 120Hz dengan tingkat kecerahan hingga ±4200 nits\\nResolusi : Full HD+ (2372 x 1080)\\nKamera Belakang : 50 MP Sony AI + 2 MP depth/monochrome\\nKamera Utama Auto Fokus : Yes\\nKamera Belakang - OIS : No\\nKamera Belakang - Zoom : Digital Zoom\\nKamera Depan : 50 MP\\nKamera Depan Auto Fokus : Yes\\nVideo Resolusi : 1080p @30fps\\nRAM : 12GB (+14GB Dynamic RAM)\\nROM : 256GB UFS 2.2\\nSIM Tray : Dual-SIM\\nJaringan : 5G\\nUSB : USB Type-C\\nUSB : USB 2.0\\nEarjack : No\\nBluetooth : Bluetooth v5.3\\nNFC : Yes\\nAUDIO : Dual stereo speaker\\nBaterai : 7000 mAh\\nFast Charging : 60W Ultra Charge\\nKeamanan : Fingerprint in-display, AI Face Unlock\\nSistem Operasi : Android\\nLainnya : Reverse charging, bypass charging, tahan air dan debu, AI Instant Clip, Selfie Mirror\\nWarna : Black Cloud, White Swan\\n\\nIsi dalam box : Ponsel, adaptor, kabel USB Type-C, alat SIM ejector, casing pelindung, panduan pengguna, dan kartu garansi resmi.",
    "Harga": 4599000,
    "Harga Diskon": "",
    "SKU": "ANDROID-REALME-16 5G-12/256",
    "Jenis Produk": "Buy Now",
    "Total Stok": 10,
    "Kondisi Barang": "Baru",
    "Berat Produk": 500,
    "Status Produk": "Aktif",
    "Length": 18,
    "Height": 6,
    "Width": 10,
    "Preorder": "",
    "Foto 1": "",
    "Foto 2": "",
    "Foto 3": "",
    "Foto 4": "",
    "Foto 5": "",
    "Foto 6": "",
    "Foto 7": "",
    "Foto 8": "",
    "Foto 9": "",
    "Foto 10": "",
    "poster": [
      { "icon": "processor", "isi": "MediaTek Helio G99 (6nm)" },
      { "icon": "layar", "isi": "6.7” PLS LCD 90Hz" },
      { "icon": "kamera", "isi": "50MP Auto Fokus" },
      { "icon": "baterai", "isi": "5000mAh 25W Fast Charging" }
    ],
    "caption": [
      "realme 16 5G 12/256GB Prosesor Dimensity 6400 Turbo Layar 6.57” AMOLED 120Hz Kamera 50MP Sony AI Baterai 7000mAh 60W Ultra Charge Garansi Resmi 1 Tahun\\n\\nDeskripsi:\\nProduk dijamin 100% original dan baru. Kami menyediakan garansi uang kembali apabila terjadi kehilangan selama proses pengiriman, garansi penukaran unit jika produk diterima dalam kondisi rusak atau cacat, serta garansi resmi 1 tahun dengan dukungan penuh untuk proses klaim.\\n\\nKeterangan : Barang akan kami open box sebelum pengiriman untuk mengambil kartu garansi bagian penjual. Hal ini wajib dilakukan untuk aktivasi garansi resmi REALME, sehingga apabila terjadi kendala pada perangkat, klaim dapat dilakukan di seluruh service center REALME di Indonesia.\\n\\nProsesor : MediaTek Dimensity 6400 Turbo\\nUkuran : 6.57”\\nTeknologi : AMOLED 120Hz dengan tingkat kecerahan hingga ±4200 nits\\nResolusi : Full HD+ (2372 x 1080)\\nKamera Belakang : 50 MP Sony AI + 2 MP depth/monochrome\\nKamera Utama Auto Fokus : Yes\\nKamera Belakang - OIS : No\\nKamera Belakang - Zoom : Digital Zoom\\nKamera Depan : 50 MP\\nKamera Depan Auto Fokus : Yes\\nVideo Resolusi : 1080p @30fps\\nRAM : 12GB (+14GB Dynamic RAM)\\nROM : 256GB UFS 2.2\\nSIM Tray : Dual-SIM\\nJaringan : 5G\\nUSB : USB Type-C\\nUSB : USB 2.0\\nEarjack : No\\nBluetooth : Bluetooth v5.3\\nNFC : Yes\\nAUDIO : Dual stereo speaker\\nBaterai : 7000 mAh\\nFast Charging : 60W Ultra Charge\\nKeamanan : Fingerprint in-display, AI Face Unlock\\nSistem Operasi : Android\\nLainnya : Reverse charging, bypass charging, tahan air dan debu, AI Instant Clip, Selfie Mirror\\nWarna : Black Cloud, White Swan\\n\\nIsi dalam box : Ponsel, adaptor, kabel USB Type-C, alat SIM ejector, casing pelindung, panduan pengguna, dan kartu garansi resmi."
    ]
  }
]`;

  return `Bertindaklah sebagai E-Commerce Product Specialist & Technical Researcher profesional untuk "Eldorado Semarang Cell".

TUGAS UTAMA:
Buatkan data produk lengkap dalam format JSON untuk keperluan bulk upload Toco (sesuai struktur file \`toco_bulk_upload_template.xlsx\` sheet \`Product Listing\`), dilengkapi array \`poster\` (maksimal 4 spesifikasi unggulan dengan icon yang telah dibatasi) dan array \`caption\` (sesuai template baku toko) untuk ${units.length} unit pilihan berikut ini:

### DAFTAR UNIT PILIHAN DARI DAFTAR HARGA TOKO:
\`\`\`json
${JSON.stringify(formattedUnits, null, 2)}
\`\`\`

---

### ATURAN RISET SPESIFIKASI RESMI (WAJIB AKURAT & DILARANG ASAL / NO HALLUCINATION):
1. **PERINGATAN KERAS: JANGAN MENGARANG ATAU MENGASAL SPESIFIKASI SAMA SEKALI**:
   - Seluruh spesifikasi teknis HARUS 100% RIIL, akurat, dan diverifikasi dari spesifikasi resmi yang dirilis oleh brand resmi di Indonesia (seperti situs resmi Samsung Indonesia, Xiaomi/Mi.co.id, OPPO Indonesia, Vivo Indonesia, Realme Indonesia, Infinix Official, Tecno Official, Apple Indonesia, serta GSMArena untuk validasi detail chipset/sensor).
   - JANGAN PERNAH MENEBAK! Jika sebuah varian smartphone memakai prosesor Helio G99, jangan tulis Dimensity atau Snapdragon. Jika layarnya 90Hz, jangan tulis 120Hz. Jika kamera tidak punya OIS, tulis 'No'. Kesalahan spesifikasi berakibat fatal pada pembatalan pesanan dan komplain garansi pembeli!
2. **Keakuratan Tiap Baris Spesifikasi**:
   - Pastikan nama chipset/prosesor lengkap (termasuk fabrikasi nm jika ada), ukuran layar, jenis panel & refresh rate & kecerahan nits, resolusi layar, konfigurasi kamera belakang & depan (MP, Auto Fokus, OIS, Zoom, Video Resolusi), RAM (+ Extended/Dynamic RAM jika ada), jenis ROM (UFS/eMMC), SIM Tray, Jaringan (4G/5G), tipe port USB & versi USB, ketersediaan Earjack 3.5mm, versi Bluetooth, NFC (Yes/No), sistem Audio (Mono/Dual Stereo Speaker), kapasitas Baterai (mAh), kecepatan Fast Charging (Watt & nama teknologinya), sensor Keamanan, Sistem Operasi, Fitur Lainnya (IP rating, AI features, dll), varian Warna resmi di Indonesia, hingga **Isi dalam box** (apakah dapat adaptor charger atau hanya kabel di dalam box resmi Indonesia, misal Samsung seri tertentu tidak menyertakan kepala charger di dalam box) ditulis 100% sesuai fakta produk aslinya.

---

### ATURAN KOLOM \`toco_bulk_upload_template.xlsx\` (SHEET PRODUCT LISTING):
1. **Main Category**: Gunakan \`"handphone-tablet"\` (atau \`"audio-kamera-elektronik-lainnya"\` jika TV/elektronik).
2. **Sub Category 1**: Pilih yang sesuai dari daftar validasi Toco:
   - \`"handphone"\` (untuk Smartphone)
   - \`"tablet"\` (untuk Tablet / Pad)
   - \`"aksesoris-handphone"\` (untuk Charger, Case, TWS, Kabel, dll)
   - \`"aksesoris-tablet"\` (untuk Keyboard Tablet, Cover Tablet, Stylus)
   - \`"wearable-devices"\` (untuk Smartwatch / Smartband)
   - \`"power-bank"\` (untuk Powerbank)
3. **Sub Category 2**: Pilih nilai validasi Toco yang sesuai dengan Sub Category 1:
   - Jika \`handphone\`: \`"android-os"\` (HP Android), \`"ios"\` (iPhone), \`"harmonyos"\`, atau \`"feature-phone"\` (HP tombol seperti Nokia 105).
   - Jika \`tablet\`: \`"android-os-1"\` (Tablet Android), \`"ios-1"\` (iPad), atau \`"harmonyos-1"\`.
   - Jika \`aksesoris-handphone\`: \`"charger-handphone"\`, \`"charger-mobil"\`, \`"kabel-data"\`, \`"soft-case-handphone"\`, \`"hard-case-handphone"\`, \`"flip-cover-handphone"\`.
   - Jika \`aksesoris-tablet\`: \`"keyboard-bluetooth"\`, \`"casing-cover-tablet"\`, \`"charger-tablet"\`.
   - Jika \`wearable-devices\`: \`"smart-watch-1"\`, \`"smart-band"\`, \`"aksesoris-wearable-devices"\`.
   - Jika \`power-bank\`: \`"portable-power-bank"\`.
4. **SKU (WAJIB FORMAT BAKU)**:
   - Kolom \`"SKU"\` WAJIB berformat huruf kapital \`ANDROID-BRAND-TIPE-RAM/STORAGE\` (contoh: \`"ANDROID-SAMSUNG-A07 5G-4/128"\`).
   - Gunakan langsung nilai \`sku\` yang sudah disediakan pada masing-masing item di daftar unit pilihan di atas.
5. **Harga & Harga Diskon**:
   - Wajib berupa angka murni dalam Rupiah TANPA simbol Rp, titik, maupun koma (contoh: \`3499000\`).
   - Gunakan \`harga_rupiah\` dari daftar unit di atas untuk kolom \`"Harga"\`, dan \`harga_diskon_rupiah\` untuk kolom \`"Harga Diskon"\` (kosongkan \`""\` jika tidak ada cashback/diskon).
6. **Berat & Ukuran**:
   - \`"Berat Produk"\`: angka dalam gram tanpa satuan (contoh: \`500\` untuk HP, \`800\` untuk Tablet).
   - \`"Length"\`, \`"Height"\`, \`"Width"\`: angka dalam cm tanpa satuan (contoh: Length \`18\`, Height \`6\`, Width \`10\`).
   - \`"Jenis Produk"\`: \`"Buy Now"\`, \`"Kondisi Barang"\`: \`"Baru"\`, \`"Status Produk"\`: \`"Aktif"\`, \`"Total Stok"\`: \`10\`.

---

### ATURAN ARRAY \`poster\` (MAKSIMAL 4 ITEM & ICON DIBATASI KETAT):
Setiap objek produk di dalam JSON WAJIB memiliki properti \`"poster"\` berupa array berisi tepat maksimal 4 spesifikasi yang paling diunggulkan dari unit tersebut untuk kebutuhan desain poster di Figma / Illustrator.

**DIBATASI KETAT: Nilai properti "icon" HANYA BOLEH menggunakan salah satu nilai dari daftar baku berikut (DILARANG MENGGUNAKAN NAMA ICON DI LUAR DAFTAR INI):**
1. \`"processor"\` -> untuk Chipset / CPU / Prosesor (contoh isi: \`"MediaTek Helio G99 (6nm)"\`, \`"Snapdragon 680 (6nm)"\`)
2. \`"layar"\` -> untuk Layar, Panel, Ukuran, atau Refresh Rate (contoh isi: \`"6.7” PLS LCD 90Hz"\`, \`"6.67” AMOLED 120Hz"\`)
3. \`"kamera"\` -> untuk Kamera Utama, Resolusi, atau OIS (contoh isi: \`"50MP Auto Fokus"\`, \`"108MP OIS Ultra Clear"\`)
4. \`"baterai"\` -> untuk Kapasitas Baterai & Daya Charging (contoh isi: \`"5000mAh 25W Fast Charging"\`, \`"6000mAh 45W"\`)
5. \`"ram"\` -> untuk RAM & Dynamic/Extended RAM (contoh isi: \`"8GB (+8GB Dynamic RAM)"\`)
6. \`"penyimpanan"\` -> untuk Memori Internal ROM & Tipe Storage (contoh isi: \`"256GB UFS 2.2"\`)
7. \`"jaringan"\` -> untuk Konektivitas 5G / Sinyal (contoh isi: \`"5G Dual SIM"\`)
8. \`"nfc"\` -> untuk Fitur NFC (contoh isi: \`"Multifunction NFC"\`)
9. \`"speaker"\` -> untuk Sistem Audio Speaker (contoh isi: \`"Dual Stereo Speaker"\`)
10. \`"ketahanan"\` -> untuk Proteksi / IP Rating Tahan Air & Debu (contoh isi: \`"IP54 Tahan Cipratan Air"\`)

**CONTOH FORMAT BAKU \`poster\` (WAJIB PERSIS SEPERTI INI):**
\`\`\`json
"poster": [
  { "icon": "processor", "isi": "MediaTek Helio G99 (6nm)" },
  { "icon": "layar", "isi": "6.7” PLS LCD 90Hz" },
  { "icon": "kamera", "isi": "50MP Auto Fokus" },
  { "icon": "baterai", "isi": "5000mAh 25W Fast Charging" }
]
\`\`\`

---

### ATURAN TEMPLATE BAKU \`Deskripsi\` & ARRAY \`caption\`:
Gunakan persis struktur dan urutan baris template baku kita di bawah ini untuk mengisi kolom \`"Deskripsi"\` dan array \`"caption"\` (sesuaikan nama MERK huruf kapital pada bagian Keterangan aktivasi garansi serta seluruh nilai spesifikasi sesuai riset resmi unit terkait):

-----------------------------
[Nama Unit] [RAM/ROM] Prosesor [Nama Chipset] Layar [Ukuran]” [Panel & Refresh Rate] Kamera [Kamera Utama] Baterai [Kapasitas mAh] [Fast Charging] Garansi Resmi 1 Tahun

Deskripsi:
Produk dijamin 100% original dan baru. Kami menyediakan garansi uang kembali apabila terjadi kehilangan selama proses pengiriman, garansi penukaran unit jika produk diterima dalam kondisi rusak atau cacat, serta garansi resmi 1 tahun dengan dukungan penuh untuk proses klaim.

Keterangan : Barang akan kami open box sebelum pengiriman untuk mengambil kartu garansi bagian penjual. Hal ini wajib dilakukan untuk aktivasi garansi resmi [NAMA MERK KAPITAL], sehingga apabila terjadi kendala pada perangkat, klaim dapat dilakukan di seluruh service center [NAMA MERK KAPITAL] di Indonesia.

Prosesor : [Nama Prosesor Lengkap]
Ukuran : [Ukuran Layar]”
Teknologi : [Tipe Panel, Refresh Rate, dan Tingkat Kecerahan nits]
Resolusi : [Resolusi Layar Lengkap]
Kamera Belakang : [Konfigurasi Semua Kamera Belakang]
Kamera Utama Auto Fokus : [Yes / No]
Kamera Belakang - OIS : [Yes / No]
Kamera Belakang - Zoom : [Detail Zoom]
Kamera Depan : [Resolusi Kamera Depan]
Kamera Depan Auto Fokus : [Yes / No]
Video Resolusi : [Resolusi Rekaman Video Maksimal & FPS]
RAM : [Kapasitas RAM + Extended/Dynamic RAM]
ROM : [Kapasitas ROM & Tipe Storage UFS/eMMC]
SIM Tray : [Single-SIM / Dual-SIM / Hybrid]
Jaringan : [2G / 4G / 5G]
USB : [Tipe Port USB, misal USB Type-C]
USB : [Versi USB, misal USB 2.0]
Earjack : [3.5mm Stereo / No]
Bluetooth : [Versi Bluetooth, misal Bluetooth v5.3]
NFC : [Yes / No]
AUDIO : [Konfigurasi Speaker, misal Dual stereo speaker / Mono speaker]
Baterai : [Kapasitas mAh]
Fast Charging : [Kecepatan Charging & Nama Teknologinya]
Keamanan : [Jenis Fingerprint & Face Unlock]
Sistem Operasi : [Android / iOS]
Lainnya : [Fitur Unggulan Lainnya seperti IP Rating, AI Features, Bypass Charging, dll]
Warna : [Daftar Pilihan Warna Resmi Indonesia]

Isi dalam box : [Daftar isi kelengkapan resmi di dalam kotak penjualan Indonesia].
------------------------------

---

### FORMAT OUTPUT WAJIB (JSON):
Berikan output berupa SATU array JSON valid berisi seluruh ${units.length} unit yang dipilih tanpa terpotong, dengan skema persis seperti contoh berikut:
${exampleOutput}`;
}

export function generateContentPrompt(options: PromptOptions): string {
  const { kategori, format, count, priceData } = options;
  const targetCategory = kategori.trim() || "Edukasi & Spesifikasi";
  const targetCount = count > 0 ? count : 10;

  const jsonExample = `[
  {
    "kategori": "Edukasi & Spesifikasi",
    "judul": "Perbedaan Kamera OIS vs EIS",
    "copywriting": "kamera stabil tanpa tripod?\\nkenali ois vs eis:\\n• ois: stabilisasi lensa fisik\\n• eis: stabilisasi sensor digital",
    "ambience": "Close-up modul lensa kamera bergerak halus di atas meja studio",
    "caption": "Kamera goyang saat jalan santai? OIS solusinya! Konsultasikan ke admin kami.\\n\\nWa admin : 088272202241",
    "platform": "Instagram Feed",
    "executed": false
  }
]`;

  const csvExample = `kategori,judul,copywriting,ambience,caption,platform,executed
"Edukasi & Spesifikasi","Perbedaan Kamera OIS vs EIS","kamera stabil tanpa tripod?
kenali ois vs eis:
• ois: stabilisasi lensa fisik
• eis: stabilisasi sensor digital","Close-up modul lensa kamera bergerak halus","Kamera goyang saat jalan santai? OIS jawabannya! Cek koleksi kamera stabil kami.","Instagram Feed",false
"Tips & Perawatan","Tips Bersihkan Layar HP","layar kotor jangan asal semprot!
1. pakai kain microfiber
2. hindari alkohol keras
3. lap searah perlahan","Tangan membersihkan layar smartphone berkilau bersih","Layar jernih bikin nyaman dipakai kerja seharian. Mampir pasang tempered glass rapi di store!","Instagram Carousel",false`;

  // Opsi 1 (Ada Berkas Harga) vs Opsi 2 (Tanpa Berkas Harga / Opsional)
  const priceSection = priceData
    ? `### DATA HARGA & STOK UNIT TERBARU STORE (${priceData.fileName}):
Gunakan data tipe dan harga gadget resmi dari toko berikut ini sebagai referensi produk riil:
\`\`\`json
${JSON.stringify(priceData.data, null, 2)}
\`\`\`
- Untuk konten rekomendasi produk, promo, atau harga, WAJIB mengacu pada tipe dan harga yang ada di daftar di atas.`
    : `### PANDUAN PRODUK (OPSI TANPA BERKAS HARGA TOKO):
- Pada sesi ini tidak dilampirkan berkas daftar harga internal toko.
- Fokuskan materi pada edukasi teknologi, tips & perawatan, panduan memilih gadget, solusi masalah/servis HP, atau rekomendasi fitur unggulan.
- Jika menyebutkan kategori rentang harga (misal: "HP 2-3 jutaan"), gunakan estimasi harga pasar resmi Indonesia tahun 2026 tanpa mencantumkan harga promo toko yang mengikat. Arahkan audiens untuk cek stok dan harga promo langsung ke WhatsApp admin store.`;

  const formatInstruction =
    format === "json"
      ? `### FORMAT OUTPUT WAJIB (JSON):
Berikan output berupa SATU array JSON valid tanpa teks pembuka atau penutup tambahan, tanpa kolom "no", dengan skema:
${jsonExample}`
      : `### FORMAT OUTPUT WAJIB (CSV):
Berikan output berupa data teks CSV yang valid (gunakan tanda kutip dua untuk teks multibaris/berkoma), tanpa kolom "no", dengan header dan format persis seperti ini:
${csvExample}`;

  return `Bertindaklah sebagai Senior Social Media Strategist & Content Creator profesional untuk "Eldorado Semarang Cell", toko gadget dan servis terpercaya di Kota Metro (melayani penjualan HP Android/iPhone baru, jual-beli HP bekas bergaransi, servis teknisi profesional, dan aksesoris gadget lengkap).

TUGAS UTAMA:
Buatkan ${targetCount} ide konten Instagram feed/carousel berkualitas tinggi untuk kategori: "${targetCategory}".
CATATAN PENTING: DILARANG menggunakan kolom nomor urut ("no") di dalam hasil output (tanpa properti "no").

---

ATURAN KOMPARASI DAN PEMILIHAN BRAND (SANGAT KETAT):
1. **Dilarang Komparasi Lintas Brand Secara Parsial / Terbatas**:
   - Jika membuat konten perbandingan (versus / adu spesifikasi), HANYA boleh membandingkan produk di dalam 1 BRAND YANG SAMA (contoh: Samsung Galaxy A55 vs Galaxy A35, atau iPhone 13 vs iPhone 15).
   - DILARANG KERAS membandingkan hanya 2 atau 3 brand secara acak/parsial (misal: "Samsung vs Xiaomi" atau "Oppo vs Vivo") karena memicu bias dan perdebatan tidak sehat.
2. **Jika Komparasi / Rekomendasi Lintas Brand, SEMUA Brand Harus Masuk**:
   - JIKA ingin membuat konten rekomendasi atau perbandingan lintas brand (misal: "Rekomendasi HP 2-3 Jutaan Terbaik 2026"), maka SEMUA brand utama yang dijual di toko HARUS dimasukkan secara adil dan lengkap (Samsung, Xiaomi/Redmi, Oppo, Vivo, Realme, Infinix, Tecno, Apple/iPhone). Dilarang hanya memasukkan sebagian brand saja.
3. **Kesesuaian Kategori dengan Lini Brand**:
   - Jika membuat konten untuk kategori produk spesifik (misal: kategori "Tablet"), HANYA masukkan brand-brand yang memang memiliki lini produk tersebut di pasaran (misal: Samsung Galaxy Tab, Apple iPad, Xiaomi/Redmi Pad, Huawei MatePad). JANGAN pernah memasukkan brand yang tidak memproduksi lini produk tersebut.

---

ATURAN RISET SPESIFIKASI DETAIL BARANG (WAJIB & AKURAT):
- Setiap kali menyebutkan produk gadget atau aksesoris, WAJIB melakukan riset spesifikasi teknis yang detail, akurat, dan faktual sesuai spesifikasi resmi yang beredar di Indonesia.
- DILARANG HALUSINASI ATAU MENGARANG SPESIFIKASI:
  - Chipset: Sebutkan tipe prosesor yang benar (misal: Snapdragon 7s Gen 2, Dimensity 7050, Helio G99).
  - Layar: Cantumkan tipe panel (AMOLED/Super AMOLED/IPS), refresh rate (90Hz/120Hz), dan resolusi yang sesuai.
  - Kamera: Sebutkan sensor utama (MP), keberadaan OIS/EIS, dan fitur kamera yang sebenarnya.
  - Baterai & Daya: Sebutkan kapasitas baterai (mAh) dan kecepatan charging (Watt) yang tepat.
  - Memori: Sebutkan konfigurasi RAM dan storage (ROM) resmi yang dirilis di Indonesia.
- Informasi spesifikasi yang akurat wajib dijaga untuk membangun reputasi profesional dan kepercayaan calon pembeli Eldorado Semarang Cell.

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

CONTOH GAYA KONTEN SEBELUMNYA:

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
Pastikan seluruh ${targetCount} konten selesai dibuat secara lengkap tanpa terpotong dan tanpa kolom 'no'.`;
}
