"use client";

import React, { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { ContentItem } from "@/lib/firebase";
import { getCategoryTone } from "@/lib/categoryTone";

interface ContentCardProps {
  item: ContentItem;
  onToggleExecuted: (item: ContentItem, explicitExecuted?: boolean) => Promise<void> | void;
  onOpen?: (item: ContentItem) => void;
  onPreview?: (item: ContentItem) => void;
  onEdit?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
  transitionPrefix?: string;
}

export default function ContentCard({
  item,
  onToggleExecuted,
  onOpen,
  onPreview,
  transitionPrefix = "active-card",
}: ContentCardProps) {
  const done = Boolean(item.executed);
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

  return (
    <article
      style={{ viewTransitionName: `${transitionPrefix}-${item.no}` }}
      className={`content-card-vt flex flex-col rounded-2xl border p-2 sm:p-1.5 transition-all duration-280 ease-out hover:shadow-sm ${tone.card
        } ${isExiting ? "-translate-x-24 opacity-0 scale-95 pointer-events-none" : "translate-x-0 opacity-100 scale-100"}`}
    >
      {/* Category row: clickable title + execution toggle button */}
      <header className="flex min-h-11 sm:min-h-10 items-center justify-between gap-2 pl-3 pr-1 pb-3">
        <button
          type="button"
          onClick={handleOpen}
          className={`flex-1 min-w-0 py-2 text-left truncate text-[13px] font-semibold cursor-pointer select-none ${tone.title}`}
        >
          {item.kategori}
        </button>

        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={done}
          aria-label={done ? "Tandai belum dieksekusi" : "Tandai selesai dieksekusi"}
          title={done ? "Klik untuk batalkan status selesai" : "Klik untuk tandai selesai"}
          className={`inline-flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold cursor-pointer select-none transition-colors shrink-0 ${done
            ? "bg-success/15 text-success hover:bg-success/25 active:bg-success/30"
            : "bg-white/80 hover:bg-white active:bg-white text-ink border border-black/10 shadow-2xs"
            }`}
        >
          <span
            className={`flex size-5 sm:size-4.5 items-center justify-center rounded-md border-[1.5px] transition-colors ${done
              ? "border-success bg-success text-white"
              : "border-line-strong bg-white text-transparent"
              }`}
          >
            <Check className="size-3.5 stroke-[2.75]" />
          </span>
          <span>{done ? "Selesai" : "Tandai Selesai"}</span>
        </button>
      </header>

      {/* White sheet */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex flex-1 cursor-pointer select-none flex-col rounded-xl border border-black/[0.04] bg-canvas p-4 text-left
          outline-none transition-colors hover:bg-surface/60 active:bg-subtle/70 focus-visible:ring-3 focus-visible:ring-brand/25"
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-muted">
          <span className="truncate">{item.platform || "Instagram Feed"}</span>
          {done && <span className="badge ml-auto bg-success-soft text-success">✓ Sudah Tayang</span>}
        </div>

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
