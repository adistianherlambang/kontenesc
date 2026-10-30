"use client";

import React, { useState } from "react";
import { Check, Lightbulb } from "lucide-react";
import { ContentItem } from "@/lib/firebase";
import { getCategoryTone } from "@/lib/categoryTone";

interface ContentCardProps {
  item: ContentItem;
  onToggleExecuted: (item: ContentItem, explicitExecuted?: boolean) => Promise<void> | void;
  onTogglePriority?: (item: ContentItem, explicitPriority?: boolean) => Promise<void> | void;
  onOpen?: (item: ContentItem) => void;
  onPreview?: (item: ContentItem) => void;
  onEdit?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
  transitionPrefix?: string;
}

export default function ContentCard({
  item,
  onToggleExecuted,
  onTogglePriority,
  onOpen,
  onPreview,
  transitionPrefix = "content-card",
}: ContentCardProps) {
  const done = Boolean(item.executed);
  const isPriority = Boolean(item.priority);
  const tone = getCategoryTone(item.kategori);
  const [isExiting, setIsExiting] = useState(false);

  const handleOpen = () => {
    if (onOpen) {
      onOpen(item);
    } else if (onPreview) {
      onPreview(item);
    }
  };

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isExiting) return;
    const nextDone = !done;

    const supportsVT =
      typeof document !== "undefined" &&
      typeof (document as any).startViewTransition === "function";

    if (supportsVT) {
      onToggleExecuted(item, nextDone);
    } else {
      setIsExiting(true);
      setTimeout(() => {
        onToggleExecuted(item, nextDone);
        setIsExiting(false);
      }, 260);
    }
  };

  const handleTogglePriority = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isExiting) return;
    const nextPriority = !isPriority;

    const supportsVT =
      typeof document !== "undefined" &&
      typeof (document as any).startViewTransition === "function";

    if (supportsVT) {
      onTogglePriority?.(item, nextPriority);
    } else {
      setIsExiting(true);
      setTimeout(() => {
        onTogglePriority?.(item, nextPriority);
        setIsExiting(false);
      }, 260);
    }
  };

  return (
    <article
      style={{
        viewTransitionName: `${transitionPrefix}-${item.no}`,
        ...(tone.bgHex && tone.borderHex
          ? { backgroundColor: tone.bgHex, borderColor: tone.borderHex }
          : {})
      }}
      className={`content-card-vt flex flex-col rounded-2xl border p-2 sm:p-1.5 transition-all duration-280 ease-out hover:shadow-sm ${tone.card
        } ${done ? "opacity-80 hover:opacity-100" : ""} ${isExiting ? "-translate-x-24 opacity-0 scale-95 pointer-events-none" : "translate-x-0 scale-100"}`}
    >
      {/* Category row: clickable title + execution & priority toggle select boxes */}
      <header className="flex min-h-11 sm:min-h-10 items-center justify-between gap-2 pl-3 pr-1 pb-3">
        <button
          type="button"
          onClick={handleOpen}
          style={tone.textHex ? { color: tone.textHex } : undefined}
          className={`flex-1 min-w-0 py-2 text-left truncate text-[13px] font-semibold cursor-pointer select-none ${tone.title}`}
        >
          {item.kategori}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Kotak select eksekusi */}
          <button
            type="button"
            onClick={handleToggle}
            aria-pressed={done}
            aria-label={done ? "Tandai belum dieksekusi" : "Tandai selesai dieksekusi"}
            title={done ? "Selesai dieksekusi (Klik untuk batalkan)" : "Klik untuk tandai selesai"}
            className={`flex size-8 sm:size-7.5 items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${done
              ? "opacity-100 bg-success text-white border-success shadow-xs"
              : "opacity-50 bg-white hover:opacity-80 text-muted border-line-strong shadow-2xs"
              }`}
          >
            <Check className="size-4 stroke-[2.5]" />
          </button>

          {/* Kotak select prioritas */}
          <button
            type="button"
            onClick={handleTogglePriority}
            aria-pressed={isPriority}
            aria-label={isPriority ? "Hapus dari prioritas" : "Tandai prioritas"}
            title={isPriority ? "Prioritas: Aktif (Klik untuk matikan)" : "Prioritas: Tidak aktif (Klik untuk aktifkan)"}
            className={`flex size-8 sm:size-7.5 items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${isPriority
              ? "opacity-100 bg-amber-500 text-white border-amber-600 shadow-xs"
              : "opacity-50 bg-white hover:opacity-80 text-muted border-line-strong shadow-2xs"
              }`}
          >
            <Lightbulb className="size-4 stroke-[2.25]" />
          </button>
        </div>
      </header>

      {/* White sheet */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex flex-1 cursor-pointer select-none flex-col rounded-xl border border-black/[0.04] bg-canvas p-4 text-left
          outline-none transition-colors hover:bg-surface/60 active:bg-subtle/70 focus-visible:ring-3 focus-visible:ring-brand/25"
      >
        <h4
          suppressHydrationWarning
          className={`mb-2 text-[15px] font-semibold leading-snug ${done ? "text-faint line-through decoration-faint/60" : "text-ink"
            }`}
        >
          {item.judul}
        </h4>

        <p suppressHydrationWarning className="line-clamp-4 whitespace-pre-line text-[13px] leading-relaxed text-muted">
          {item.copywriting}
        </p>
      </button>
    </article>
  );
}
