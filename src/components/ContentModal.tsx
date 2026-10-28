"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Save, 
  Layers, 
  Camera, 
  MessageSquare, 
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  Upload,
  Copy,
  Check,
  Download,
  Plus
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";
import { 
  parseCSV, 
  convertRowsToContentItems, 
  SAMPLE_CSV_TEMPLATE, 
  SAMPLE_JSON_TEMPLATE 
} from "@/lib/csvHelper";

interface ContentModalProps {
  isOpen: boolean;
  item: ContentItem | null;
  onClose: () => void;
  onSaveSingle: (savedItem: ContentItem) => Promise<void>;
  onSaveBatch: (items: ContentItem[]) => Promise<void>;
  existingCategories: string[];
  nextSuggestedNo: number;
}

export default function ContentModal({
  isOpen,
  item,
  onClose,
  onSaveSingle,
  onSaveBatch,
  existingCategories,
  nextSuggestedNo
}: ContentModalProps) {
  const isEditing = Boolean(item);
  const [activeMode, setActiveMode] = useState<"manual" | "batch-json" | "batch-csv">("manual");

  // Manual Form State
  const [formData, setFormData] = useState<Partial<ContentItem>>({
    no: nextSuggestedNo,
    kategori: "Edukasi & Spesifikasi",
    judul: "",
    copywriting: "",
    ambience: "",
    caption: "",
    executed: false,
    platform: "Instagram Feed",
    targetDate: ""
  });

  // Batch JSON State
  const [jsonInput, setJsonInput] = useState("");
  const [parsedJsonItems, setParsedJsonItems] = useState<ContentItem[]>([]);
  const [jsonError, setJsonError] = useState("");
  const [copiedJsonTemplate, setCopiedJsonTemplate] = useState(false);

  // Batch CSV State
  const [csvInput, setCsvInput] = useState("");
  const [parsedCsvItems, setParsedCsvItems] = useState<ContentItem[]>([]);
  const [csvError, setCsvError] = useState("");
  const [copiedCsvTemplate, setCopiedCsvTemplate] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
      setActiveMode("manual");
    } else {
      setFormData({
        no: nextSuggestedNo,
        kategori: existingCategories[0] || "Edukasi & Spesifikasi",
        judul: "",
        copywriting: "",
        ambience: "",
        caption: "Konsultasikan kebutuhan gadgetmu ke Eldorado Semarang Cell! ✨\n\n📍 Jl. Soekarno Hatta No 43 Metro Barat, Kota Metro\nWa admin : 088272202241\nWa servis : 089614351864",
        executed: false,
        platform: "Instagram Feed",
        targetDate: ""
      });
    }
    setManualError("");
    setJsonError("");
    setCsvError("");
  }, [item, isOpen, nextSuggestedNo, existingCategories]);

  // Live parse JSON input
  useEffect(() => {
    if (!jsonInput.trim()) {
      setParsedJsonItems([]);
      setJsonError("");
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const valid = arr.map((x: any, idx: number) => ({
        id: `konten-${x.no || (nextSuggestedNo + idx)}`,
        no: Number(x.no) || (nextSuggestedNo + idx),
        kategori: x.kategori || "Edukasi & Tips",
        judul: x.judul || `Ide Konten #${nextSuggestedNo + idx}`,
        copywriting: x.copywriting || "",
        ambience: x.ambience || "",
        caption: x.caption || "",
        executed: Boolean(x.executed),
        platform: x.platform || "Instagram Feed",
        updatedAt: new Date().toISOString()
      }));
      setParsedJsonItems(valid);
      setJsonError("");
    } catch (e: any) {
      setJsonError("Format JSON belum valid: " + e.message);
      setParsedJsonItems([]);
    }
  }, [jsonInput, nextSuggestedNo]);

  // Live parse CSV input
  useEffect(() => {
    if (!csvInput.trim()) {
      setParsedCsvItems([]);
      setCsvError("");
      return;
    }
    try {
      const rows = parseCSV(csvInput);
      if (rows.length === 0) {
        setCsvError("Tidak ditemukan baris data valid di dalam CSV.");
        setParsedCsvItems([]);
        return;
      }
      const items = convertRowsToContentItems(rows, nextSuggestedNo);
      setParsedCsvItems(items);
      setCsvError("");
    } catch (e: any) {
      setCsvError("Gagal membaca CSV: " + e.message);
      setParsedCsvItems([]);
    }
  }, [csvInput, nextSuggestedNo]);

  if (!isOpen) return null;

  // Manual Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul?.trim()) {
      setManualError("Judul konten wajib diisi");
      return;
    }
    if (!formData.copywriting?.trim()) {
      setManualError("Teks copywriting visual wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveSingle({
        ...formData,
        no: Number(formData.no) || nextSuggestedNo,
        kategori: formData.kategori || "Edukasi & Spesifikasi",
        judul: formData.judul.trim(),
        copywriting: formData.copywriting.trim(),
        ambience: formData.ambience?.trim() || "",
        caption: formData.caption?.trim() || "",
        executed: Boolean(formData.executed),
        platform: formData.platform || "Instagram Feed"
      } as ContentItem);
      onClose();
    } catch (err: any) {
      setManualError(err?.message || "Gagal menyimpan konten");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch JSON Submit
  const handleBatchJsonSubmit = async () => {
    if (parsedJsonItems.length === 0) return;
    try {
      setIsSubmitting(true);
      await onSaveBatch(parsedJsonItems);
      onClose();
    } catch (err: any) {
      setJsonError(err?.message || "Gagal mengimpor batch JSON");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch CSV Submit
  const handleBatchCsvSubmit = async () => {
    if (parsedCsvItems.length === 0) return;
    try {
      setIsSubmitting(true);
      await onSaveBatch(parsedCsvItems);
      onClose();
    } catch (err: any) {
      setCsvError(err?.message || "Gagal mengimpor batch CSV");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle File Upload for JSON
  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonInput(event.target?.result as string || "");
    };
    reader.readAsText(file);
  };

  // Handle File Upload for CSV
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvInput(event.target?.result as string || "");
    };
    reader.readAsText(file);
  };

  // Download Sample CSV
  const handleDownloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_konten_semarang_cell.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 notion-modal-overlay">
      <div className="notion-modal max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <h2 className="text-sm font-semibold text-[#37352F]">
              {isEditing ? `Edit Konten #${formData.no}` : "Tambah Konten"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9B9A97] hover:text-[#37352F] hover:bg-[#EFEFED] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs (Only shown when adding new content) */}
        {!isEditing && (
          <div className="flex items-center border-b border-[#E9E9E7] bg-[#F7F6F3] px-5 text-xs">
            <button
              onClick={() => setActiveMode("manual")}
              className={`py-2 px-3 border-b-2 font-medium cursor-pointer transition-colors ${
                activeMode === "manual"
                  ? "border-[#1F6FB6] text-[#1F6FB6] font-semibold bg-white"
                  : "border-transparent text-[#787774] hover:text-[#37352F]"
              }`}
            >
              Form Manual (1 Konten)
            </button>
            <button
              onClick={() => setActiveMode("batch-json")}
              className={`py-2 px-3 border-b-2 font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeMode === "batch-json"
                  ? "border-[#1F6FB6] text-[#1F6FB6] font-semibold bg-white"
                  : "border-transparent text-[#787774] hover:text-[#37352F]"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-[#1F6FB6]" />
              <span>Batch JSON</span>
            </button>
            <button
              onClick={() => setActiveMode("batch-csv")}
              className={`py-2 px-3 border-b-2 font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeMode === "batch-csv"
                  ? "border-[#1F6FB6] text-[#1F6FB6] font-semibold bg-white"
                  : "border-transparent text-[#787774] hover:text-[#37352F]"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Batch CSV / Excel</span>
            </button>
          </div>
        )}

        {/* Tab 1: Manual Form */}
        {activeMode === "manual" && (
          <form onSubmit={handleManualSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {manualError && (
              <div className="p-2.5 bg-[#FDEBEC] border border-[#E9E9E7] rounded text-xs text-[#DF5452] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            {/* Checkbox Status Eksekusi */}
            <div className="p-2.5 bg-[#F7F6F3] border border-[#E9E9E7] rounded-md flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-medium text-[#37352F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.executed)}
                  onChange={(e) => setFormData({ ...formData, executed: e.target.checked })}
                  className="notion-checkbox"
                />
                <span>Konten ini sudah dieksekusi / ditayangkan</span>
              </label>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                formData.executed ? "bg-[#E7F3E8] text-[#2B7830]" : "bg-[#FAEBDD] text-[#D9730D]"
              }`}>
                {formData.executed ? "Sudah Selesai" : "Belum Selesai"}
              </span>
            </div>

            {/* Row 1: No, Kategori, Format */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#787774] mb-1">
                  Nomor Konten
                </label>
                <input
                  type="number"
                  value={formData.no || ""}
                  onChange={(e) => setFormData({ ...formData, no: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs py-1.5 px-2.5 rounded border border-[#E9E9E7] bg-white focus:outline-none focus:border-[#1F6FB6]"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#787774] mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  list="category-options"
                  value={formData.kategori || ""}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  placeholder="Kategori ide..."
                  className="w-full text-xs py-1.5 px-2.5 rounded border border-[#E9E9E7] bg-white focus:outline-none focus:border-[#1F6FB6]"
                  required
                />
                <datalist id="category-options">
                  {existingCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#787774] mb-1">
                  Format
                </label>
                <select
                  value={formData.platform || "Instagram Feed"}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                  className="w-full text-xs py-1.5 px-2.5 rounded border border-[#E9E9E7] bg-white focus:outline-none focus:border-[#1F6FB6]"
                >
                  <option value="Instagram Feed">Instagram Feed</option>
                  <option value="Instagram Carousel">Instagram Carousel</option>
                  <option value="Instagram Reels">Instagram Reels</option>
                  <option value="Instagram Story">Instagram Story</option>
                </select>
              </div>
            </div>

            {/* Judul */}
            <div>
              <label className="block text-[11px] font-semibold text-[#787774] mb-1">
                Judul Konten <span className="text-[#DF5452]">*</span>
              </label>
              <input
                type="text"
                value={formData.judul || ""}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                placeholder="Judul topik ide konten..."
                className="w-full text-xs py-1.5 px-2.5 rounded border border-[#E9E9E7] bg-white font-medium text-[#37352F] focus:outline-none focus:border-[#1F6FB6]"
                required
              />
            </div>

            {/* Copywriting */}
            <div>
              <label className="block text-[11px] font-semibold text-[#787774] mb-1">
                Teks Visual Feed (Copywriting) <span className="text-[#DF5452]">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.copywriting || ""}
                onChange={(e) => setFormData({ ...formData, copywriting: e.target.value })}
                placeholder="Teks yang akan didesain pada gambar..."
                className="w-full text-xs font-mono py-2 px-2.5 rounded border border-[#E9E9E7] bg-[#F7F6F3] focus:bg-white focus:outline-none focus:border-[#1F6FB6]"
                required
              />
            </div>

            {/* Ambience */}
            <div>
              <label className="block text-[11px] font-semibold text-[#787774] mb-1">
                Arahan Visual / Ambience
              </label>
              <textarea
                rows={2}
                value={formData.ambience || ""}
                onChange={(e) => setFormData({ ...formData, ambience: e.target.value })}
                placeholder="Deskripsi objek, suasana, pencahayaan..."
                className="w-full text-xs py-1.5 px-2.5 rounded border border-[#E9E9E7] bg-white focus:outline-none focus:border-[#1F6FB6]"
              />
            </div>

            {/* Caption */}
            <div>
              <label className="block text-[11px] font-semibold text-[#787774] mb-1">
                Caption Instagram
              </label>
              <textarea
                rows={4}
                value={formData.caption || ""}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Caption lengkap postingan..."
                className="w-full text-xs py-2 px-2.5 rounded border border-[#E9E9E7] bg-white focus:outline-none focus:border-[#1F6FB6] leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="notion-btn notion-btn-bordered text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="notion-btn notion-btn-primary text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Menyimpan..." : "Simpan Konten"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Batch JSON */}
        {activeMode === "batch-json" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {/* Guide & Sample Helper */}
            <div className="bg-[#F7F6F3] p-3 rounded-md border border-[#E9E9E7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-semibold text-[#37352F]">Import Data JSON Sekaligus</p>
                <p className="text-[11.5px] text-[#787774]">Upload file .json atau tempel teks JSON array di bawah.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setJsonInput(SAMPLE_JSON_TEMPLATE);
                    setCopiedJsonTemplate(true);
                    setTimeout(() => setCopiedJsonTemplate(false), 2000);
                  }}
                  className="notion-btn notion-btn-bordered text-[11px]"
                >
                  {copiedJsonTemplate ? <Check className="w-3 h-3 text-[#2B7830]" /> : <Copy className="w-3 h-3" />}
                  <span>Pakai Contoh Template</span>
                </button>
                <label className="notion-btn notion-btn-bordered text-[11px] cursor-pointer">
                  <Upload className="w-3 h-3 text-[#1F6FB6]" />
                  <span>Pilih File .JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Error or Success indicator */}
            {jsonError && (
              <div className="p-2 bg-[#FDEBEC] border border-[#E9E9E7] rounded text-xs text-[#DF5452]">
                {jsonError}
              </div>
            )}
            {parsedJsonItems.length > 0 && (
              <div className="p-2 bg-[#E7F3E8] border border-[#E9E9E7] rounded text-xs text-[#2B7830] font-medium flex items-center justify-between">
                <span>✓ Berhasil membaca {parsedJsonItems.length} ide konten!</span>
                <span className="text-[11px]">Siap ditambahkan ke database</span>
              </div>
            )}

            {/* Textarea */}
            <div>
              <label className="block text-[11px] font-semibold text-[#787774] mb-1">
                Teks JSON (Array of Objects):
              </label>
              <textarea
                rows={7}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[ { "no": 61, "kategori": "Edukasi", "judul": "Judul konten...", "copywriting": "Teks...", "caption": "Caption..." } ]'
                className="w-full text-xs font-mono py-2 px-2.5 rounded border border-[#E9E9E7] bg-[#F7F6F3] focus:bg-white focus:outline-none focus:border-[#1F6FB6]"
              />
            </div>

            {/* Preview Detected Items */}
            {parsedJsonItems.length > 0 && (
              <div className="border border-[#E9E9E7] rounded max-h-36 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#F7F6F3] text-[#787774] sticky top-0">
                    <tr>
                      <th className="p-1.5">#No</th>
                      <th className="p-1.5">Kategori</th>
                      <th className="p-1.5">Judul</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E9E7]">
                    {parsedJsonItems.map((it, idx) => (
                      <tr key={idx} className="hover:bg-[#F7F6F3]">
                        <td className="p-1.5 font-mono">#{it.no}</td>
                        <td className="p-1.5">{it.kategori}</td>
                        <td className="p-1.5 font-medium truncate max-w-xs">{it.judul}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="notion-btn notion-btn-bordered text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchJsonSubmit}
                disabled={parsedJsonItems.length === 0 || isSubmitting}
                className="notion-btn notion-btn-primary text-xs disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Mengimpor..." : `Tambahkan ${parsedJsonItems.length} Konten (Batch)`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Batch CSV */}
        {activeMode === "batch-csv" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {/* Guide & Sample Helper */}
            <div className="bg-[#F7F6F3] p-3 rounded-md border border-[#E9E9E7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-semibold text-[#37352F]">Import Data CSV / Excel Sekaligus</p>
                <p className="text-[11.5px] text-[#787774]">Kolom yang didukung: no, kategori, judul, copywriting, ambience, caption, executed</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="notion-btn notion-btn-bordered text-[11px]"
                  title="Unduh file template CSV untuk dibuka di Excel/Sheets"
                >
                  <Download className="w-3 h-3 text-emerald-600" />
                  <span>Download Template .CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCsvInput(SAMPLE_CSV_TEMPLATE);
                    setCopiedCsvTemplate(true);
                    setTimeout(() => setCopiedCsvTemplate(false), 2000);
                  }}
                  className="notion-btn notion-btn-bordered text-[11px]"
                >
                  {copiedCsvTemplate ? <Check className="w-3 h-3 text-[#2B7830]" /> : <Copy className="w-3 h-3" />}
                  <span>Pakai Contoh CSV</span>
                </button>
                <label className="notion-btn notion-btn-bordered text-[11px] cursor-pointer">
                  <Upload className="w-3 h-3 text-[#1F6FB6]" />
                  <span>Pilih File .CSV</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Error or Success indicator */}
            {csvError && (
              <div className="p-2 bg-[#FDEBEC] border border-[#E9E9E7] rounded text-xs text-[#DF5452]">
                {csvError}
              </div>
            )}
            {parsedCsvItems.length > 0 && (
              <div className="p-2 bg-[#E7F3E8] border border-[#E9E9E7] rounded text-xs text-[#2B7830] font-medium flex items-center justify-between">
                <span>✓ Berhasil membaca {parsedCsvItems.length} baris konten dari CSV!</span>
                <span className="text-[11px]">Siap ditambahkan ke database</span>
              </div>
            )}

            {/* Textarea */}
            <div>
              <label className="block text-[11px] font-semibold text-[#787774] mb-1">
                Teks CSV (Comma Separated Values):
              </label>
              <textarea
                rows={7}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="no,kategori,judul,copywriting,ambience,caption,platform,executed&#10;61,Edukasi,Judul konten,&quot;Teks copywriting...&quot;,&quot;Arahan visual...&quot;,&quot;Caption...&quot;,Instagram Feed,false"
                className="w-full text-xs font-mono py-2 px-2.5 rounded border border-[#E9E9E7] bg-[#F7F6F3] focus:bg-white focus:outline-none focus:border-[#1F6FB6]"
              />
            </div>

            {/* Preview Detected Items */}
            {parsedCsvItems.length > 0 && (
              <div className="border border-[#E9E9E7] rounded max-h-36 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#F7F6F3] text-[#787774] sticky top-0">
                    <tr>
                      <th className="p-1.5">#No</th>
                      <th className="p-1.5">Kategori</th>
                      <th className="p-1.5">Judul</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E9E7]">
                    {parsedCsvItems.map((it, idx) => (
                      <tr key={idx} className="hover:bg-[#F7F6F3]">
                        <td className="p-1.5 font-mono">#{it.no}</td>
                        <td className="p-1.5">{it.kategori}</td>
                        <td className="p-1.5 font-medium truncate max-w-xs">{it.judul}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="notion-btn notion-btn-bordered text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchCsvSubmit}
                disabled={parsedCsvItems.length === 0 || isSubmitting}
                className="notion-btn notion-btn-primary text-xs disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Mengimpor..." : `Tambahkan ${parsedCsvItems.length} Konten dari CSV`}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
