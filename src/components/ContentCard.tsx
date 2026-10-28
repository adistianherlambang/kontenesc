"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { ContentItem } from "@/lib/firebase";
import { getCategoryTone } from "@/lib/categoryTone";

interface ContentCardProps {
  item: ContentItem;
  onToggleExecuted: (item: ContentItem, explicitExecuted?: boolean) => Promise<void> | void;
  onOpen?: (item: ContentItem) => void;
  onPreview?: (item: ContentItem) => void;
  onEdit?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
}

export default function ContentCard({
  item,
  onToggleExecuted,
  onOpen,
  onPreview,
  onEdit,
  onDelete,
}: ContentCardProps) {
  const done = Boolean(item.executed);
  const tone = getCategoryTone(item.kategori);
  const [isSavingExec, setIsSavingExec] = useState(false);

  const handleOpen = () => {
    if (onOpen) {
      onOpen(item);
    } else if (onPreview) {
      onPreview(item);
    }
  };

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (isSavingExec) return;
    const nextDone = !done;
    try {
      setIsSavingExec(true);
      await onToggleExecuted(item, nextDone);
    } finally {
      setIsSavingExec(false);
    }
  };

  return (
    <article className={`flex flex-col rounded-2xl border p-2 sm:p-1.5 transition-shadow hover:shadow-sm ${tone.card}`}>
      {/* Category row: title + execution checkbox & saving state */}
      <header className="flex min-h-11 sm:min-h-9.5 items-center justify-between gap-2 pl-3 pr-1.5">
        <h3 className={`truncate text-[13px] font-semibold ${tone.title}`}>{item.kategori}</h3>
        
        <label
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer select-none hover:bg-black/[0.04] active:bg-black/[0.08] transition-colors min-h-[40px]"
          title={done ? "Tandai belum dieksekusi" : "Tandai sudah dieksekusi"}
        >
          {isSavingExec ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-brand animate-pulse">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Menyimpan...</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-muted sm:hidden">
              {done ? "Selesai" : "Tandai"}
            </span>
          )}
          <input
            type="checkbox"
            checked={done}
            disabled={isSavingExec}
            onChange={handleToggle}
            className="checkbox cursor-pointer"
            aria-label={`Tandai #${item.no} sudah dieksekusi`}
          />
        </label>
      </header>

      {/* White sheet */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex flex-1 cursor-pointer flex-col rounded-xl border border-black/[0.04] bg-canvas p-4 sm:p-4 text-left
          outline-none transition-transform active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-brand/25"
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-muted">
          <span className="font-mono">#{item.no}</span>
          <span className="text-line-strong">·</span>
          <span className="truncate">{item.platform || "Instagram Feed"}</span>
          {done && <span className="badge ml-auto bg-success-soft text-success">Selesai</span>}
        </div>

        <h4
          className={`mb-2 text-[15px] font-semibold leading-snug ${
            done ? "text-faint line-through decoration-faint/60" : "text-ink"
          }`}
        >
          {item.judul}
        </h4>

        <p className="line-clamp-4 whitespace-pre-line text-[13px] leading-relaxed text-muted">
          {item.copywriting}
        </p>
      </button>
    </article>
  );
}
