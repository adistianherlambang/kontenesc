"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Save,
  Copy,
  Check,
  Trash2,
  FileText,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";
import { getCategoryTone } from "@/lib/categoryTone";

interface ContentDetailModalProps {
  item: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: ContentItem) => Promise<void>;
  onToggleExecuted?: (item: ContentItem, explicitExecuted?: boolean) => Promise<void> | void;
  onDelete?: (item: ContentItem) => void;
  existingCategories?: string[];
}

export default function ContentDetailModal({
  item,
  isOpen,
  onClose,
  onSave,
  onToggleExecuted,
  onDelete,
  existingCategories = []
}: ContentDetailModalProps) {
  const [draft, setDraft] = useState<ContentItem | null>(item);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingExecution, setIsTogglingExecution] = useState(false);
  const [justSavedExecution, setJustSavedExecution] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  // References for auto-resizing textareas
  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const copyRef = useRef<HTMLTextAreaElement | null>(null);
  const ambienceRef = useRef<HTMLTextAreaElement | null>(null);
  const captionRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync draft when item changes
  useEffect(() => {
    setDraft(item ? { ...item } : null);
    setShowUnsavedConfirm(false);
  }, [item, isOpen]);

  // Auto-resize textarea helper
  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  // Resize all textareas whenever draft is initialized or item changes
  useEffect(() => {
    if (isOpen && draft) {
      // Use setTimeout so DOM has painted
      const timer = setTimeout(() => {
        resizeTextarea(titleRef.current);
        resizeTextarea(copyRef.current);
        resizeTextarea(ambienceRef.current);
        resizeTextarea(captionRef.current);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, item]);

  // Detect whether text changes were made (checklist is auto-saved instantly, not part of isDirty)
  const isDirty = useMemo(() => {
    if (!item || !draft) return false;
    return (
      (draft.judul || "").trim() !== (item.judul || "").trim() ||
      (draft.copywriting || "").trim() !== (item.copywriting || "").trim() ||
      (draft.ambience || "").trim() !== (item.ambience || "").trim() ||
      (draft.caption || "").trim() !== (item.caption || "").trim() ||
      (draft.kategori || "").trim() !== (item.kategori || "").trim() ||
      (draft.platform || "Instagram Feed") !== (item.platform || "Instagram Feed")
    );
  }, [item, draft]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showUnsavedConfirm) {
          setShowUnsavedConfirm(false);
        } else if (isDirty) {
          setShowUnsavedConfirm(true);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showUnsavedConfirm, isDirty, onClose]);

  if (!isOpen || !draft || !item) return null;

  const tone = getCategoryTone(draft.kategori);

  const handleFieldChange = (field: keyof ContentItem, value: any, el?: HTMLTextAreaElement | null) => {
    setDraft(prev => prev ? { ...prev, [field]: value } : null);
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const handleCopy = async (fieldKey: string, text: string) => {
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
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1800);
    } catch (e) {
      console.warn("Failed to copy", e);
    }
  };

  const handleReset = () => {
    if (item) {
      setDraft({ ...item });
      setTimeout(() => {
        resizeTextarea(titleRef.current);
        resizeTextarea(copyRef.current);
        resizeTextarea(ambienceRef.current);
        resizeTextarea(captionRef.current);
      }, 30);
    }
  };

  const handleToggleExecution = async () => {
    if (!draft) return;
    const nextExec = !Boolean(draft.executed);
    const updated: ContentItem = {
      ...draft,
      executed: nextExec,
      updatedAt: new Date().toISOString()
    };

    setDraft(updated);
    setJustSavedExecution(true);
    setTimeout(() => setJustSavedExecution(false), 1800);

    try {
      if (onToggleExecuted) {
        onToggleExecuted(draft, nextExec);
      } else {
        onSave(updated);
      }
    } catch (err) {
      console.warn("Error toggling execution", err);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      setIsSaving(true);
      const updated: ContentItem = {
        ...draft,
        judul: draft.judul.trim(),
        copywriting: draft.copywriting.trim(),
        ambience: draft.ambience?.trim() || "",
        caption: draft.caption?.trim() || "",
        executed: Boolean(draft.executed),
        updatedAt: new Date().toISOString()
      };
      setDraft(updated);
      await onSave(updated);
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    if (!draft) return;
    try {
      setIsSaving(true);
      const updated: ContentItem = {
        ...draft,
        judul: draft.judul.trim(),
        copywriting: draft.copywriting.trim(),
        ambience: draft.ambience?.trim() || "",
        caption: draft.caption?.trim() || "",
        executed: Boolean(draft.executed),
        updatedAt: new Date().toISOString()
      };
      setDraft(updated);
      await onSave(updated);
      setShowUnsavedConfirm(false);
      onClose();
    } catch (err) {
      console.error("Save and close error", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleAttemptClose}>
        <div
          className="modal max-w-2xl max-h-[92dvh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header / Breadcrumb navigation */}
          <div className="modal-header">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold truncate ${tone.title}`}>
                <span className={`size-2 rounded-full shrink-0 ${tone.dot}`} />
                <span className="truncate">{draft.kategori}</span>
              </span>
              <span className="text-line-strong hidden sm:inline">·</span>
              <span className="text-xs text-muted hidden sm:inline">
                {draft.platform || "Instagram Feed"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onDelete && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onClose();
                    onDelete(item);
                  }}
                  className="btn btn-ghost btn-icon text-muted hover:text-danger"
                  title="Hapus konten ini"
                  aria-label="Hapus konten"
                >
                  <Trash2 className="size-4.5" />
                </button>
              )}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleAttemptClose}
                className="btn btn-ghost btn-icon"
                aria-label="Tutup detail"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Document Body */}
          <div className="modal-body space-y-6 px-4 sm:px-6 py-4 sm:py-5">
            {/* Metadata Properties Row (Clean Document Style) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 text-xs">
              {/* Status Eksekusi Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleToggleExecution}
                  disabled={isTogglingExecution}
                  className="inline-flex min-h-10.5 sm:min-h-9 cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-2 sm:px-3.5 sm:py-1.5 transition-colors hover:bg-subtle active:bg-line/60 select-none"
                  title={draft.executed ? "Tandai belum dieksekusi" : "Tandai sudah dieksekusi"}
                >
                  {isTogglingExecution ? (
                    <Loader2 className="size-4 animate-spin text-brand" />
                  ) : draft.executed ? (
                    <CheckCircle2 className="size-4.5 text-success" />
                  ) : (
                    <Circle className="size-4.5 text-faint" />
                  )}
                  <span className="font-medium text-ink">
                    {isTogglingExecution
                      ? "Menyimpan status..."
                      : draft.executed
                        ? "Sudah Dieksekusi"
                        : "Belum Dieksekusi"}
                  </span>
                </button>

                {justSavedExecution && (
                  <span className="badge bg-success-soft text-success text-[11px] animate-in fade-in duration-150">
                    ✓ Tersimpan
                  </span>
                )}
              </div>

              {/* Quick Copy Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleCopy("copywriting", draft.copywriting)}
                  className="btn btn-secondary text-xs flex-1 sm:flex-initial"
                >
                  {copiedField === "copywriting" ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  <span>Salin Teks Feed</span>
                </button>
                {draft.caption && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleCopy("caption", draft.caption)}
                    className="btn btn-secondary text-xs flex-1 sm:flex-initial"
                  >
                    {copiedField === "caption" ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    <span>Salin Caption</span>
                  </button>
                )}
              </div>
            </div>

            {/* 1. Judul Konten (Looks purely like a big document heading, no input border/styling) */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-faint block">
                Judul Konten
              </label>
              <textarea
                ref={titleRef}
                rows={1}
                value={draft.judul}
                onChange={(e) => handleFieldChange("judul", e.target.value, e.target)}
                placeholder="Ketik judul konten..."
                className="w-full resize-none border-0 bg-transparent p-0 text-xl sm:text-2xl font-bold tracking-tight text-ink outline-none ring-0 placeholder:text-faint hover:bg-subtle/50 focus:bg-subtle/60 rounded-md transition-colors px-2 -mx-2 py-1 leading-snug"
              />
            </div>

            {/* 2. Teks Visual Feed (Copywriting) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-faint flex items-center gap-1.5">
                  <FileText className="size-3.5 text-brand" />
                  <span>Teks Visual Feed (Copywriting)</span>
                </label>
                {copiedField === "copywriting" && (
                  <span className="text-[11px] text-success font-medium">✓ Tersalin ke clipboard</span>
                )}
              </div>
              <textarea
                ref={copyRef}
                rows={3}
                value={draft.copywriting}
                onChange={(e) => handleFieldChange("copywriting", e.target.value, e.target)}
                placeholder="Tuliskan teks copywriting feed..."
                className="w-full resize-none border-0 bg-transparent p-0 text-[14px] leading-relaxed text-ink outline-none ring-0 placeholder:text-faint hover:bg-subtle/50 focus:bg-subtle/60 rounded-md transition-colors px-2.5 -mx-2.5 py-1.5 font-normal whitespace-pre-wrap"
              />
            </div>

            {/* 3. Arahan Visual / Ambience */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-faint flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                <span>Arahan Visual / Ambience</span>
              </label>
              <textarea
                ref={ambienceRef}
                rows={2}
                value={draft.ambience || ""}
                onChange={(e) => handleFieldChange("ambience", e.target.value, e.target)}
                placeholder="Tambahkan arahan visual atau suasana desain (opsional)..."
                className="w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-relaxed text-muted italic outline-none ring-0 placeholder:text-faint hover:bg-subtle/50 focus:bg-subtle/60 rounded-md transition-colors px-2.5 -mx-2.5 py-1.5"
              />
            </div>

            {/* 4. Caption Instagram */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-faint flex items-center gap-1.5">
                  <MessageSquare className="size-3.5 text-success" />
                  <span>Caption Instagram</span>
                </label>
                {copiedField === "caption" && (
                  <span className="text-[11px] text-success font-medium">✓ Tersalin ke clipboard</span>
                )}
              </div>
              <textarea
                ref={captionRef}
                rows={4}
                value={draft.caption || ""}
                onChange={(e) => handleFieldChange("caption", e.target.value, e.target)}
                placeholder="Tuliskan caption postingan Instagram..."
                className="w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-relaxed text-ink/90 outline-none ring-0 placeholder:text-faint hover:bg-subtle/50 focus:bg-subtle/60 rounded-md transition-colors px-2.5 -mx-2.5 py-1.5 whitespace-pre-wrap"
              />
            </div>
          </div>

          {/* Floating/Sticky Save Button Bar: Appears ONLY when edits are detected */}
          {isDirty && (
            <div className="shrink-0 border-t border-line bg-canvas/95 px-4 sm:px-6 py-3.5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shadow-[0_-8px_24px_rgba(28,25,23,0.06)] animate-in fade-in slide-in-from-bottom-2 duration-150">
              {/* <div className="flex items-center gap-2 text-xs text-muted">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Ada perubahan pada teks konten</span>
            </div> */}
              <div className="flex items-center gap-2.5 w-full">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleReset}
                  disabled={isSaving}
                  className="btn btn-secondary text-xs flex-1"
                >
                  Batalkan
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn btn-primary text-xs flex-1"
                >
                  <Save className="size-4" />
                  <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pop up konfirmasi perubahan belum disimpan */}
      {showUnsavedConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px] animate-in fade-in duration-150"
          onClick={() => setShowUnsavedConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-confirm-title"
        >
          <div
            className="modal max-w-sm w-full bg-canvas border border-line shadow-[0_24px_64px_rgba(28,25,23,0.22)] rounded-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <span id="unsaved-confirm-title">Perubahan Belum Disimpan</span>
              </div>
              <button
                type="button"
                onClick={() => setShowUnsavedConfirm(false)}
                className="btn btn-ghost btn-icon"
                aria-label="Tutup dialog konfirmasi"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="modal-body space-y-2 py-4">
              <p className="text-[13px] font-medium text-ink leading-snug">
                Ada perubahan yang belum disimpan. Yakin ingin menutup?
              </p>
            </div>

            <div className="modal-footer flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-subtle/40">
              <button
                type="button"
                onClick={() => setShowUnsavedConfirm(false)}
                className="btn btn-secondary text-xs w-full sm:w-auto"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAndClose}
                disabled={isSaving}
                className="btn btn-primary text-xs flex-1 w-full sm:flex-initial"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" />
                    <span>Simpan & Tutup</span>
                  </>
                )}
              </button>
              {/* <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnsavedConfirm(false);
                    onClose();
                  }}
                  className="btn btn-ghost text-danger hover:bg-danger-soft hover:text-danger text-xs flex-1 sm:flex-initial"
                >
                  Buang Perubahan
                </button>

              </div> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
