import { StokItem, StokSummary } from "@/lib/firebase";

export function isAccItem(item: StokItem): boolean {
  return (item.kategori || "handphone").trim().toLowerCase() === "acc";
}

function lookupBrandCount(
  map: Record<string, number> | undefined,
  brandName: string
): number {
  if (!map) return 0;
  return (
    map[brandName] ??
    map[brandName.toLowerCase()] ??
    map[brandName.toUpperCase()] ??
    0
  );
}

export interface ComputedStokTotals {
  brandTotals: Record<string, number>;
  hpBrandTotals: Record<string, number>;
  accBrandTotals: Record<string, number>;
  totalHpUnits: number;
  totalAccUnits: number;
  totalUnits: number;
}

export function computeStokTotals(
  items: StokItem[],
  summary: StokSummary | null
): ComputedStokTotals {
  if (items.length > 0) {
    const brandTotals: Record<string, number> = {};
    const hpBrandTotals: Record<string, number> = {};
    const accBrandTotals: Record<string, number> = {};
    let totalHpUnits = 0;
    let totalAccUnits = 0;

    for (const item of items) {
      const brand = (item.brand || "Lainnya").trim();
      const qty = item.total_stok || 0;
      brandTotals[brand] = (brandTotals[brand] || 0) + qty;
      if (isAccItem(item)) {
        accBrandTotals[brand] = (accBrandTotals[brand] || 0) + qty;
        totalAccUnits += qty;
      } else {
        hpBrandTotals[brand] = (hpBrandTotals[brand] || 0) + qty;
        totalHpUnits += qty;
      }
    }

    return {
      brandTotals,
      hpBrandTotals,
      accBrandTotals,
      totalHpUnits,
      totalAccUnits,
      totalUnits: totalHpUnits + totalAccUnits,
    };
  }

  const hpBrandTotals = summary?.brand_totals || {};
  const accBrandTotals = summary?.acc_brand_totals || {};
  const brandTotals: Record<string, number> = { ...hpBrandTotals };

  for (const [brand, qty] of Object.entries(accBrandTotals)) {
    const existingKey = Object.keys(brandTotals).find(
      (k) => k.toLowerCase() === brand.toLowerCase()
    );
    if (existingKey) {
      brandTotals[existingKey] += qty;
    } else {
      brandTotals[brand] = qty;
    }
  }

  const totalHpUnits = summary?.total_units || 0;
  const totalAccUnits = summary?.total_units_acc || 0;

  return {
    brandTotals,
    hpBrandTotals,
    accBrandTotals,
    totalHpUnits,
    totalAccUnits,
    totalUnits: totalHpUnits + totalAccUnits,
  };
}

export function getBrandCategoryCounts(
  totals: ComputedStokTotals,
  brandName: string
): { total: number; hp: number; acc: number } {
  const hp = lookupBrandCount(totals.hpBrandTotals, brandName);
  const acc = lookupBrandCount(totals.accBrandTotals, brandName);
  const total = lookupBrandCount(totals.brandTotals, brandName) || hp + acc;
  return { total, hp, acc };
}
