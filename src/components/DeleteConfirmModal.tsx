"use client";

import React from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import { ContentItem } from "@/lib/firebase";
import Modal from "./Modal";

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
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2 font-semibold text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" />
          <span>Hapus Konten?</span>
        </div>
      }
      footer={
        <>
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
        </>
      }
    >
      <Modal.Body className="space-y-3">
        <p className="text-xs text-muted leading-relaxed">
          Konten <strong className="font-semibold text-ink">"{item.judul}"</strong> akan dihapus permanen dari database.
        </p>

        <div className="rounded-lg border border-line bg-surface p-3 text-xs text-muted line-clamp-3">
          {item.copywriting}
        </div>
      </Modal.Body>
    </Modal>
  );
}
