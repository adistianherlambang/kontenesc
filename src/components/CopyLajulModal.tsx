"use client";

import React, { useState, useMemo } from "react";
import {
  LajulBrandDoc,
  LajulMetrics,
  LajulTransaksi,
} from "@/lib/firebase";
import { LajulStatusView } from "@/components/LajulSidebar";
import WhatsAppCopyModal, {
  WhatsAppPickerChoice,
} from "@/components/WhatsAppCopyModal";

interface CopyLajulModalProps {
  isOpen: boolean;
  onClose: () => void;
  brands: LajulBrandDoc[];
  metrics?: LajulMetrics;
  tanggal?: string;
  defaultBrand?: string;
  activeView?: LajulStatusView;
}

type LajulFormatStyle = "rincian" | "ringkas" | "rekap";

const ORDERED_BRAND_KEYS = [
  "samsung",
  "xiaomi",
  "vivo",
  "oppo",
  "infinix",
  "realme",
  "tecno",
  "nokia",
  "acc",
];

const FORMAT_OPTIONS = [
  { id: "rincian", label: "Rincian" },
  { id: "ringkas", label: "Ringkas" },
  { id: "rekap", label: "Rekap" },
] as const;

function formatHarga(val: number | string | undefined): string {
  if (val === undefined || val === null || val === "") return "";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `Rp ${num.toLocaleString("id-ID")}`;
}

function formatTxLines(
  txList: LajulTransaksi[],
  style: "rincian" | "ringkas"
): string[] {
  return txList.map((tx, idx) => {
    const rincian = (tx.rincian || "-").trim();
    const rawUser = tx.user?.trim() || "";
    const user = rawUser && rawUser !== "-" ? rawUser : "";
    const rawMetode = tx.metode?.trim() || "";
    const metode = rawMetode && rawMetode !== "-" ? rawMetode : "";
    const harga = formatHarga(tx.harga);

    if (style === "ringkas") {
      const metaParts = [user, metode, harga].filter(Boolean);
      return metaParts.length > 0
        ? `${idx + 1}. *${rincian}* — ${metaParts.join(" • ")}`
        : `${idx + 1}. *${rincian}*`;
    }

    const detailParts = [
      user ? `User: ${user}` : "",
      metode,
      harga,
    ].filter(Boolean);
    const header = `${idx + 1}. *${rincian}*`;
    return detailParts.length > 0
      ? `${header}\n   • ${detailParts.join(" • ")}`
      : header;
  });
}

function formatPaymentSummary(
  metrics: LajulMetrics,
  compact: boolean
): string {
  if (compact) {
    const methods = [
      metrics.cash ? `Cash: ${metrics.cash}` : "",
      metrics.transfer ? `TF: ${metrics.transfer}` : "",
      metrics.debit ? `Debit: ${metrics.debit}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    return [
      "*RINGKASAN PAYMENT*",
      `• Unit Terjual: ${metrics.unit_terjual} unit`,
      methods ? `• ${methods}` : "",
      metrics.total_payment
        ? `• Total Payment: *${metrics.total_payment}*`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "*RINGKASAN PAYMENT*",
    `• Unit Terjual: ${metrics.unit_terjual} unit`,
    metrics.cash ? `• Cash: ${metrics.cash}` : "",
    metrics.transfer ? `• Transfer: ${metrics.transfer}` : "",
    metrics.debit ? `• Debit: ${metrics.debit}` : "",
    metrics.total_payment
      ? `• Total Payment: *${metrics.total_payment}*`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatLajulForWhatsApp({
  selectedBrand,
  brands,
  metrics,
  tanggal,
  style,
  includeNoSell,
  includePaymentSummary,
}: {
  selectedBrand: string;
  brands: LajulBrandDoc[];
  metrics?: LajulMetrics;
  tanggal?: string;
  style: LajulFormatStyle;
  includeNoSell: boolean;
  includePaymentSummary: boolean;
}): string {
  const dateLabel = tanggal ? `Tanggal: ${tanggal}` : "";

  if (selectedBrand === "all") {
    const soldBrands = brands.filter(
      (b) => !b.no_sell && (b.transaksi?.length || 0) > 0
    );
    const noSellBrands = brands.filter(
      (b) => b.no_sell || (b.transaksi?.length || 0) === 0
    );

    const hasBrandContent =
      soldBrands.length > 0 || (includeNoSell && noSellBrands.length > 0);
    const hasPaymentContent = includePaymentSummary && Boolean(metrics);

    if (!hasBrandContent && !hasPaymentContent) return "";

    const totalUnitsFromBrands = soldBrands.reduce(
      (sum, b) => sum + b.transaksi.length,
      0
    );
    const displayUnits = metrics?.unit_terjual ?? totalUnitsFromBrands;
    const meta = [dateLabel, `${displayUnits} unit terjual`]
      .filter(Boolean)
      .join(" • ");

    if (style === "rekap") {
      const brandLines = [
        ...soldBrands.map(
          (b) => `• ${b.brand_name}: ${b.transaksi.length} unit`
        ),
        ...(includeNoSell
          ? noSellBrands.map((b) => `• ${b.brand_name}: No Sell`)
          : []),
      ];

      const blocks = [
        "*REKAP PENJUALAN — SEMARANG CELL*",
        `_${meta}_`,
      ];

      if (brandLines.length > 0) {
        blocks.push("", brandLines.join("\n"));
      }
      if (hasPaymentContent && metrics) {
        blocks.push("", formatPaymentSummary(metrics, false));
      }
      return blocks.join("\n");
    }

    const sections = soldBrands.map((b) => {
      const lines = formatTxLines(b.transaksi, style);
      return `*${b.brand_name.toUpperCase()} (${b.transaksi.length} unit)*\n${lines.join("\n")}`;
    });

    const blocks = [
      "*LAPORAN PENJUALAN — SEMARANG CELL*",
      `_${meta}_`,
    ];

    if (sections.length > 0) {
      blocks.push("", sections.join("\n\n"));
    }
    if (includeNoSell && noSellBrands.length > 0) {
      blocks.push(
        "",
        `*No Sell:* ${noSellBrands.map((b) => b.brand_name).join(", ")}`
      );
    }
    if (hasPaymentContent && metrics) {
      blocks.push("", formatPaymentSummary(metrics, style === "ringkas"));
    }

    return blocks.join("\n");
  }

  const target = brands.find((b) => b.brand_key === selectedBrand);
  if (!target) return "";

  const txList = target.transaksi || [];
  const isNoSell = target.no_sell || txList.length === 0;
  const brandTotalHarga = txList.reduce(
    (sum, tx) => sum + (Number(tx.harga) || 0),
    0
  );

  if (style === "rekap") {
    const meta = dateLabel || "Laporan Harian";
    const lines = isNoSell
      ? ["• Status: No Sell (0 unit)"]
      : [
        `• Unit Terjual: ${txList.length} unit`,
        brandTotalHarga > 0 ? `• Total: *${formatHarga(brandTotalHarga)}*` : "",
      ].filter(Boolean);

    return [
      `*REKAP PENJUALAN ${target.brand_name.toUpperCase()} — SEMARANG CELL*`,
      `_${meta}_`,
      "",
      ...lines,
    ].join("\n");
  }

  const meta = [
    dateLabel,
    isNoSell ? "No Sell" : `${txList.length} unit`,
    !isNoSell && brandTotalHarga > 0
      ? `Total: ${formatHarga(brandTotalHarga)}`
      : "",
  ]
    .filter(Boolean)
    .join(" • ");

  const body = isNoSell
    ? "No Sell (0 transaksi)"
    : formatTxLines(txList, style).join("\n");

  return [
    `*PENJUALAN ${target.brand_name.toUpperCase()} — SEMARANG CELL*`,
    `_${meta}_`,
    "",
    body,
  ].join("\n");
}

export default function CopyLajulModal({
  isOpen,
  onClose,
  brands,
  metrics,
  tanggal,
  defaultBrand = "Semua",
  activeView = "all",
}: CopyLajulModalProps) {
  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => {
      const idxA = ORDERED_BRAND_KEYS.indexOf(a.brand_key.toLowerCase());
      const idxB = ORDERED_BRAND_KEYS.indexOf(b.brand_key.toLowerCase());
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [brands]);

  const initialBrand = useMemo(() => {
    if (defaultBrand && defaultBrand !== "Semua" && defaultBrand !== "all") {
      const matched = sortedBrands.find(
        (b) => b.brand_key.toLowerCase() === defaultBrand.toLowerCase()
      );
      if (matched) return matched.brand_key;
    }
    return "all";
  }, [defaultBrand, sortedBrands]);

  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand);
  const [formatStyle, setFormatStyle] = useState<LajulFormatStyle>("rincian");
  const [includeNoSell, setIncludeNoSell] = useState<boolean>(
    activeView !== "sold"
  );
  const [includePaymentSummary, setIncludePaymentSummary] =
    useState<boolean>(true);

  const totalTxCount = useMemo(
    () =>
      sortedBrands.reduce((sum, b) => sum + (b.transaksi?.length || 0), 0),
    [sortedBrands]
  );

  const pickerChoices = useMemo<WhatsAppPickerChoice[]>(
    () => [
      { id: "all", label: "Semua Brand", count: totalTxCount },
      ...sortedBrands.map((b) => {
        const count = b.transaksi?.length || 0;
        const isNoSell = b.no_sell || count === 0;
        return {
          id: b.brand_key,
          label: b.brand_name,
          count,
          muted: isNoSell,
        };
      }),
    ],
    [sortedBrands, totalTxCount]
  );

  const previewText = useMemo(
    () =>
      formatLajulForWhatsApp({
        selectedBrand,
        brands: sortedBrands,
        metrics,
        tanggal,
        style: formatStyle,
        includeNoSell,
        includePaymentSummary,
      }),
    [
      selectedBrand,
      sortedBrands,
      metrics,
      tanggal,
      formatStyle,
      includeNoSell,
      includePaymentSummary,
    ]
  );

  const showOptions = selectedBrand === "all";

  return (
    <WhatsAppCopyModal
      isOpen={isOpen}
      onClose={onClose}
      title="Copy Laporan WhatsApp"
      subtitle={tanggal ? `Tanggal ${tanggal}` : undefined}
      ariaLabel="Copy Laporan Penjualan WhatsApp"
      closeButtonAriaLabel="Tutup popup copy laporan penjualan"
      pickerLabel="Pilih Brand"
      pickerHint="Pilih semua atau per brand"
      choices={pickerChoices}
      selectedChoice={selectedBrand}
      onSelectChoice={setSelectedBrand}
      formatOptions={FORMAT_OPTIONS}
      selectedFormat={formatStyle}
      onSelectFormat={setFormatStyle}
      extraControls={
        showOptions ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-surface px-3.5 py-2.5">
            <label className="inline-flex items-center gap-2 text-xs text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeNoSell}
                onChange={(e) => setIncludeNoSell(e.target.checked)}
                className="checkbox"
              />
              <span>Sertakan brand No Sell</span>
            </label>
            {metrics && (
              <label className="inline-flex items-center gap-2 text-xs text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePaymentSummary}
                  onChange={(e) => setIncludePaymentSummary(e.target.checked)}
                  className="checkbox"
                />
                <span>Sertakan ringkasan payment</span>
              </label>
            )}
          </div>
        ) : undefined
      }
      previewText={previewText}
      emptyMessage="Belum ada data laporan penjualan untuk pilihan ini."
    />
  );
}
