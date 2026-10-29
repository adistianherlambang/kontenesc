"use client";

import React, { useState, useRef } from "react";
import { Upload, Copy, Check, Download, AlertCircle, Loader2 } from "lucide-react";
import Modal from "./Modal";
import { extractHargaFromBuffer, ExtractResult } from "@/lib/extractHarga";

interface HargaExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HargaExtractorModal({
  isOpen,
  onClose
}: HargaExtractorModalProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setError(null);
    setResult(null);
    setCopied(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleProcessFile = async (file: File) => {
    if (!file) return;
    setError(null);
    setIsExtracting(true);

    try {
      const buffer = await file.arrayBuffer();
      const extracted = await extractHargaFromBuffer(buffer, file.name);
      setResult(extracted);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setError(
        err?.message ||
          "Gagal mengekstrak data dari dokumen. Pastikan berkas berformat .doc atau .docx daftar harga yang valid."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const jsonString = result ? JSON.stringify(result.data, null, 2) : "";

  const handleCopyJson = async () => {
    if (!jsonString) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(jsonString);
      } else {
        const ta = document.createElement("textarea");
        ta.value = jsonString;
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

  const handleDownloadJson = () => {
    if (!jsonString) return;
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = result?.fileName ? result.fileName.replace(/\.[^/.]+$/, "") : "harga";
    a.download = `${baseName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="2xl"
      title="Harga to JSON"
      closeButtonAriaLabel="Tutup modal"
    >
      <Modal.Body className="space-y-4">
        {/* Helper Bar */}
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-ink">Ekstrak Daftar Harga (.doc / .docx)</p>
            <p className="text-xs text-muted">
              Pilih berkas dokumen daftar harga untuk diubah ke format JSON.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <label className="btn btn-secondary cursor-pointer text-xs">
              {isExtracting ? (
                <Loader2 className="size-3.5 animate-spin text-brand" />
              ) : (
                <Upload className="size-3.5 text-brand" />
              )}
              <span>{isExtracting ? "Memproses..." : "Pilih Berkas .doc / .docx"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                disabled={isExtracting}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Status Notice */}
        {error && (
          <div className="notice notice-danger">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="notice notice-success">
            <Check className="size-4 shrink-0" />
            <span className="font-medium">
              Terbaca {result.totalUnits} unit dari {result.data.length} merk ({result.fileName}).
            </span>
          </div>
        )}

        {/* JSON Textarea */}
        <div>
          <label className="field-label">Hasil JSON</label>
          <textarea
            rows={10}
            readOnly
            value={jsonString}
            placeholder="Pilih berkas .doc atau .docx untuk melihat hasil ekstraksi JSON..."
            className="textarea text-xs"
          />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={handleClose}
          className="btn btn-secondary"
        >
          Tutup
        </button>
        <button
          type="button"
          onClick={handleDownloadJson}
          disabled={!result}
          className="btn btn-secondary"
        >
          <Download className="size-4" />
          <span>Unduh .json</span>
        </button>
        <button
          type="button"
          onClick={handleCopyJson}
          disabled={!result}
          className="btn btn-primary"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span>{copied ? "Tersalin" : "Salin JSON"}</span>
        </button>
      </Modal.Footer>
    </Modal>
  );
}
