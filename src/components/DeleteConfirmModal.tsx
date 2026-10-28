"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
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
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-overlay">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl modal-content border border-slate-100 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-xs">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1">
          Hapus Ide Konten #{item.no}?
        </h3>
        <p className="text-xs text-slate-500 mb-4 px-2">
          Apakah Anda yakin ingin menghapus konten <span className="font-semibold text-slate-700">"{item.judul}"</span>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-5 text-left text-xs text-slate-600 font-mono line-clamp-2">
          {item.copywriting}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary text-xs py-2 px-5 flex-1 justify-center"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs py-2 px-5 rounded-lg flex-1 justify-center inline-flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <span>Menghapus...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Hapus Konten</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
