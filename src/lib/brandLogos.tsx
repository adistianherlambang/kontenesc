import React from "react";

export interface BrandInfo {
  slug: string;
  name: string;
}

export const BRAND_LIST: BrandInfo[] = [
  { slug: "samsung", name: "Samsung" },
  { slug: "xiaomi", name: "Xiaomi" },
  { slug: "vivo", name: "Vivo" },
  { slug: "oppo", name: "Oppo" },
  { slug: "infinix", name: "Infinix" },
  { slug: "realme", name: "Realme" },
  { slug: "tecno", name: "Tecno" },
  { slug: "nokia", name: "Nokia" },
];

export const BRAND_CONFIGS: Record<string, BrandInfo> = Object.fromEntries(
  BRAND_LIST.map((b) => [b.slug, b])
);

export function getBrandConfig(brandKeyOrName: string): BrandInfo {
  const normalized = (brandKeyOrName || "").trim().toLowerCase();
  return (
    BRAND_CONFIGS[normalized] || {
      slug: normalized || "other",
      name: brandKeyOrName || "Lainnya",
    }
  );
}

export interface BrandTileStyle {
  bg: string;
  fg: string;
  badgeClass: string;
}

export const BRAND_TILE_STYLES: Record<string, BrandTileStyle> = {
  samsung: {
    bg: "#07229B",
    fg: "#FFFFFF",
    badgeClass: "bg-white/15 text-white",
  },
  xiaomi: {
    bg: "#FF6900",
    fg: "#FFFFFF",
    badgeClass: "bg-white/20 text-white",
  },
  vivo: {
    bg: "#4C63B0",
    fg: "#FFFFFF",
    badgeClass: "bg-white/15 text-white",
  },
  oppo: {
    bg: "#005E2C",
    fg: "#FFFFFF",
    badgeClass: "bg-white/15 text-white",
  },
  realme: {
    bg: "#FBC815",
    fg: "#18181B",
    badgeClass: "bg-black/10 text-[#18181B]",
  },
  tecno: {
    bg: "#0066FF",
    fg: "#FFFFFF",
    badgeClass: "bg-white/15 text-white",
  },
  infinix: {
    bg: "#62FF00",
    fg: "#18181B",
    badgeClass: "bg-black/10 text-[#18181B]",
  },
  itel: {
    bg: "#EB1C24",
    fg: "#FFFFFF",
    badgeClass: "bg-white/15 text-white",
  },
  apple: {
    bg: "#000000",
    fg: "#FFFFFF",
    badgeClass: "bg-white/15 text-white",
  },
  nokia: {
    bg: "#0F4392",
    fg: "#FFFFFF",
    badgeClass: "bg-white/15 text-white",
  },
};

export function getBrandTileStyle(brand: string): BrandTileStyle {
  const b = (brand || "").trim().toLowerCase();
  return (
    BRAND_TILE_STYLES[b] || {
      bg: "#18181B",
      fg: "#FFFFFF",
      badgeClass: "bg-white/15 text-white",
    }
  );
}

/**
 * Centered crisp brand mark for solid-colored square brand cards on /stok
 */
export function BrandTileMark({
  brand,
  className = "w-3/5 max-h-10",
}: {
  brand: string;
  className?: string;
}) {
  const b = (brand || "").toLowerCase();

  switch (b) {
    case "samsung":
      return (
        <svg viewBox="0 0 140 28" className={className} fill="currentColor" aria-label="Samsung">
          <text
            x="70"
            y="21"
            textAnchor="middle"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="800"
            fontSize="19"
            letterSpacing="2.2"
          >
            SAMSUNG
          </text>
        </svg>
      );

    case "xiaomi":
      return (
        <svg viewBox="0 0 64 44" className="w-11 h-11 sm:w-13 sm:h-13" fill="currentColor" aria-label="Xiaomi">
          {/* Bold geometric MI icon */}
          <path d="M6 6h25c5.5 0 9 3.5 9 9v23h-8.5V16.5c0-1.9-1.1-3-3-3H14.5V38H6V6z" />
          <rect x="19" y="21" width="8.5" height="17" />
          <rect x="49" y="6" width="9" height="32" />
        </svg>
      );

    case "vivo":
      return (
        <svg viewBox="0 0 110 32" className={className} fill="currentColor" aria-label="Vivo">
          <text
            x="55"
            y="24"
            textAnchor="middle"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="700"
            fontSize="27"
            letterSpacing="1.5"
          >
            vivo
          </text>
        </svg>
      );

    case "oppo":
      return (
        <svg viewBox="0 0 120 32" className={className} fill="currentColor" aria-label="Oppo">
          <text
            x="60"
            y="23"
            textAnchor="middle"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="600"
            fontSize="26"
            letterSpacing="2"
          >
            oppo
          </text>
        </svg>
      );

    case "realme":
      return (
        <svg viewBox="0 0 130 32" className={className} fill="currentColor" aria-label="Realme">
          <text
            x="65"
            y="23"
            textAnchor="middle"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="600"
            fontSize="24"
            letterSpacing="0.4"
          >
            realme
          </text>
        </svg>
      );

    case "tecno":
      return (
        <svg viewBox="0 0 130 32" className={className} fill="currentColor" aria-label="Tecno">
          <text
            x="65"
            y="23"
            textAnchor="middle"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="800"
            fontSize="22"
            letterSpacing="1.8"
          >
            TECNO
          </text>
        </svg>
      );

    case "infinix":
      return (
        <svg viewBox="0 0 130 32" className={className} fill="currentColor" aria-label="Infinix">
          <text
            x="65"
            y="23"
            textAnchor="middle"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="700"
            fontSize="24"
            letterSpacing="0.5"
          >
            Infinix
          </text>
        </svg>
      );

    case "nokia":
      return (
        <svg viewBox="0 0 130 32" className={className} fill="currentColor" aria-label="Nokia">
          <text
            x="65"
            y="23"
            textAnchor="middle"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="800"
            fontSize="22"
            letterSpacing="2.4"
          >
            NOKIA
          </text>
        </svg>
      );

    case "itel":
      return (
        <svg viewBox="0 0 120 40" className={className} fill="currentColor" aria-label="itel">
          <text
            x="60"
            y="28"
            textAnchor="middle"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="25"
            letterSpacing="1"
          >
            itel
          </text>
        </svg>
      );

    case "apple":
      return (
        <svg viewBox="0 0 384 512" className="w-10 h-10 sm:w-12 sm:h-12" fill="currentColor" aria-label="Apple">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
        </svg>
      );

    default:
      return (
        <span className="font-bold text-base tracking-wide uppercase">
          {brand}
        </span>
      );
  }
}

/**
 * Clean, proportional SVG wordmarks/logos for light backgrounds (sidebar, header, tables)
 */
export function BrandLogo({
  brand,
  className = "h-5 w-auto",
}: {
  brand: string;
  className?: string;
}) {
  const b = (brand || "").toLowerCase();

  switch (b) {
    case "samsung":
      return (
        <svg viewBox="0 0 140 24" className={className} fill="currentColor" aria-label="Samsung">
          <text
            x="0"
            y="18"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="800"
            fontSize="18"
            letterSpacing="3"
          >
            SAMSUNG
          </text>
        </svg>
      );

    case "xiaomi":
      return (
        <svg viewBox="0 0 110 24" className={className} fill="none" aria-label="Xiaomi">
          <rect x="0" y="1" width="22" height="22" rx="5" fill="#FF6900" />
          <path
            d="M4.5 7.5h3.5v4.5h3V7.5h3.5v9H11v-3H8v3H4.5v-9zm11.5 0h2v9h-2v-9z"
            fill="#FFFFFF"
          />
          <text
            x="30"
            y="17.5"
            fill="currentColor"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="700"
            fontSize="16"
            letterSpacing="0.5"
          >
            Xiaomi
          </text>
        </svg>
      );

    case "vivo":
      return (
        <svg viewBox="0 0 80 24" className={className} fill="currentColor" aria-label="Vivo">
          <text
            x="0"
            y="19"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="800"
            fontSize="21"
            letterSpacing="1.5"
          >
            vivo
          </text>
        </svg>
      );

    case "oppo":
      return (
        <svg viewBox="0 0 85 24" className={className} fill="currentColor" aria-label="Oppo">
          <text
            x="0"
            y="18.5"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="800"
            fontSize="20"
            letterSpacing="1.5"
          >
            oppo
          </text>
        </svg>
      );

    case "infinix":
      return (
        <svg viewBox="0 0 100 24" className={className} fill="currentColor" aria-label="Infinix">
          <text
            x="0"
            y="18.5"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="800"
            fontSize="18"
            letterSpacing="1.2"
          >
            Infinix
          </text>
        </svg>
      );

    case "realme":
      return (
        <svg viewBox="0 0 95 24" className={className} fill="currentColor" aria-label="Realme">
          <text
            x="0"
            y="18.5"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="800"
            fontSize="19"
            letterSpacing="0.8"
          >
            realme
          </text>
        </svg>
      );

    case "tecno":
      return (
        <svg viewBox="0 0 95 24" className={className} fill="currentColor" aria-label="Tecno">
          <text
            x="0"
            y="18.5"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="800"
            fontSize="18"
            letterSpacing="2.5"
          >
            TECNO
          </text>
        </svg>
      );

    case "nokia":
      return (
        <svg viewBox="0 0 95 24" className={className} fill="currentColor" aria-label="Nokia">
          <text
            x="0"
            y="18.5"
            fontFamily="var(--font-jakarta), sans-serif"
            fontWeight="800"
            fontSize="18"
            letterSpacing="2.8"
          >
            NOKIA
          </text>
        </svg>
      );

    default:
      return (
        <span className="font-bold text-sm tracking-wide uppercase">
          {brand}
        </span>
      );
  }
}
