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
    <article className={`flex flex-col rounded-2xl border p-1.5 transition-shadow hover:shadow-sm ${tone.card}`}>
      {/* Category row: title + execution checkbox & saving state */}
      <header className="flex h-9 items-center justify-between gap-3 px-2.5">
        <h3 className={`truncate text-[13px] font-semibold ${tone.title}`}>{item.kategori}</h3>
        
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {isSavingExec && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-brand animate-pulse">
              <Loader2 className="size-3 animate-spin" />
              <span>Menyimpan...</span>
            </span>
          )}
          <input
            type="checkbox"
            checked={done}
            disabled={isSavingExec}
            onChange={handleToggle}
            className="checkbox cursor-pointer"
            title={done ? "Tandai belum dieksekusi" : "Tandai sudah dieksekusi"}
            aria-label={`Tandai #${item.no} sudah dieksekusi`}
          />
        </div>
      </header>

      {/* White sheet */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex flex-1 cursor-pointer flex-col rounded-xl border border-black/[0.04] bg-canvas p-4 text-left
          outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
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
