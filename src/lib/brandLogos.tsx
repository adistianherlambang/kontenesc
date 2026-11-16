import React from "react";

export interface BrandInfo {
  slug: string;
  name: string;
  color: string;
  bgLight: string;
  borderColor: string;
  badgeTextColor: string;
}

export const BRAND_CONFIGS: Record<string, BrandInfo> = {
  samsung: {
    slug: "samsung",
    name: "Samsung",
    color: "#1428A0",
    bgLight: "rgba(20, 40, 160, 0.08)",
    borderColor: "rgba(20, 40, 160, 0.2)",
    badgeTextColor: "#1428A0",
  },
  xiaomi: {
    slug: "xiaomi",
    name: "Xiaomi",
    color: "#FF6900",
    bgLight: "rgba(255, 105, 0, 0.08)",
    borderColor: "rgba(255, 105, 0, 0.2)",
    badgeTextColor: "#D85600",
  },
  vivo: {
    slug: "vivo",
    name: "Vivo",
    color: "#008CD6",
    bgLight: "rgba(0, 140, 214, 0.08)",
    borderColor: "rgba(0, 140, 214, 0.2)",
    badgeTextColor: "#0072B0",
  },
  oppo: {
    slug: "oppo",
    name: "Oppo",
    color: "#0F7A4D",
    bgLight: "rgba(15, 122, 77, 0.08)",
    borderColor: "rgba(15, 122, 77, 0.2)",
    badgeTextColor: "#0F7A4D",
  },
  infinix: {
    slug: "infinix",
    name: "Infinix",
    color: "#00B67A",
    bgLight: "rgba(0, 182, 122, 0.08)",
    borderColor: "rgba(0, 182, 122, 0.2)",
    badgeTextColor: "#00875A",
  },
  realme: {
    slug: "realme",
    name: "Realme",
    color: "#E5A800",
    bgLight: "rgba(229, 168, 0, 0.08)",
    borderColor: "rgba(229, 168, 0, 0.25)",
    badgeTextColor: "#B88600",
  },
  tecno: {
    slug: "tecno",
    name: "Tecno",
    color: "#0072CE",
    bgLight: "rgba(0, 114, 206, 0.08)",
    borderColor: "rgba(0, 114, 206, 0.2)",
    badgeTextColor: "#0072CE",
  },
  nokia: {
    slug: "nokia",
    name: "Nokia",
    color: "#124191",
    bgLight: "rgba(18, 65, 145, 0.08)",
    borderColor: "rgba(18, 65, 145, 0.2)",
    badgeTextColor: "#124191",
  },
};

export function getBrandConfig(brandKeyOrName: string): BrandInfo {
  const normalized = (brandKeyOrName || "").trim().toLowerCase();
  if (BRAND_CONFIGS[normalized]) {
    return BRAND_CONFIGS[normalized];
  }
  // Fallback for custom or accessory brands
  return {
    slug: normalized || "other",
    name: brandKeyOrName || "Lainnya",
    color: "#78716C",
    bgLight: "rgba(120, 113, 108, 0.08)",
    borderColor: "rgba(120, 113, 108, 0.2)",
    badgeTextColor: "#57534E",
  };
}

/**
 * Clean SVG Brand Logo / Wordmark Component
 */
export function BrandLogo({
  brand,
  className = "h-5 w-auto",
}: {
  brand: string;
  className?: string;
}) {
  const b = brand.toLowerCase();

  switch (b) {
    case "samsung":
      return (
        <svg viewBox="0 0 120 28" fill="currentColor" className={className} aria-label="Samsung">
          <text
            x="50%"
            y="54%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="var(--font-jakarta), ui-sans-serif, system-ui, sans-serif"
            fontWeight="800"
            fontSize="21"
            letterSpacing="3.5"
          >
            SAMSUNG
          </text>
        </svg>
      );

    case "xiaomi":
      return (
        <svg viewBox="0 0 32 32" className={className} aria-label="Xiaomi" fill="none">
          <rect width="32" height="32" rx="7" fill="#FF6900" />
          <path
            d="M9 10h5v6h4v-6h5v12h-5v-3.5h-4v3.5H9V10z"
            fill="#FFFFFF"
          />
          <circle cx="20.5" cy="16" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case "vivo":
      return (
        <svg viewBox="0 0 80 28" fill="currentColor" className={className} aria-label="Vivo">
          <text
            x="50%"
            y="52%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="var(--font-jakarta), ui-sans-serif, system-ui, sans-serif"
            fontWeight="800"
            fontSize="24"
            letterSpacing="2"
          >
            vivo
          </text>
        </svg>
      );

    case "oppo":
      return (
        <svg viewBox="0 0 90 28" fill="currentColor" className={className} aria-label="Oppo">
          <text
            x="50%"
            y="54%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="var(--font-jakarta), ui-sans-serif, system-ui, sans-serif"
            fontWeight="800"
            fontSize="24"
            letterSpacing="2"
          >
            oppo
          </text>
        </svg>
      );

    case "infinix":
      return (
        <svg viewBox="0 0 100 28" fill="currentColor" className={className} aria-label="Infinix">
          <text
            x="50%"
            y="54%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="var(--font-jakarta), ui-sans-serif, system-ui, sans-serif"
            fontWeight="800"
            fontSize="21"
            letterSpacing="2"
          >
            Infinix
          </text>
        </svg>
      );

    case "realme":
      return (
        <svg viewBox="0 0 96 28" fill="currentColor" className={className} aria-label="Realme">
          <text
            x="50%"
            y="54%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="var(--font-jakarta), ui-sans-serif, system-ui, sans-serif"
            fontWeight="800"
            fontSize="23"
            letterSpacing="1"
          >
            realme
          </text>
        </svg>
      );

    case "tecno":
      return (
        <svg viewBox="0 0 90 28" fill="currentColor" className={className} aria-label="Tecno">
          <text
            x="50%"
            y="54%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="var(--font-jakarta), ui-sans-serif, system-ui, sans-serif"
            fontWeight="800"
            fontSize="22"
            letterSpacing="2.5"
          >
            TECNO
          </text>
        </svg>
      );

    case "nokia":
      return (
        <svg viewBox="0 0 96 28" fill="currentColor" className={className} aria-label="Nokia">
          <text
            x="50%"
            y="54%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="var(--font-jakarta), ui-sans-serif, system-ui, sans-serif"
            fontWeight="800"
            fontSize="22"
            letterSpacing="3"
          >
            NOKIA
          </text>
        </svg>
      );

    default:
      return (
        <span className="font-bold text-sm tracking-wide uppercase truncate">
          {brand}
        </span>
      );
  }
}
