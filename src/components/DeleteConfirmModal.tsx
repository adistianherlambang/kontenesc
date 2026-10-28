"use client";

import React from "react";
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
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 notion-modal-overlay">
      <div className="notion-modal max-w-sm w-full p-5 shadow-xl text-left">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#DF5452]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Hapus Konten #{item.no}?</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#9B9A97] hover:text-[#37352F] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#787774] mb-3 leading-relaxed">
          Konten <span className="font-semibold text-[#37352F]">"{item.judul}"</span> akan dihapus permanen dari database.
        </p>

        <div className="bg-[#F7F6F3] p-2.5 rounded border border-[#E9E9E7] mb-4 text-[11.5px] font-mono text-[#787774] line-clamp-2">
          {item.copywriting}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="notion-btn notion-btn-bordered text-xs"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="notion-btn bg-[#DF5452] hover:bg-[#c94543] text-white text-xs disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? "Menghapus..." : "Hapus Permanen"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
