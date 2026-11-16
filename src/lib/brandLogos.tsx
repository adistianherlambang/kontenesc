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

/**
 * Clean, proportional SVG wordmarks/logos for each brand
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
