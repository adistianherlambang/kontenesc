"use client";

import React, { useEffect } from "react";
import { AlertCircle, Trash2, X } from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface DeleteConfirmModalProps {
  item: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({
  item,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}: DeleteConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2 font-semibold text-sm text-danger">
            <AlertCircle className="size-4 shrink-0" />
            <span>Hapus Konten #{item.no}?</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="modal-body space-y-3">
          <p className="text-xs text-muted leading-relaxed">
            Konten <strong className="font-semibold text-ink">"{item.judul}"</strong> akan dihapus permanen dari database.
          </p>

          <div className="rounded-lg border border-line bg-surface p-3 font-mono text-xs text-muted line-clamp-3">
            {item.copywriting}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn btn-secondary"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn btn-danger"
          >
            <Trash2 className="size-3.5" />
            <span>{isDeleting ? "Menghapus..." : "Hapus Permanen"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
