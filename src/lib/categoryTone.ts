// One pastel tone per content category. The same category always gets the
// same colour, so colour carries meaning instead of being decoration.

export interface CategoryTone {
  id?: string;
  name?: string;
  card: string;   // outer card background + border
  title: string;  // category title text
  dot: string;    // small dot used in sidebar / table
  dotHex?: string;
  bgHex?: string;
  borderHex?: string;
  textHex?: string;
}

export interface SwatchOption {
  id: string;
  name: string;
  dotHex: string;
  tone: CategoryTone;
}

export const TONES: Record<string, CategoryTone> = {
  rose: {
    id: "rose",
    name: "Rose",
    card: "bg-[#FDF2F4] border-[#F9DDE3]",
    title: "text-[#BE3459]",
    dot: "bg-[#E8798F]",
    dotHex: "#E8798F",
    bgHex: "#FDF2F4",
    borderHex: "#F9DDE3",
    textHex: "#BE3459",
  },
  blue: {
    id: "blue",
    name: "Biru Samudra",
    card: "bg-[#EFF5FD] border-[#D9E7FA]",
    title: "text-[#1F6FB6]",
    dot: "bg-[#6FA3DB]",
    dotHex: "#6FA3DB",
    bgHex: "#EFF5FD",
    borderHex: "#D9E7FA",
    textHex: "#1F6FB6",
  },
  sand: {
    id: "sand",
    name: "Pasir Hangat",
    card: "bg-[#F7F5F0] border-[#E9E5DA]",
    title: "text-[#6B5E45]",
    dot: "bg-[#BBA982]",
    dotHex: "#BBA982",
    bgHex: "#F7F5F0",
    borderHex: "#E9E5DA",
    textHex: "#6B5E45",
  },
  green: {
    id: "green",
    name: "Hijau Sage",
    card: "bg-[#F0F7EF] border-[#DAEBD7]",
    title: "text-[#2F7A3A]",
    dot: "bg-[#7DBB84]",
    dotHex: "#7DBB84",
    bgHex: "#F0F7EF",
    borderHex: "#DAEBD7",
    textHex: "#2F7A3A",
  },
  amber: {
    id: "amber",
    name: "Kuning Amber",
    card: "bg-[#FEF6EC] border-[#F8E3C8]",
    title: "text-[#B4621A]",
    dot: "bg-[#E7A562]",
    dotHex: "#E7A562",
    bgHex: "#FEF6EC",
    borderHex: "#F8E3C8",
    textHex: "#B4621A",
  },
  violet: {
    id: "violet",
    name: "Soft Violet",
    card: "bg-[#F6F2FD] border-[#E6DCF8]",
    title: "text-[#6D44B8]",
    dot: "bg-[#A98BDE]",
    dotHex: "#A98BDE",
    bgHex: "#F6F2FD",
    borderHex: "#E6DCF8",
    textHex: "#6D44B8",
  },
  indigo: {
    id: "indigo",
    name: "Deep Indigo",
    card: "bg-[#EEF2FF] border-[#E0E7FF]",
    title: "text-[#4338CA]",
    dot: "bg-[#6366F1]",
    dotHex: "#6366F1",
    bgHex: "#EEF2FF",
    borderHex: "#E0E7FF",
    textHex: "#4338CA",
  },
  purple: {
    id: "purple",
    name: "Ungu",
    card: "bg-[#FAF5FF] border-[#F3E8FF]",
    title: "text-[#7E22CE]",
    dot: "bg-[#A855F7]",
    dotHex: "#A855F7",
    bgHex: "#FAF5FF",
    borderHex: "#F3E8FF",
    textHex: "#7E22CE",
  },
  fuchsia: {
    id: "fuchsia",
    name: "Fuchsia",
    card: "bg-[#FDF4FF] border-[#FAE8FF]",
    title: "text-[#A21CAF]",
    dot: "bg-[#D946EF]",
    dotHex: "#D946EF",
    bgHex: "#FDF4FF",
    borderHex: "#FAE8FF",
    textHex: "#A21CAF",
  },
  pink: {
    id: "pink",
    name: "Merah Muda",
    card: "bg-[#FDF2F8] border-[#FCE7F3]",
    title: "text-[#BE185D]",
    dot: "bg-[#EC4899]",
    dotHex: "#EC4899",
    bgHex: "#FDF2F8",
    borderHex: "#FCE7F3",
    textHex: "#BE185D",
  },
  red: {
    id: "red",
    name: "Merah Terang",
    card: "bg-[#FEF2F2] border-[#FEE2E2]",
    title: "text-[#B91C1C]",
    dot: "bg-[#EF4444]",
    dotHex: "#EF4444",
    bgHex: "#FEF2F2",
    borderHex: "#FEE2E2",
    textHex: "#B91C1C",
  },
  orange: {
    id: "orange",
    name: "Oranye",
    card: "bg-[#FFF7ED] border-[#FFEDD5]",
    title: "text-[#C2410C]",
    dot: "bg-[#F97316]",
    dotHex: "#F97316",
    bgHex: "#FFF7ED",
    borderHex: "#FFEDD5",
    textHex: "#C2410C",
  },
  yellow: {
    id: "yellow",
    name: "Kuning Cerah",
    card: "bg-[#FEFCE8] border-[#FEF08A]",
    title: "text-[#A16207]",
    dot: "bg-[#EAB308]",
    dotHex: "#EAB308",
    bgHex: "#FEFCE8",
    borderHex: "#FEF08A",
    textHex: "#A16207",
  },
  lime: {
    id: "lime",
    name: "Hijau Lime",
    card: "bg-[#F7FEE7] border-[#ECFCCB]",
    title: "text-[#4D7C0F]",
    dot: "bg-[#84CC16]",
    dotHex: "#84CC16",
    bgHex: "#F7FEE7",
    borderHex: "#ECFCCB",
    textHex: "#4D7C0F",
  },
  emerald: {
    id: "emerald",
    name: "Hijau Zamrud",
    card: "bg-[#ECFDF5] border-[#D1FAE5]",
    title: "text-[#047857]",
    dot: "bg-[#10B981]",
    dotHex: "#10B981",
    bgHex: "#ECFDF5",
    borderHex: "#D1FAE5",
    textHex: "#047857",
  },
  teal: {
    id: "teal",
    name: "Teal",
    card: "bg-[#F0FDFA] border-[#CCFBF1]",
    title: "text-[#0F766E]",
    dot: "bg-[#14B8A6]",
    dotHex: "#14B8A6",
    bgHex: "#F0FDFA",
    borderHex: "#CCFBF1",
    textHex: "#0F766E",
  },
  cyan: {
    id: "cyan",
    name: "Biru Langit",
    card: "bg-[#ECFEFF] border-[#CFFAFE]",
    title: "text-[#0E7490]",
    dot: "bg-[#06B6D4]",
    dotHex: "#06B6D4",
    bgHex: "#ECFEFF",
    borderHex: "#CFFAFE",
    textHex: "#0E7490",
  },
  slate: {
    id: "slate",
    name: "Abu Slate",
    card: "bg-[#F8FAFC] border-[#E2E8F0]",
    title: "text-[#334155]",
    dot: "bg-[#64748B]",
    dotHex: "#64748B",
    bgHex: "#F8FAFC",
    borderHex: "#E2E8F0",
    textHex: "#334155",
  },
};

export const SWATCH_OPTIONS: SwatchOption[] = [
  { id: "blue", name: "Biru Samudra", dotHex: TONES.blue.dotHex!, tone: TONES.blue },
  { id: "cyan", name: "Biru Langit", dotHex: TONES.cyan.dotHex!, tone: TONES.cyan },
  { id: "teal", name: "Teal", dotHex: TONES.teal.dotHex!, tone: TONES.teal },
  { id: "emerald", name: "Hijau Zamrud", dotHex: TONES.emerald.dotHex!, tone: TONES.emerald },
  { id: "green", name: "Hijau Sage", dotHex: TONES.green.dotHex!, tone: TONES.green },
  { id: "lime", name: "Hijau Lime", dotHex: TONES.lime.dotHex!, tone: TONES.lime },
  { id: "yellow", name: "Kuning Cerah", dotHex: TONES.yellow.dotHex!, tone: TONES.yellow },
  { id: "amber", name: "Kuning Amber", dotHex: TONES.amber.dotHex!, tone: TONES.amber },
  { id: "orange", name: "Oranye", dotHex: TONES.orange.dotHex!, tone: TONES.orange },
  { id: "red", name: "Merah Terang", dotHex: TONES.red.dotHex!, tone: TONES.red },
  { id: "rose", name: "Rose", dotHex: TONES.rose.dotHex!, tone: TONES.rose },
  { id: "pink", name: "Merah Muda", dotHex: TONES.pink.dotHex!, tone: TONES.pink },
  { id: "fuchsia", name: "Fuchsia", dotHex: TONES.fuchsia.dotHex!, tone: TONES.fuchsia },
  { id: "purple", name: "Ungu", dotHex: TONES.purple.dotHex!, tone: TONES.purple },
  { id: "violet", name: "Soft Violet", dotHex: TONES.violet.dotHex!, tone: TONES.violet },
  { id: "indigo", name: "Deep Indigo", dotHex: TONES.indigo.dotHex!, tone: TONES.indigo },
  { id: "sand", name: "Pasir Hangat", dotHex: TONES.sand.dotHex!, tone: TONES.sand },
  { id: "slate", name: "Abu Slate", dotHex: TONES.slate.dotHex!, tone: TONES.slate },
];

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

const STORAGE_KEY = "category_tone_overrides_v1";

let customTonesCache: Record<string, CategoryTone> | null = null;

export function getCustomTones(): Record<string, CategoryTone> {
  if (typeof window === "undefined") return {};
  if (customTonesCache !== null) return customTonesCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    customTonesCache = raw ? JSON.parse(raw) : {};
  } catch {
    customTonesCache = {};
  }
  return customTonesCache || {};
}

export function setCustomTone(category: string, tone: CategoryTone) {
  if (typeof window === "undefined") return;
  const current = { ...getCustomTones(), [category]: tone };
  customTonesCache = current;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn("Could not save category tone", e);
  }
  window.dispatchEvent(new CustomEvent("category_tone_change", { detail: { category, tone } }));
}

export function resetCategoryTone(category: string) {
  if (typeof window === "undefined") return;
  const current = { ...getCustomTones() };
  delete current[category];
  customTonesCache = current;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn("Could not reset category tone", e);
  }
  window.dispatchEvent(new CustomEvent("category_tone_change", { detail: { category } }));
}

export function getDefaultCategoryTone(category = ""): CategoryTone {
  const known = CATEGORY_TONE[category];
  if (known && TONES[known]) return TONES[known];

  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0;
  return TONES[TONE_KEYS[Math.abs(hash) % TONE_KEYS.length]];
}

export function getCategoryTone(category = ""): CategoryTone {
  const custom = getCustomTones()[category];
  if (custom) return custom;
  return getDefaultCategoryTone(category);
}

export function createToneFromHex(hex: string, label = "Kustom"): CategoryTone {
  const cleanHex = hex.startsWith("#") ? hex : `#${hex}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return TONES.blue;
  }
  const r = parseInt(cleanHex.slice(1, 3), 16);
  const g = parseInt(cleanHex.slice(3, 5), 16);
  const b = parseInt(cleanHex.slice(5, 7), 16);

  // Background: pastel tint (blend 93% with white #FFF)
  const bgR = Math.round(r * 0.07 + 255 * 0.93);
  const bgG = Math.round(g * 0.07 + 255 * 0.93);
  const bgB = Math.round(b * 0.07 + 255 * 0.93);
  const bgHex = `#${bgR.toString(16).padStart(2, "0")}${bgG.toString(16).padStart(2, "0")}${bgB.toString(16).padStart(2, "0")}`;

  // Border: slightly deeper pastel tint (blend 80% with white #FFF)
  const bR = Math.round(r * 0.20 + 255 * 0.80);
  const bG = Math.round(g * 0.20 + 255 * 0.80);
  const bB = Math.round(b * 0.20 + 255 * 0.80);
  const borderHex = `#${bR.toString(16).padStart(2, "0")}${bG.toString(16).padStart(2, "0")}${bB.toString(16).padStart(2, "0")}`;

  // Text: high-contrast deeper shade
  const tR = Math.round(r * 0.55);
  const tG = Math.round(g * 0.55);
  const tB = Math.round(b * 0.55);
  const textHex = `#${tR.toString(16).padStart(2, "0")}${tG.toString(16).padStart(2, "0")}${tB.toString(16).padStart(2, "0")}`;

  return {
    id: `custom-${cleanHex.slice(1)}`,
    name: label,
    dot: "",
    card: "",
    title: "",
    dotHex: cleanHex,
    bgHex,
    borderHex,
    textHex,
  };
}
