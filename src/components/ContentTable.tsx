"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Loader2
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";
import { getCategoryTone } from "@/lib/categoryTone";

interface ContentTableProps {
  items: ContentItem[];
  onToggleExecuted: (item: ContentItem, explicitExecuted?: boolean) => Promise<void> | void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
}

const truncateWords = (text: string, maxWords = 4): string => {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}...`;
};

export default function ContentTable({
  items,
  onToggleExecuted,
  onEdit,
  onDelete,
  onPreview
}: ContentTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exitingNos, setExitingNos] = useState<Set<number>>(new Set());

  const copyText = async (id: string, text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleExecution = (item: ContentItem) => {
    if (exitingNos.has(item.no)) return;
    const nextDone = !Boolean(item.executed);
    const supportsVT =
      typeof document !== "undefined" &&
      typeof (document as any).startViewTransition === "function";

    if (supportsVT) {
      onToggleExecuted(item, nextDone);
    } else {
      setExitingNos((prev) => new Set(prev).add(item.no));
      setTimeout(() => {
        onToggleExecuted(item, nextDone);
        setExitingNos((prev) => {
          const next = new Set(prev);
          next.delete(item.no);
          return next;
        });
      }, 250);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-canvas overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr>
              <th className="th w-12 text-center">Status</th>
              <th className="th min-w-[180px]">Judul Konten</th>
              <th className="th whitespace-nowrap">Kategori</th>
              <th className="th min-w-[280px]">Teks Visual (Copywriting)</th>
              <th className="th min-w-[200px]">Arahan Visual</th>
              <th className="th min-w-[130px]">Format</th>
              <th className="th w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => {
              const tone = getCategoryTone(item.kategori);
              const isDone = Boolean(item.executed);
              const isExiting = exitingNos.has(item.no);

              return (
                <tr
                  key={item.id || item.no}
                  style={{ viewTransitionName: `table-row-${isDone ? "done" : "active"}-${item.no}` }}
                  className={`content-card-vt hover:bg-subtle/50 transition-all duration-250 ${isDone ? "bg-subtle/20" : ""
                    } ${isExiting ? "-translate-x-20 opacity-0 pointer-events-none" : ""}`}
                >
                  {/* Execution Status Button */}
                  <td className="td text-center align-middle p-0">
                    <button
                      type="button"
                      onClick={() => handleToggleExecution(item)}
                      className="flex items-center justify-center min-h-[44px] min-w-[44px] w-full p-2.5 cursor-pointer select-none"
                      title={isDone ? "Tandai belum dieksekusi" : "Tandai sudah dieksekusi"}
                      aria-label="Tandai status eksekusi konten"
                    >
                      <span
                        className={`flex size-5 items-center justify-center rounded-md border-[1.5px] transition-colors ${isDone
                            ? "border-success bg-success text-white"
                            : "border-line-strong bg-white text-transparent hover:border-brand"
                          }`}
                      >
                        <Check className="size-3.5 stroke-[2.75]" />
                      </span>
                    </button>
                  </td>

                  {/* Judul Konten */}
                  <td className="td">
                    <button
                      type="button"
                      onClick={() => onPreview(item)}
                      title={item.judul}
                      className="flex items-center gap-2 py-1.5 cursor-pointer text-left group/title w-full min-h-[38px]"
                    >
                      {/* <FileText className="size-4 text-muted shrink-0 group-hover/title:text-brand transition-colors" /> */}
                      <span className={`font-medium text-xs leading-snug group-hover/title:text-brand transition-colors ${isDone ? "text-faint line-through" : "text-ink"
                        }`}>
                        {truncateWords(item.judul, 4)}
                      </span>
                    </button>
                  </td>

                  {/* Kategori Pill */}
                  <td className="td align-middle whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border whitespace-nowrap ${tone.card} ${tone.title}`}>
                      <span className={`size-1.5 rounded-full shrink-0 ${tone.dot}`} />
                      <span className="whitespace-nowrap">{item.kategori}</span>
                    </span>
                  </td>

                  {/* Copywriting */}
                  <td className="td">
                    <div className="flex items-start justify-between gap-2 group/copy">
                      <p className="line-clamp-2 text-muted font-mono text-[11px] leading-relaxed">
                        {item.copywriting}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyText(`copy-${item.no}`, item.copywriting)}
                        className="btn btn-ghost btn-icon size-9 sm:size-8 text-faint hover:text-ink shrink-0"
                        title="Salin Copywriting"
                      >
                        {copiedId === `copy-${item.no}` ? (
                          <Check className="size-3.5 text-success" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Ambience */}
                  <td className="td text-muted text-[11px] italic">
                    <p className="line-clamp-2">
                      {item.ambience || "—"}
                    </p>
                  </td>

                  {/* Platform */}
                  <td className="td align-middle">
                    <span className="badge bg-subtle text-muted text-[11px]">
                      {item.platform || "Instagram Feed"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="td text-center align-middle">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPreview(item)}
                        className="btn btn-ghost btn-icon size-9 sm:size-8 text-muted hover:text-brand"
                        title="Lihat Detail & Edit Teks"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="btn btn-ghost btn-icon size-9 sm:size-8 text-muted hover:text-ink"
                        title="Edit via Form Modal"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="btn btn-ghost btn-icon size-9 sm:size-8 text-muted hover:text-danger"
                        title="Hapus Konten"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
