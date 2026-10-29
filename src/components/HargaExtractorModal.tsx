"use client";

import React, { useState, useRef } from "react";
import { 
  FileCode2, 
  Upload, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  FileText, 
  Loader2, 
  Sparkles,
  Layers
} from "lucide-react";
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setError(null);
    setResult(null);
    setCopied(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      setError(err?.message || "Gagal mengekstrak data dari dokumen. Pastikan file berformat .doc atau .docx daftar harga yang valid.");
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
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
      onClose={() => {
        resetState();
        onClose();
      }}
      maxWidth="3xl"
      title="Harga to JSON Extractor"
      titleIcon={<FileCode2 className="size-5 text-brand shrink-0" />}
      titleBadge={
        <span className="badge bg-brand-soft text-brand text-[11px] font-semibold">
          Client-Side Parser
        </span>
      }
      headerExtra={
        result && (
          <button
            type="button"
            onClick={resetState}
            className="btn btn-ghost btn-icon text-muted hover:text-ink"
            title="Upload file lain"
          >
            <RefreshCw className="size-4" />
          </button>
        )
      }
    >
      <Modal.Body className="space-y-4 max-h-[75dvh] overflow-y-auto p-4 sm:p-6">
        {/* Upload Zone (when no result yet) */}
        {!result && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-brand bg-brand-soft/40 scale-[0.99]"
                  : "border-line-strong hover:border-brand/60 bg-surface/40 hover:bg-surface"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="size-14 rounded-2xl bg-white border border-line shadow-xs flex items-center justify-center text-brand">
                  {isExtracting ? (
                    <Loader2 className="size-7 animate-spin text-brand" />
                  ) : (
                    <Upload className="size-7" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-ink">
                    {isExtracting
                      ? "Mengekstrak data harga..."
                      : "Pilih atau Tarik File Dokumen (.docx / .doc)"}
                  </p>
                  <p className="text-xs text-muted mt-1 max-w-md mx-auto">
                    Mendukung file Microsoft Word daftar harga Semarang Cell (.doc format OLE & .docx OpenXML). Proses berjalan 100% di browser tanpa upload ke server.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="badge bg-white border border-line text-muted">.docx</span>
                  <span className="badge bg-white border border-line text-muted">.doc</span>
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Otomatis Filter Strikethrough
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="notice notice-danger">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold">Ekstraksi Gagal</p>
                  <p className="mt-0.5 text-danger/90">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results View */}
        {result && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-line bg-surface">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
                  {result.format}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink truncate max-w-xs sm:max-w-md">
                    {result.fileName}
                  </p>
                  <p className="text-[11px] text-muted">
                    Total: <strong className="text-ink">{result.totalUnits}</strong> unit hp & aksesoris · <strong className="text-ink">{result.data.length}</strong> merk
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="btn btn-secondary text-xs px-3 py-1.5 min-h-[36px]"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-success" />
                      <span className="text-success font-semibold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Salin JSON</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="btn btn-primary text-xs px-3.5 py-1.5 min-h-[36px]"
                >
                  <Download className="size-3.5" />
                  <span>Unduh .json</span>
                </button>
              </div>
            </div>

            {/* Merk Pills Summary */}
            <div className="flex flex-wrap items-center gap-1.5">
              {result.data.map((b) => (
                <span
                  key={b.merk}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-line bg-white shadow-2xs"
                >
                  <span className="font-semibold text-ink">{b.merk}</span>
                  <span className="text-[11px] text-muted bg-subtle px-1.5 py-0.2 rounded">
                    {b.detail.length}
                  </span>
                </span>
              ))}
            </div>

            {/* JSON Code Box */}
            <div className="relative rounded-xl border border-line bg-[#18181B] text-zinc-200 overflow-hidden shadow-inner">
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80 text-[11px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-500/80" />
                    <span className="size-2.5 rounded-full bg-amber-500/80" />
                    <span className="size-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span>harga.json</span>
                </div>
                <span>{result.data.length} Merk ({result.totalUnits} items)</span>
              </div>

              <pre className="p-4 text-xs font-mono max-h-[320px] overflow-auto leading-relaxed scrollbar-thin text-zinc-300">
                <code>{jsonString}</code>
              </pre>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
