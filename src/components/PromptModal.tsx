"use client";

import React, { useState, useMemo, useRef } from "react";
import { Copy, Check, Upload, Trash2, AlertCircle, Loader2, Sparkles, FileText } from "lucide-react";
import Modal from "./Modal";
import { extractHargaFromBuffer, ExtractResult } from "@/lib/extractHarga";
import { generateContentPrompt } from "@/lib/promptHelper";

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCategories?: string[];
  nextSuggestedNo?: number;
}

export default function PromptModal({
  isOpen,
  onClose,
  existingCategories = [],
  nextSuggestedNo = 61
}: PromptModalProps) {
  // Section 1 State: [kategori target, format file, jumlah target konten] (Wajib)
  const [kategori, setKategori] = useState("");
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [count, setCount] = useState<number | "">(10);
  const [startNo, setStartNo] = useState<number>(nextSuggestedNo);

  // Section 2 State: [upload harga terbaru (lewat tools harga to json)] (Wajib)
  const [priceResult, setPriceResult] = useState<ExtractResult | null>(null);
  const [isExtractingPrice, setIsExtractingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy State
  const [copied, setCopied] = useState(false);

  // Sync starting number if nextSuggestedNo changes
  React.useEffect(() => {
    if (nextSuggestedNo) {
      setStartNo(nextSuggestedNo);
    }
  }, [nextSuggestedNo, isOpen]);

  // Handle Price File Upload (.doc / .docx)
  const handlePriceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPriceError(null);
    setIsExtractingPrice(true);

    try {
      const buffer = await file.arrayBuffer();
      const extracted = await extractHargaFromBuffer(buffer, file.name);
      setPriceResult(extracted);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setPriceError(
        err?.message ||
          "Gagal membaca file harga. Pastikan file berformat .doc atau .docx daftar harga yang valid."
      );
    } finally {
      setIsExtractingPrice(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePrice = () => {
    setPriceResult(null);
    setPriceError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validation: Semua formulir wajib diisi
  const numCount = typeof count === "number" ? count : parseInt(count as string) || 0;
  const isFormComplete = Boolean(
    kategori.trim().length > 0 &&
    Boolean(format) &&
    numCount > 0 &&
    priceResult !== null
  );

  // Generate prompt string live based on current inputs (hanya bila form lengkap)
  const promptOutput = useMemo(() => {
    if (!isFormComplete) return "";

    return generateContentPrompt({
      kategori: kategori.trim(),
      format,
      count: numCount,
      startNo: Number(startNo) || 1,
      priceData: priceResult
    });
  }, [isFormComplete, kategori, format, numCount, startNo, priceResult]);

  const handleCopyPrompt = async () => {
    if (!isFormComplete || !promptOutput) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(promptOutput);
      } else {
        const ta = document.createElement("textarea");
        ta.value = promptOutput;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title="Buat Prompt"
      closeButtonAriaLabel="Tutup modal"
    >
      <Modal.Body className="space-y-4">
        {/* SECTION 1: [Kategori Target, Format File, Jumlah Target Konten] (Wajib) */}
        <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink">1. Target Konten & Format</p>
            <span className="text-[11px] text-faint">Wajib diisi</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            {/* Kategori Target */}
            <div className="sm:col-span-5">
              <label className="field-label">
                Kategori Target <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                list="prompt-category-options"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                placeholder="Misal: Edukasi, Tablet, Servis..."
                className="input"
                required
              />
              <datalist id="prompt-category-options">
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
                <option value="Edukasi & Spesifikasi" />
                <option value="Tablet & Aksesoris" />
                <option value="Rekomendasi HP" />
                <option value="Tips & Perawatan" />
                <option value="Promo & Tukar Tambah" />
                <option value="Trust & Brand" />
              </datalist>
            </div>

            {/* Format File (CSV atau JSON) */}
            <div className="sm:col-span-4">
              <label className="field-label">
                Format Output <span className="text-danger">*</span>
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as "json" | "csv")}
                className="input cursor-pointer"
              >
                <option value="json">Format JSON</option>
                <option value="csv">Format CSV</option>
              </select>
            </div>

            {/* Jumlah Target Konten */}
            <div className="sm:col-span-3">
              <label className="field-label">
                Jumlah Konten <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => {
                  const val = e.target.value;
                  setCount(val === "" ? "" : Math.max(1, parseInt(val) || 1));
                }}
                className="input"
                placeholder="10"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: [Upload Harga Terbaru (Lewat Tools Harga to JSON)] (Wajib) */}
        <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-ink">2. Upload Harga Terbaru</p>
                <span className="text-danger text-xs font-bold">*</span>
              </div>
              <p className="text-xs text-muted">
                Unggah berkas .doc atau .docx daftar harga untuk disertakan ke dalam prompt.
              </p>
            </div>

            <div className="shrink-0">
              <label className="btn btn-secondary cursor-pointer text-xs">
                {isExtractingPrice ? (
                  <Loader2 className="size-3.5 animate-spin text-brand" />
                ) : (
                  <Upload className="size-3.5 text-brand" />
                )}
                <span>{isExtractingPrice ? "Mengekstrak..." : "Pilih Berkas .doc / .docx"}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handlePriceFileChange}
                  disabled={isExtractingPrice}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {priceError && (
            <div className="notice notice-danger">
              <AlertCircle className="size-4 shrink-0" />
              <span>{priceError}</span>
            </div>
          )}

          {priceResult && (
            <div className="notice notice-success items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Check className="size-4 shrink-0" />
                <span className="font-medium truncate">
                  Terbaca {priceResult.totalUnits} unit dari {priceResult.data.length} merk ({priceResult.fileName})
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemovePrice}
                className="btn btn-ghost btn-icon text-muted hover:text-danger shrink-0 size-8 min-h-0 min-w-0"
                title="Hapus data harga"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* SECTION 3: Teks Prompt Siap Salin (Hanya muncul jika SEMUA form wajib terisi) */}
        {isFormComplete ? (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <label className="field-label mb-0 flex items-center gap-1.5 text-ink font-semibold">
                <Sparkles className="size-3.5 text-brand" />
                <span>Teks Prompt Siap Salin</span>
              </label>
              <span className="text-xs text-muted">
                {promptOutput.length} karakter
              </span>
            </div>

            <textarea
              rows={10}
              readOnly
              value={promptOutput}
              className="textarea text-xs leading-relaxed"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-surface/50 p-5 text-center">
            <p className="text-xs font-medium text-ink">
              Teks Prompt akan otomatis muncul di sini
            </p>
            <p className="text-[11px] text-muted mt-1 max-w-md mx-auto">
              Lengkapi formulir di atas: isi <strong>kategori target</strong>, tentukan <strong>format & jumlah</strong>, serta <strong>upload berkas harga terbaru (.doc / .docx)</strong>.
            </p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
        >
          Tutup
        </button>
        <button
          type="button"
          onClick={handleCopyPrompt}
          disabled={!isFormComplete}
          className="btn btn-primary"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span>{copied ? "Tersalin" : "Salin Prompt"}</span>
        </button>
      </Modal.Footer>
    </Modal>
  );
}
