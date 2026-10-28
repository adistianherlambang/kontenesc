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
  onToggleExecuted: (item: ContentItem) => Promise<void> | void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
}

export default function ContentTable({
  items,
  onToggleExecuted,
  onEdit,
  onDelete,
  onPreview
}: ContentTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingNos, setSavingNos] = useState<Set<number>>(new Set());

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleExecution = async (item: ContentItem) => {
    setSavingNos(prev => new Set(prev).add(item.no));
    try {
      await onToggleExecuted(item);
    } finally {
      setSavingNos(prev => {
        const next = new Set(prev);
        next.delete(item.no);
        return next;
      });
    }
  };

  return (
    <div className="rounded-xl border border-line bg-canvas overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr>
              <th className="th w-12 text-center">Status</th>
              <th className="th w-14 text-center">#No</th>
              <th className="th min-w-[220px]">Judul Konten</th>
              <th className="th min-w-[150px]">Kategori</th>
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
              const isSaving = savingNos.has(item.no);

              return (
                <tr 
                  key={item.id || item.no}
                  className={`hover:bg-subtle/50 transition-colors ${isDone ? "bg-subtle/20" : ""}`}
                >
                  {/* Execution Status Checkbox with Saving Spinner */}
                  <td className="td text-center align-middle">
                    {isSaving ? (
                      <div className="flex items-center justify-center" title="Menyimpan status...">
                        <Loader2 className="size-3.5 animate-spin text-brand" />
                      </div>
                    ) : (
                      <input
                        type="checkbox"
                        checked={isDone}
                        disabled={isSaving}
                        onChange={() => handleToggleExecution(item)}
                        className="checkbox mx-auto cursor-pointer"
                        title={isDone ? "Tandai belum dieksekusi" : "Tandai sudah dieksekusi"}
                        aria-label={`Tandai #${item.no} dieksekusi`}
                      />
                    )}
                  </td>

                  {/* No */}
                  <td className="td text-center font-mono font-medium text-muted align-middle">
                    #{item.no}
                  </td>

                  {/* Judul Konten */}
                  <td className="td">
                    <button
                      type="button"
                      onClick={() => onPreview(item)}
                      className="flex items-center gap-2 cursor-pointer text-left group/title w-full"
                    >
                      <FileText className="size-3.5 text-muted shrink-0 group-hover/title:text-brand transition-colors" />
                      <span className={`font-medium text-xs leading-snug group-hover/title:text-brand transition-colors ${
                        isDone ? "text-faint line-through" : "text-ink"
                      }`}>
                        {item.judul}
                      </span>
                    </button>
                  </td>

                  {/* Kategori Pill */}
                  <td className="td align-middle">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${tone.card} ${tone.title}`}>
                      <span className={`size-1.5 rounded-full ${tone.dot}`} />
                      <span>{item.kategori}</span>
                    </span>
                  </td>

                  {/* Copywriting */}
                  <td className="td">
                    <div className="flex items-start justify-between gap-1 group/copy">
                      <p className="line-clamp-2 text-muted font-mono text-[11px] leading-relaxed">
                        {item.copywriting}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyText(`copy-${item.no}`, item.copywriting)}
                        className="btn btn-ghost btn-icon size-6 text-faint hover:text-ink shrink-0"
                        title="Salin Copywriting"
                      >
                        {copiedId === `copy-${item.no}` ? (
                          <Check className="size-3 text-success" />
                        ) : (
                          <Copy className="size-3" />
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
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onPreview(item)}
                        className="btn btn-ghost btn-icon size-7 text-muted hover:text-brand"
                        title="Lihat Detail & Edit Teks"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="btn btn-ghost btn-icon size-7 text-muted hover:text-ink"
                        title="Edit via Form Modal"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="btn btn-ghost btn-icon size-7 text-muted hover:text-danger"
                        title="Hapus Konten"
                      >
                        <Trash2 className="size-3.5" />
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
