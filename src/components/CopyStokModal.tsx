"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Copy, Check, AlertCircle, MessageSquareText } from "lucide-react";
import Modal from "@/components/Modal";
import { StokItem } from "@/lib/firebase";
import { BRAND_LIST, getBrandConfig } from "@/lib/brandLogos";

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

function legacyCopyText(text: string): boolean {
  const field = Object.assign(document.createElement("textarea"), {
    value: text,
  });
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
  document.body.append(field);
  field.select();
  try {
    return document.execCommand("copy");
  } finally {
    field.remove();
  }
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
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const [statusMessage, setStatusMessage] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnnouncementRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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

  const resetCopyFeedback = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopyStatus("idle");
    setStatusMessage("");
  };

  const reportCopyOutcome = (ok: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopyStatus(ok ? "copied" : "failed");
    let msg = ok ? "Tersalin" : "Gagal menyalin";
    if (msg === lastAnnouncementRef.current) {
      msg += "\u00A0";
    }
    lastAnnouncementRef.current = msg;
    setStatusMessage(msg);
    timerRef.current = setTimeout(() => {
      setCopyStatus("idle");
      setStatusMessage("");
    }, 2000);
  };

  const handleCopy = async () => {
    if (!previewText) return;
    try {
      await navigator.clipboard.writeText(previewText);
      reportCopyOutcome(true);
    } catch {
      const ok = legacyCopyText(previewText);
      reportCopyOutcome(ok);
    }
  };

  const handleSelectBrand = (slug: string) => {
    setSelectedBrand(slug);
    resetCopyFeedback();
  };

  const handleSelectFormat = (style: FormatStyle) => {
    setFormatStyle(style);
    resetCopyFeedback();
  };

  const pickerChoices = useMemo(
    () => [
      { slug: "all", name: "Semua Brand", totalUnits: totalAllUnits },
      ...brandOptions.map(({ slug, name, totalUnits }) => ({
        slug,
        name,
        totalUnits,
      })),
    ],
    [brandOptions, totalAllUnits]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title="Copy Stok WhatsApp"
      titleIcon={<MessageSquareText className="size-4 text-brand shrink-0" />}
      subtitle={tanggal ? `Update ${tanggal}` : undefined}
      ariaLabel="Copy Stok WhatsApp per Brand"
      closeButtonAriaLabel="Tutup popup copy stok"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              role="status"
              aria-live="polite"
              className={`text-xs font-medium transition-opacity duration-150 ${
                copyStatus === "copied"
                  ? "text-success opacity-100"
                  : copyStatus === "failed"
                  ? "text-danger opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              {statusMessage}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleCopy}
              aria-disabled={!previewText}
              data-copied={copyStatus === "copied" ? "" : undefined}
              data-failed={copyStatus === "failed" ? "" : undefined}
              className={`btn ${
                previewText
                  ? "btn-primary"
                  : "btn-secondary opacity-50 cursor-not-allowed"
              }`}
            >
              {copyStatus === "copied" ? (
                <Check className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <Copy className="size-4 shrink-0" aria-hidden="true" />
              )}
              <span>
                {copyStatus === "copied"
                  ? "Tersalin"
                  : copyStatus === "failed"
                  ? "Gagal Menyalin"
                  : "Copy untuk WhatsApp"}
              </span>
            </button>
          </div>
        </div>
      }
    >
      <Modal.Body className="space-y-5">
        {/* Brand Picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="field-label mb-0">Pilih Brand</label>
            <span className="text-[11px] text-muted">
              Hanya stok tersedia (&gt; 0 unit)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {pickerChoices.map((choice) => {
              const isSelected = selectedBrand === choice.slug;
              const isEmpty = choice.totalUnits === 0 && choice.slug !== "all";
              return (
                <button
                  type="button"
                  key={choice.slug}
                  onClick={() => handleSelectBrand(choice.slug)}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "border-brand bg-brand-soft text-brand font-semibold"
                      : isEmpty
                      ? "border-line bg-surface text-faint hover:bg-subtle hover:text-muted"
                      : "border-line bg-canvas text-ink hover:bg-subtle"
                  }`}
                >
                  <span>{choice.name}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${
                      isSelected
                        ? "bg-brand/10 text-brand"
                        : "bg-subtle text-muted"
                    }`}
                  >
                    {choice.totalUnits}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview Header + Format Switch */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="whatsapp-stok-preview"
              className="field-label mb-0"
            >
              Pratinjau Pesan WhatsApp
            </label>

            <div
              className="inline-flex items-center rounded-xl border border-line bg-surface p-0.5 text-xs"
              role="group"
              aria-label="Format pesan WhatsApp"
            >
              {(
                [
                  { id: "rincian", label: "Rincian" },
                  { id: "ringkas", label: "Ringkas" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => handleSelectFormat(id)}
                  aria-pressed={formatStyle === id}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    formatStyle === id
                      ? "bg-canvas text-ink shadow-2xs font-semibold"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {previewText ? (
            <textarea
              id="whatsapp-stok-preview"
              readOnly
              rows={12}
              value={previewText}
              className="textarea bg-surface font-mono text-xs sm:text-[13px] leading-relaxed"
            />
          ) : (
            <div className="notice notice-info">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>
                Belum ada stok tersedia (&gt; 0 unit) untuk pilihan ini.
              </span>
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}
