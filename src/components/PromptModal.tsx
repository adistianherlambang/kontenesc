"use client";

import React, { useState, useMemo, useRef } from "react";
import { Copy, Check, Upload, Trash2, AlertCircle, Loader2 } from "lucide-react";
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
  const [kategori, setKategori] = useState("");
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [count, setCount] = useState<number | "">(10);
  const [startNo, setStartNo] = useState<number>(nextSuggestedNo);

  const [priceResult, setPriceResult] = useState<ExtractResult | null>(null);
  const [isExtractingPrice, setIsExtractingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (nextSuggestedNo) {
      setStartNo(nextSuggestedNo);
    }
  }, [nextSuggestedNo, isOpen]);

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
          "Gagal membaca berkas harga. Pastikan berkas berformat .doc atau .docx daftar harga yang valid."
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

  const numCount = typeof count === "number" ? count : parseInt(count as string) || 0;
  const isFormComplete = Boolean(
    kategori.trim().length > 0 &&
    Boolean(format) &&
    numCount > 0 &&
    priceResult !== null
  );

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
        {/* Baris 1: [Kategori Target, Format File, Jumlah Target Konten] */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-6">
            <label className="field-label">
              Kategori Target <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              list="prompt-category-options"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              placeholder="Contoh: Edukasi, Tablet, Servis..."
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

          <div className="sm:col-span-3">
            <label className="field-label">
              Format File <span className="text-danger">*</span>
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "json" | "csv")}
              className="input cursor-pointer"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>

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

        {/* Baris 2: [Upload Harga Terbaru (Lewat Tools Harga to JSON)] */}
        <div>
          <label className="field-label">
            Harga Terbaru (.doc / .docx) <span className="text-danger">*</span>
          </label>
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {priceResult ? (
                <>
                  <p className="truncate text-xs font-semibold text-ink">
                    {priceResult.fileName}
                  </p>
                  <p className="text-xs text-success">
                    Terbaca {priceResult.totalUnits} unit dari {priceResult.data.length} merk
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-ink">
                    Pilih Dokumen Daftar Harga
                  </p>
                  <p className="text-xs text-muted">
                    Unggah berkas .doc atau .docx untuk diekstrak otomatis ke prompt.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {priceResult && (
                <button
                  type="button"
                  onClick={handleRemovePrice}
                  className="btn btn-secondary text-xs text-danger hover:bg-danger-soft"
                  title="Hapus berkas harga"
                >
                  <Trash2 className="size-3.5" />
                  <span>Hapus</span>
                </button>
              )}
              <label className="btn btn-secondary cursor-pointer text-xs">
                {isExtractingPrice ? (
                  <Loader2 className="size-3.5 animate-spin text-brand" />
                ) : (
                  <Upload className="size-3.5 text-brand" />
                )}
                <span>
                  {isExtractingPrice
                    ? "Memproses..."
                    : priceResult
                      ? "Ganti Berkas"
                      : "Pilih Berkas .doc / .docx"}
                </span>
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
        </div>

        {priceError && (
          <div className="notice notice-danger">
            <AlertCircle className="size-4 shrink-0" />
            <span>{priceError}</span>
          </div>
        )}

        {/* Teks Prompt Siap Salin (Hanya muncul setelah semua form diisi) */}
        {isFormComplete && (
          <div>
            <label className="field-label">Teks Prompt Siap Salin</label>
            <textarea
              rows={10}
              readOnly
              value={promptOutput}
              className="textarea text-xs"
            />
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
        >
          Batal
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
