"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Save, 
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  Upload,
  Copy,
  Check,
  Download,
  Plus,
  PenLine
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
        judul: x.judul || "Ide Konten Baru",
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
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal max-w-2xl max-h-[92dvh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="modal-title">
              {isEditing ? "Edit Konten" : "Tambah Konten Baru"}
            </h2>
            <span className="badge bg-subtle text-muted">
              {isEditing ? "Mode Edit" : activeMode === "manual" ? "1 Konten" : "Import Batch"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Tutup modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Mode Tabs (Only when adding new content) */}
        {!isEditing && (
          <div className="shrink-0 border-b border-line bg-surface px-4 sm:px-5 py-2.5">
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-subtle p-1">
              <button
                type="button"
                onClick={() => setActiveMode("manual")}
                className={`btn px-2.5 py-2 text-xs ${
                  activeMode === "manual"
                    ? "bg-canvas text-ink shadow-xs"
                    : "btn-ghost text-muted hover:text-ink"
                }`}
              >
                <PenLine className="size-3.5 shrink-0" />
                <span className="truncate">Manual</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("batch-json")}
                className={`btn px-2.5 py-2 text-xs ${
                  activeMode === "batch-json"
                    ? "bg-canvas text-ink shadow-xs"
                    : "btn-ghost text-muted hover:text-ink"
                }`}
              >
                <FileCode className="size-3.5 text-brand shrink-0" />
                <span className="truncate">Batch JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("batch-csv")}
                className={`btn px-2.5 py-2 text-xs ${
                  activeMode === "batch-csv"
                    ? "bg-canvas text-ink shadow-xs"
                    : "btn-ghost text-muted hover:text-ink"
                }`}
              >
                <FileSpreadsheet className="size-3.5 text-success shrink-0" />
                <span className="truncate">Batch CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Manual Form */}
        {activeMode === "manual" && (
          <form onSubmit={handleManualSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="modal-body space-y-4">
              {manualError && (
                <div className="notice notice-danger">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              {/* Status Eksekusi Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-3">
                <label className="flex cursor-pointer select-none items-center gap-2.5 text-xs font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.executed)}
                    onChange={(e) => setFormData({ ...formData, executed: e.target.checked })}
                    className="checkbox"
                  />
                  <span>Tandai konten ini sudah dieksekusi / ditayangkan</span>
                </label>
                <span
                  className={`badge ${
                    formData.executed ? "bg-success-soft text-success" : "bg-subtle text-muted"
                  }`}
                >
                  {formData.executed ? "Sudah Selesai" : "Belum Dieksekusi"}
                </span>
              </div>

              {/* Row 1: Kategori, Platform */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-7">
                  <label className="field-label">Kategori</label>
                  <input
                    type="text"
                    list="category-options"
                    value={formData.kategori || ""}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    placeholder="Contoh: Edukasi & Spesifikasi"
                    className="input"
                    required
                  />
                  <datalist id="category-options">
                    {existingCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-5">
                  <label className="field-label">Format Media</label>
                  <select
                    value={formData.platform || "Instagram Feed"}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                    className="input cursor-pointer"
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
                <label className="field-label">
                  Judul Konten <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.judul || ""}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Masukkan topik atau headline ide konten..."
                  className="input font-medium"
                  required
                />
              </div>

              {/* Copywriting */}
              <div>
                <label className="field-label">
                  Teks Visual Feed (Copywriting) <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.copywriting || ""}
                  onChange={(e) => setFormData({ ...formData, copywriting: e.target.value })}
                  placeholder="Tuliskan teks yang akan ditampilkan pada desain visual feed..."
                  className="textarea"
                  required
                />
              </div>

              {/* Ambience & Caption Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">Arahan Visual / Ambience</label>
                  <textarea
                    rows={3}
                    value={formData.ambience || ""}
                    onChange={(e) => setFormData({ ...formData, ambience: e.target.value })}
                    placeholder="Contoh: Background clean neon, smartphone di tangan..."
                    className="textarea"
                  />
                </div>

                <div>
                  <label className="field-label">Caption Instagram</label>
                  <textarea
                    rows={3}
                    value={formData.caption || ""}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    placeholder="Caption postingan Instagram..."
                    className="textarea"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                <Save className="size-4" />
                <span>{isSubmitting ? "Menyimpan..." : "Simpan Konten"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Batch JSON */}
        {activeMode === "batch-json" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="modal-body space-y-4">
              {/* Helper Bar */}
              <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink">Import Sekaligus via JSON</p>
                  <p className="text-xs text-muted">Upload berkas .json atau tempel array objek di bawah.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setJsonInput(SAMPLE_JSON_TEMPLATE);
                      setCopiedJsonTemplate(true);
                      setTimeout(() => setCopiedJsonTemplate(false), 2000);
                    }}
                    className="btn btn-secondary text-xs"
                  >
                    {copiedJsonTemplate ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                    <span>Gunakan Contoh</span>
                  </button>
                  <label className="btn btn-secondary cursor-pointer text-xs">
                    <Upload className="size-3.5 text-brand" />
                    <span>Pilih Berkas .json</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleJsonFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Status Notice */}
              {jsonError && (
                <div className="notice notice-danger">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}
              {parsedJsonItems.length > 0 && (
                <div className="notice notice-success items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 shrink-0" />
                    <span className="font-medium">
                      Terbaca {parsedJsonItems.length} ide konten valid siap diimpor.
                    </span>
                  </div>
                  <span className="badge bg-success/20 text-success">Siap</span>
                </div>
              )}

              {/* Textarea */}
              <div>
                <label className="field-label">Teks JSON (Array of Objects)</label>
                <textarea
                  rows={6}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='[ { "no": 61, "kategori": "Edukasi & Spesifikasi", "judul": "Judul konten...", "copywriting": "Teks feed...", "caption": "Caption..." } ]'
                  className="textarea font-mono text-xs"
                />
              </div>

              {/* Preview Table */}
              {parsedJsonItems.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-line">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr>
                        <th className="th w-36">Kategori</th>
                        <th className="th">Judul Konten</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedJsonItems.map((it, idx) => (
                        <tr key={idx} className="hover:bg-subtle transition-colors">
                          <td className="td text-muted">{it.kategori}</td>
                          <td className="td font-medium text-ink truncate max-w-xs">{it.judul}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchJsonSubmit}
                disabled={parsedJsonItems.length === 0 || isSubmitting}
                className="btn btn-primary"
              >
                <Plus className="size-4" />
                <span>
                  {isSubmitting
                    ? "Mengimpor..."
                    : `Tambahkan ${parsedJsonItems.length} Konten (Batch)`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Batch CSV */}
        {activeMode === "batch-csv" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="modal-body space-y-4">
              {/* Helper Bar */}
              <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink">Import Data CSV / Excel</p>
                  <p className="text-xs text-muted">
                    Kolom: <span className="font-mono text-ink">no, kategori, judul, copywriting, ambience, caption, executed</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSampleCSV}
                    className="btn btn-secondary text-xs"
                    title="Unduh file template CSV"
                  >
                    <Download className="size-3.5 text-success" />
                    <span>Download Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvInput(SAMPLE_CSV_TEMPLATE);
                      setCopiedCsvTemplate(true);
                      setTimeout(() => setCopiedCsvTemplate(false), 2000);
                    }}
                    className="btn btn-secondary text-xs"
                  >
                    {copiedCsvTemplate ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                    <span>Gunakan Contoh</span>
                  </button>
                  <label className="btn btn-secondary cursor-pointer text-xs">
                    <Upload className="size-3.5 text-brand" />
                    <span>Pilih Berkas .csv</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Status Notice */}
              {csvError && (
                <div className="notice notice-danger">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}
              {parsedCsvItems.length > 0 && (
                <div className="notice notice-success items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 shrink-0" />
                    <span className="font-medium">
                      Terbaca {parsedCsvItems.length} baris data valid siap diimpor.
                    </span>
                  </div>
                  <span className="badge bg-success/20 text-success">Siap</span>
                </div>
              )}

              {/* Textarea */}
              <div>
                <label className="field-label">Teks Format CSV (Comma / Semicolon Separated)</label>
                <textarea
                  rows={6}
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder="no,kategori,judul,copywriting,ambience,caption,platform,executed"
                  className="textarea font-mono text-xs"
                />
              </div>

              {/* Preview Table */}
              {parsedCsvItems.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-line">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr>
                        <th className="th w-36">Kategori</th>
                        <th className="th">Judul Konten</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedCsvItems.map((it, idx) => (
                        <tr key={idx} className="hover:bg-subtle transition-colors">
                          <td className="td text-muted">{it.kategori}</td>
                          <td className="td font-medium text-ink truncate max-w-xs">{it.judul}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchCsvSubmit}
                disabled={parsedCsvItems.length === 0 || isSubmitting}
                className="btn btn-primary"
              >
                <Plus className="size-4" />
                <span>
                  {isSubmitting
                    ? "Mengimpor..."
                    : `Tambahkan ${parsedCsvItems.length} Konten (Batch)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
