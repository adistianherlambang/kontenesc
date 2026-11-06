import React from "react";

export type PosterIconType =
  | "processor"
  | "layar"
  | "kamera"
  | "baterai"
  | "ram"
  | "penyimpanan"
  | "jaringan"
  | "nfc"
  | "speaker"
  | "ketahanan";

export interface PosterIconDef {
  key: PosterIconType;
  label: string;
  category: string;
  svgInner: string;
  svgMarkup: string;
}

export const POSTER_ICONS: Record<PosterIconType, PosterIconDef> = {
  processor: {
    key: "processor",
    label: "Prosesor / CPU",
    category: "Performa",
    svgInner: `<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>`,
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
  },
  layar: {
    key: "layar",
    label: "Layar / Layar Display",
    category: "Layar",
    svgInner: `<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>`,
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`,
  },
  kamera: {
    key: "kamera",
    label: "Kamera / Lensa",
    category: "Kamera",
    svgInner: `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>`,
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
  },
  baterai: {
    key: "baterai",
    label: "Baterai & Fast Charging",
    category: "Daya",
    svgInner: `<path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1"/><path d="m11 7-3 5h4l-3 5"/><line x1="22" x2="22" y1="11" y2="13"/>`,
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1"/><path d="m11 7-3 5h4l-3 5"/><line x1="22" x2="22" y1="11" y2="13"/></svg>`,
  },
  ram: {
    key: "ram",
    label: "RAM / Memori",
    category: "Performa",
    svgInner: `<path d="M6 19v-3"/><path d="M10 19v-3"/><path d="M14 19v-3"/><path d="M18 19v-3"/><path d="M6 5v3"/><path d="M10 5v3"/><path d="M14 5v3"/><path d="M18 5v3"/><rect width="20" height="8" x="2" y="8" rx="1.5"/>`,
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 19v-3"/><path d="M10 19v-3"/><path d="M14 19v-3"/><path d="M18 19v-3"/><path d="M6 5v3"/><path d="M10 5v3"/><path d="M14 5v3"/><path d="M18 5v3"/><rect width="20" height="8" x="2" y="8" rx="1.5"/></svg>`,
  },
  penyimpanan: {
    key: "penyimpanan",
    label: "Penyimpanan / ROM",
    category: "Penyimpanan",
    svgInner: `<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/>`,
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></svg>`,
  },
  jaringan: {
    key: "jaringan",
    label: "Jaringan 5G / Sinyal",
    category: "Konektivitas",
    svgInner: `<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>`,
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>`,
  },
  nfc: {
    key: "nfc",
    label: "NFC Multifungsi",
    category: "Fitur",
    svgInner: `<path d="M6 8.32a7.43 7.43 0 0 1 0 7.36"/><path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58"/><path d="M12.91 4.1a15.91 15.91 0 0 1 .05 15.8"/><path d="M16.37 2a20.16 20.16 0 0 1 0 20"/>`,
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8.32a7.43 7.43 0 0 1 0 7.36"/><path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58"/><path d="M12.91 4.1a15.91 15.91 0 0 1 .05 15.8"/><path d="M16.37 2a20.16 20.16 0 0 1 0 20"/></svg>`,
  },
  speaker: {
    key: "speaker",
    label: "Speaker / Audio Stereo",
    category: "Audio",
    svgInner: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>`,
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  },
  ketahanan: {
    key: "ketahanan",
    label: "Ketahanan / IP Rating",
    category: "Proteksi",
    svgInner: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>`,
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
};

export const POSTER_ICON_KEYS: PosterIconType[] = [
  "processor",
  "layar",
  "kamera",
  "baterai",
  "ram",
  "penyimpanan",
  "jaringan",
  "nfc",
  "speaker",
  "ketahanan",
];

export function normalizePosterIconKey(rawKey: string): PosterIconType {
  const k = (rawKey || "").trim().toLowerCase();
  if (k === "processor" || k === "cpu" || k === "chipset" || k === "prosesor") return "processor";
  if (k === "layar" || k === "screen" || k === "display" || k === "panel") return "layar";
  if (k === "kamera" || k === "camera" || k === "cam") return "kamera";
  if (k === "baterai" || k === "battery" || k === "charging" || k === "charger") return "baterai";
  if (k === "ram" || k === "memory" || k === "memori") return "ram";
  if (k === "penyimpanan" || k === "rom" || k === "storage" || k === "internal") return "penyimpanan";
  if (k === "jaringan" || k === "5g" || k === "signal" || k === "konektivitas" || k === "network") return "jaringan";
  if (k === "nfc") return "nfc";
  if (k === "speaker" || k === "audio" || k === "sound") return "speaker";
  if (k === "ketahanan" || k === "durability" || k === "ip_rating" || k === "tahan_air" || k === "waterproof") return "ketahanan";
  return "processor";
}

export function getPosterIconDef(key: string): PosterIconDef {
  const norm = normalizePosterIconKey(key);
  return POSTER_ICONS[norm] || POSTER_ICONS.processor;
}

export function renderPosterIcon(key: string, className = "size-4") {
  const def = getPosterIconDef(key);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: def.svgInner }}
    />
  );
}

export async function copySvgToClipboard(svgString: string): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !navigator.clipboard) return false;

    if (typeof ClipboardItem !== "undefined") {
      try {
        const item = new ClipboardItem({
          "text/plain": new Blob([svgString], { type: "text/plain" }),
          "text/html": new Blob([svgString], { type: "text/html" }),
        });
        await navigator.clipboard.write([item]);
        return true;
      } catch {
        // Fallback to writeText below
      }
    }

    await navigator.clipboard.writeText(svgString);
    return true;
  } catch (err) {
    console.error("Gagal menyalin SVG ke clipboard:", err);
    try {
      await navigator.clipboard.writeText(svgString);
      return true;
    } catch {
      return false;
    }
  }
}

export function buildCombinedSvgRow(items: Array<{ icon: string; isi?: string }>): string {
  if (!items || items.length === 0) return "";
  const count = items.length;
  const gap = 36;
  const totalWidth = count * gap;

  const groups = items
    .map((item, idx) => {
      const def = getPosterIconDef(item.icon);
      const xOffset = idx * gap;
      return `  <g id="icon-${item.icon}-${idx + 1}" transform="translate(${xOffset}, 0)">
    ${def.svgInner}
  </g>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 24" width="${totalWidth}" height="24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
${groups}
</svg>`;
}
