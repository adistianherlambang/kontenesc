"use client";

import React, { useState, useMemo } from "react";
import { StokItem } from "@/lib/firebase";
import { BRAND_LIST, getBrandConfig } from "@/lib/brandLogos";
import WhatsAppCopyModal, {
  WhatsAppPickerChoice,
} from "@/components/WhatsAppCopyModal";

interface CopyStokModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StokItem[];
  tanggal?: string;
  defaultBrand?: string;
}

type FormatStyle = "rincian" | "ringkas";

interface BrandOption {
  slug: string;
  name: string;
  totalUnits: number;
  items: StokItem[];
}

const FORMAT_OPTIONS = [
  { id: "rincian", label: "Rincian" },
  { id: "ringkas", label: "Ringkas" },
] as const;

function toTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function sortByTipeNatural(list: StokItem[]): StokItem[] {
  return [...list].sort((a, b) =>
    a.tipe.localeCompare(b.tipe, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
}

function formatBrandItemsLines(
  brandItems: StokItem[],
  style: FormatStyle
): string[] {
  const readyItems = sortByTipeNatural(
    brandItems.filter((item) => (item.total_stok || 0) > 0)
  );

  return readyItems.map((item, idx) => {
    const tipe = (item.tipe || "-").trim();
    const total = item.total_stok || 0;
    const activeColors = (item.rincian_warna || []).filter(
      (w) => (w.qty || 0) > 0 && w.warna?.trim()
    );

    if (style === "ringkas") {
      if (activeColors.length === 0) {
        return `${idx + 1}. *${tipe}* (${total} unit)`;
      }
      const colorsInline = activeColors
        .map((w) => `${toTitleCase(w.warna)} (${w.qty})`)
        .join(", ");
      return `${idx + 1}. *${tipe}* (${total}) — ${colorsInline}`;
    }

    const header = `${idx + 1}. *${tipe}* (${total} unit)`;
    if (activeColors.length === 0) {
      return header;
    }
    const colorLines = activeColors.map(
      (w) => `   • ${toTitleCase(w.warna)}: ${w.qty}`
    );
    return [header, ...colorLines].join("\n");
  });
}

function formatStokForWhatsApp(
  selectedSlug: string,
  brandOptions: BrandOption[],
  tanggal: string | undefined,
  style: FormatStyle
): string {
  const dateLabel = tanggal ? `Update: ${tanggal}` : "";
  const separator = style === "rincian" ? "\n\n" : "\n";

  if (selectedSlug === "all") {
    const nonEmptyBrands = brandOptions.filter((b) => b.totalUnits > 0);
    if (nonEmptyBrands.length === 0) return "";

    const grandTotal = nonEmptyBrands.reduce((acc, b) => acc + b.totalUnits, 0);
    const meta = [dateLabel, `Total: ${grandTotal} unit`]
      .filter(Boolean)
      .join(" • ");

    const sections = nonEmptyBrands.map((brand) => {
      const lines = formatBrandItemsLines(brand.items, style);
      return `*${brand.name.toUpperCase()} (${brand.totalUnits} unit)*\n${lines.join(separator)}`;
    });

    return [
      "*STOK HANDPHONE — SEMARANG CELL*",
      `_${meta}_`,
      "",
      sections.join("\n\n"),
    ].join("\n");
  }

  const target = brandOptions.find((b) => b.slug === selectedSlug);
  if (!target || target.totalUnits <= 0) return "";

  const lines = formatBrandItemsLines(target.items, style);
  const meta = [dateLabel, `Total: ${target.totalUnits} unit`]
    .filter(Boolean)
    .join(" • ");

  return [
    `*STOK ${target.name.toUpperCase()} — SEMARANG CELL*`,
    `_${meta}_`,
    "",
    lines.join(separator),
  ].join("\n");
}

export default function CopyStokModal({
  isOpen,
  onClose,
  items,
  tanggal,
  defaultBrand = "all",
}: CopyStokModalProps) {
  const brandOptions = useMemo<BrandOption[]>(() => {
    const grouped = new Map<string, StokItem[]>();

    for (const item of items) {
      if ((item.total_stok || 0) <= 0) continue;
      const normalized = (item.brand || "Lainnya").trim().toLowerCase();
      const config = getBrandConfig(normalized);
      const existing = grouped.get(config.slug) || [];
      existing.push(item);
      grouped.set(config.slug, existing);
    }

    const result: BrandOption[] = BRAND_LIST.map((b) => {
      const list = grouped.get(b.slug) || [];
      grouped.delete(b.slug);
      return {
        slug: b.slug,
        name: b.name,
        totalUnits: list.reduce((sum, it) => sum + (it.total_stok || 0), 0),
        items: list,
      };
    });

    for (const [slug, list] of grouped.entries()) {
      const displayName = list[0]?.brand || toTitleCase(slug);
      result.push({
        slug,
        name: displayName,
        totalUnits: list.reduce((sum, it) => sum + (it.total_stok || 0), 0),
        items: list,
      });
    }

    return result;
  }, [items]);

  const initialBrand = useMemo(() => {
    const normalizedDefault = (defaultBrand || "all").toLowerCase();
    if (
      normalizedDefault !== "all" &&
      brandOptions.some((b) => b.slug === normalizedDefault)
    ) {
      return normalizedDefault;
    }
    const firstAvailable = brandOptions.find((b) => b.totalUnits > 0);
    return firstAvailable ? firstAvailable.slug : "all";
  }, [defaultBrand, brandOptions]);

  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand);
  const [formatStyle, setFormatStyle] = useState<FormatStyle>("rincian");

  const totalAllUnits = useMemo(
    () => brandOptions.reduce((sum, b) => sum + b.totalUnits, 0),
    [brandOptions]
  );

  const previewText = useMemo(
    () =>
      formatStokForWhatsApp(
        selectedBrand,
        brandOptions,
        tanggal,
        formatStyle
      ),
    [selectedBrand, brandOptions, tanggal, formatStyle]
  );

  const pickerChoices = useMemo<WhatsAppPickerChoice[]>(
    () => [
      { id: "all", label: "Semua Brand", count: totalAllUnits },
      ...brandOptions.map(({ slug, name, totalUnits }) => ({
        id: slug,
        label: name,
        count: totalUnits,
        muted: totalUnits === 0,
      })),
    ],
    [brandOptions, totalAllUnits]
  );

  return (
    <WhatsAppCopyModal
      isOpen={isOpen}
      onClose={onClose}
      title="Copy Stok WhatsApp"
      subtitle={tanggal ? `Update ${tanggal}` : undefined}
      ariaLabel="Copy Stok WhatsApp per Brand"
      closeButtonAriaLabel="Tutup popup copy stok"
      pickerLabel="Pilih Brand"
      pickerHint="Hanya stok tersedia (> 0 unit)"
      choices={pickerChoices}
      selectedChoice={selectedBrand}
      onSelectChoice={setSelectedBrand}
      formatOptions={FORMAT_OPTIONS}
      selectedFormat={formatStyle}
      onSelectFormat={setFormatStyle}
      previewText={previewText}
      emptyMessage="Belum ada stok tersedia (> 0 unit) untuk pilihan ini."
    />
  );
}
