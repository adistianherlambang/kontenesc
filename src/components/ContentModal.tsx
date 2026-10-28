"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Save, 
  Layers, 
  Camera, 
  MessageSquare, 
  Calendar,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface ContentModalProps {
  isOpen: boolean;
  item: ContentItem | null;
  onClose: () => void;
  onSave: (savedItem: ContentItem) => Promise<void>;
  existingCategories: string[];
  nextSuggestedNo: number;
}

export default function ContentModal({
  isOpen,
  item,
  onClose,
  onSave,
  existingCategories,
  nextSuggestedNo
}: ContentModalProps) {
  const isEditing = Boolean(item);

  const [formData, setFormData] = useState<Partial<ContentItem>>({
    no: nextSuggestedNo,
    kategori: "Edukasi & Spesifikasi",
    judul: "",
    copywriting: "",
    ambience: "",
    caption: "",
    status: "Siap Tayang",
    platform: "Instagram Feed",
    targetDate: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({
        no: nextSuggestedNo,
        kategori: existingCategories[0] || "Edukasi & Spesifikasi",
        judul: "",
        copywriting: "",
        ambience: "",
        caption: "Konsultasikan kebutuhan gadgetmu ke Eldorado Semarang Cell! ✨\n\n📍 Jl. Soekarno Hatta No 43 Metro Barat, Kota Metro\nWa admin : 088272202241\nWa servis : 089614351864",
        status: "Siap Tayang",
        platform: "Instagram Feed",
        targetDate: new Date().toISOString().split("T")[0]
      });
    }
    setErrorMsg("");
  }, [item, isOpen, nextSuggestedNo, existingCategories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul?.trim()) {
      setErrorMsg("Judul konten wajib diisi");
      return;
    }
    if (!formData.copywriting?.trim()) {
      setErrorMsg("Teks copywriting visual wajib diisi");
      return;
    }
    if (!formData.ambience?.trim()) {
      setErrorMsg("Arahan visual / ambience wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await onSave({
        ...formData,
        no: Number(formData.no) || nextSuggestedNo,
        kategori: formData.kategori || "Edukasi & Spesifikasi",
        judul: formData.judul.trim(),
        copywriting: formData.copywriting.trim(),
        ambience: formData.ambience.trim(),
        caption: formData.caption?.trim() || "",
        status: formData.status || "Siap Tayang",
        platform: formData.platform || "Instagram Feed"
      } as ContentItem);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal menyimpan konten");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden modal-content border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1F6FB6] text-white flex items-center justify-center text-xs">
                #{formData.no}
              </span>
              <span>{isEditing ? "Edit Ide Konten" : "Tambah Ide Konten Baru"}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola brief dan materi konten pemasaran media sosial
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Grid Row 1: No, Kategori, Status, Format */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Nomor Urut
              </label>
              <input
                type="number"
                value={formData.no || ""}
                onChange={(e) => setFormData({ ...formData, no: parseInt(e.target.value) || 0 })}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1F6FB6]"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Kategori
              </label>
              <input
                type="text"
                list="category-suggestions"
                value={formData.kategori || ""}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                placeholder="Pilih atau ketik kategori..."
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1F6FB6]"
                required
              />
              <datalist id="category-suggestions">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Status
              </label>
              <select
                value={formData.status || "Siap Tayang"}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1F6FB6]"
              >
                <option value="Draft">Draft</option>
                <option value="Siap Tayang">Siap Tayang</option>
                <option value="Terjadwal">Terjadwal</option>
                <option value="Sudah Tayang">Sudah Tayang</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Format Post
              </label>
              <select
                value={formData.platform || "Instagram Feed"}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1F6FB6]"
              >
                <option value="Instagram Feed">Instagram Feed</option>
                <option value="Instagram Carousel">Instagram Carousel</option>
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="Instagram Story">Instagram Story</option>
              </select>
            </div>
          </div>

          {/* Judul Konten */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Judul Konten <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.judul || ""}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              placeholder="Contoh: RAM Fisik vs RAM Virtual: Jangan Terkecoh Angka"
              className="w-full text-sm font-semibold py-2 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1F6FB6] focus:ring-2 focus:ring-[#1F6FB6]/10"
              required
            />
          </div>

          {/* Copywriting */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#1F6FB6]" />
                Teks Visual / Copywriting (Desain Feed) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Gunakan enter untuk baris baru
              </span>
            </div>
            <textarea
              rows={5}
              value={formData.copywriting || ""}
              onChange={(e) => setFormData({ ...formData, copywriting: e.target.value })}
              placeholder="Teks yang akan ditempelkan pada gambar/carousel grafis..."
              className="w-full text-xs font-mono py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#1F6FB6] focus:ring-2 focus:ring-[#1F6FB6]/10"
              required
            />
          </div>

          {/* Ambience / Visual Direction */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              Arahan Visual / Ambience (Untuk Desainer) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={formData.ambience || ""}
              onChange={(e) => setFormData({ ...formData, ambience: e.target.value })}
              placeholder="Petunjuk komposisi gambar, warna, objek, background, dan suasana desain..."
              className="w-full text-xs py-2 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1F6FB6] focus:ring-2 focus:ring-[#1F6FB6]/10"
              required
            />
          </div>

          {/* Caption Instagram */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              Caption Instagram Lengkap
            </label>
            <textarea
              rows={5}
              value={formData.caption || ""}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="Tulis caption Instagram dengan emoji, call-to-action, dan nomor WhatsApp toko..."
              className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1F6FB6] focus:ring-2 focus:ring-[#1F6FB6]/10 leading-relaxed"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary text-xs py-2 px-5 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Konten</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
