// One pastel tone per content category. The same category always gets the
// same colour, so colour carries meaning instead of being decoration.

export interface CategoryTone {
  card: string;   // outer card background + border
  title: string;  // category title text
  dot: string;    // small dot used in sidebar / table
}

const TONES: Record<string, CategoryTone> = {
  rose:   { card: "bg-[#FDF2F4] border-[#F9DDE3]", title: "text-[#BE3459]", dot: "bg-[#E8798F]" },
  blue:   { card: "bg-[#EFF5FD] border-[#D9E7FA]", title: "text-[#1F6FB6]", dot: "bg-[#6FA3DB]" },
  sand:   { card: "bg-[#F7F5F0] border-[#E9E5DA]", title: "text-[#6B5E45]", dot: "bg-[#BBA982]" },
  green:  { card: "bg-[#F0F7EF] border-[#DAEBD7]", title: "text-[#2F7A3A]", dot: "bg-[#7DBB84]" },
  amber:  { card: "bg-[#FEF6EC] border-[#F8E3C8]", title: "text-[#B4621A]", dot: "bg-[#E7A562]" },
  violet: { card: "bg-[#F6F2FD] border-[#E6DCF8]", title: "text-[#6D44B8]", dot: "bg-[#A98BDE]" },
};

const CATEGORY_TONE: Record<string, keyof typeof TONES> = {
  "Edukasi & Spesifikasi": "blue",
  "Edukasi & Fitur Teknologi": "blue",
  "Perbandingan Produk": "violet",
  "Tips & Perawatan Perangkat": "green",
  "Rekomendasi Produk": "rose",
  "Aksesoris & Produk Pendukung": "sand",
  "Promo & Penawaran": "amber",
  "Panduan Pembeli & Kebutuhan": "green",
  "Trust & Kredibilitas Toko": "sand",
  "Layanan & Servis Teknisi": "violet",
  "Informasi Produk Baru": "rose",
  "Mitos & Fakta Gadget": "amber",
};

const TONE_KEYS = Object.keys(TONES) as (keyof typeof TONES)[];

export function getCategoryTone(category = ""): CategoryTone {
  const known = CATEGORY_TONE[category];
  if (known) return TONES[known];

  // Unknown (user-added) categories: stable hash so colour never changes.
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0;
  return TONES[TONE_KEYS[Math.abs(hash) % TONE_KEYS.length]];
}
