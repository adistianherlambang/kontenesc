"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileSpreadsheet,
  Upload,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Download,
  ClipboardPaste,
  Image as ImageIcon,
  X,
} from "lucide-react";
import Modal from "./Modal";
import { generateTocoExcel, TocoProductRow } from "@/lib/tocoExcelHelper";

interface ToccoExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UnitImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  uploadedUrl?: string;
  isUploading?: boolean;
}

interface UnitState {
  index: number;
  data: TocoProductRow;
  sku: string;
  judul: string;
  images: UnitImageItem[];
}

const SAMPLE_JSON = `[
  {
    "Main Category": "handphone-tablet",
    "Sub Category 1": "handphone",
    "Sub Category 2": "android-os",
    "Judul": "Samsung Galaxy A07 5G 4/128GB Layar 6.7” 90Hz Kamera 50MP Baterai 5000mAh Garansi Resmi 1 Tahun",
    "Deskripsi": "Produk dijamin 100% original dan baru bergaransi resmi SAMSUNG Indonesia 1 tahun.",
    "Harga": 2399000,
    "Harga Diskon": "",
    "SKU": "ANDROID-SAMSUNG-A07 5G-4/128",
    "Jenis Produk": "Buy Now",
    "Total Stok": 10,
    "Kondisi Barang": "Baru",
    "Berat Produk": 500,
    "Status Produk": "Aktif",
    "Length": 18,
    "Height": 6,
    "Width": 10
  }
]`;

export default function ToccoExcelModal({
  isOpen,
  onClose,
}: ToccoExcelModalProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [units, setUnits] = useState<UnitState[]>([]);
  const [activeUnitPasteIdx, setActiveUnitPasteIdx] = useState<number | null>(null);
  const lastPasteTimestampRef = useRef<number>(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parse JSON input whenever it changes
  useEffect(() => {
    if (!jsonInput.trim()) {
      setUnits([]);
      setJsonError(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const arr = Array.isArray(parsed) ? parsed : [parsed];

      if (arr.length === 0) {
        setJsonError("Array JSON kosong.");
        setUnits([]);
        return;
      }

      setUnits((prevUnits) => {
        return arr.map((item: any, idx: number) => {
          const sku =
            item.SKU ||
            item.sku ||
            `UNIT-${idx + 1}`;
          const judul =
            item.Judul ||
            item.judul ||
            item.nama ||
            item.title ||
            `Unit ${idx + 1}`;

          const existing = prevUnits[idx];
          const images = existing && existing.sku === sku ? existing.images : [];

          return {
            index: idx,
            data: item,
            sku,
            judul,
            images,
          };
        });
      });
      setJsonError(null);
    } catch (err: any) {
      setJsonError("Format JSON belum valid: " + err.message);
      setUnits([]);
    }
  }, [jsonInput]);

  // Global paste handler to capture pasted images for the active or first unit
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Debounce rapid duplicate paste events (within 300ms)
      const now = Date.now();
      if (now - lastPasteTimestampRef.current < 300) {
        return;
      }

      // If user is typing/pasting into an input or textarea, check if text is being pasted
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLInputElement
      ) {
        const text = e.clipboardData?.getData("text/plain");
        if (text && text.trim().length > 0) {
          // Allow normal text pasting into textarea/input
          return;
        }
      }

      // Extract image files from clipboard
      let imageFiles: File[] = [];

      // 1. Check e.clipboardData.files first
      const rawFiles = e.clipboardData?.files;
      if (rawFiles && rawFiles.length > 0) {
        for (let i = 0; i < rawFiles.length; i++) {
          if (rawFiles[i].type.startsWith("image/")) {
            imageFiles.push(rawFiles[i]);
          }
        }
      }

      // 2. Fallback to clipboardData.items if no files found
      // Note: A single clipboard copy often exposes multiple MIME types (e.g. image/png and image/jpeg).
      // We must only take 1 image file to prevent duplicate entries!
      if (imageFiles.length === 0 && e.clipboardData?.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const file = items[i].getAsFile();
            if (file) {
              imageFiles.push(file);
              break; // Prevent adding secondary format representation of the same image
            }
          }
        }
      }

      if (imageFiles.length === 0) return;

      const targetUnitIdx =
        activeUnitPasteIdx !== null && activeUnitPasteIdx < units.length
          ? activeUnitPasteIdx
          : 0;

      if (units.length > 0 && targetUnitIdx >= 0) {
        lastPasteTimestampRef.current = now;
        e.preventDefault();
        addFilesToUnit(targetUnitIdx, imageFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, activeUnitPasteIdx, units.length]);

  const addFilesToUnit = (unitIdx: number, newFiles: File[]) => {
    if (!newFiles || newFiles.length === 0) return;

    // Create unique item representations outside setUnits (avoid duplicate createObjectURL calls)
    const newItems: UnitImageItem[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setUnits((prev) => {
      const target = prev[unitIdx];
      if (!target) return prev;

      const remainingSlots = 5 - target.images.length;
      if (remainingSlots <= 0) return prev;

      const itemsToAdd = newItems.slice(0, remainingSlots);

      // Pure immutable update: never mutate target or prev
      return prev.map((u, i) => {
        if (i !== unitIdx) return u;
        return {
          ...u,
          images: [...u.images, ...itemsToAdd],
        };
      });
    });
  };

  const removeImageFromUnit = (unitIdx: number, imgIdx: number) => {
    setUnits((prev) => {
      const target = prev[unitIdx];
      if (!target) return prev;

      const removed = target.images[imgIdx];
      if (removed?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      // Pure immutable update
      return prev.map((u, i) => {
        if (i !== unitIdx) return u;
        return {
          ...u,
          images: u.images.filter((_, idx) => idx !== imgIdx),
        };
      });
    });
  };

  const handleUseSample = () => {
    setJsonInput(SAMPLE_JSON);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleProcessAndDownload = async () => {
    if (units.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "";

      // Step 1: Upload all pending images to R2
      const updatedRows: TocoProductRow[] = [];

      for (let uIdx = 0; uIdx < units.length; uIdx++) {
        const unit = units[uIdx];
        const rowData = { ...unit.data };

        setProcessStatus(
          `Mengunggah gambar unit ${uIdx + 1}/${units.length} (${unit.sku})...`
        );

        for (let imgIdx = 0; imgIdx < unit.images.length; imgIdx++) {
          const imgItem = unit.images[imgIdx];
          const slotKey = `Foto ${imgIdx + 1}` as keyof TocoProductRow;

          if (imgItem.uploadedUrl) {
            rowData[slotKey] = imgItem.uploadedUrl;
            continue;
          }

          if (imgItem.file) {
            const formData = new FormData();
            formData.append("file", imgItem.file);
            formData.append("sku", unit.sku);
            formData.append("index", String(imgIdx + 1));

            const res = await fetch("/api/r2/upload", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              const errJson = await res.json().catch(() => ({}));
              throw new Error(
                errJson.error ||
                  `Gagal mengunggah foto ${imgIdx + 1} untuk SKU ${unit.sku}`
              );
            }

            const data = await res.json();
            const forwardedUrl = `${origin}${data.path}`;
            imgItem.uploadedUrl = forwardedUrl;
            rowData[slotKey] = forwardedUrl;
          }
        }

        updatedRows.push(rowData);
      }

      // Step 2: Fetch template Excel file
      setProcessStatus("Menyiapkan berkas toco_bulk_upload_template.xlsx...");
      const tplRes = await fetch("/toco_bulk_upload_template.xlsx");
      if (!tplRes.ok) {
        throw new Error(
          "Gagal memuat template Excel toco_bulk_upload_template.xlsx dari server."
        );
      }
      const tplBuffer = await tplRes.arrayBuffer();

      // Step 3: Inject rows into template
      setProcessStatus("Menyusun data ke dalam Excel...");
      const excelBytes = await generateTocoExcel(tplBuffer, updatedRows);

      // Step 4: Trigger instant download
      const blob = new Blob([excelBytes as any], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "toco_bulk_upload_template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage(
        `Berhasil! File Excel dengan ${units.length} unit berhasil diunduh.`
      );
    } catch (err: any) {
      console.error("Excel generation error:", err);
      setErrorMessage(
        err?.message || "Terjadi kesalahan saat memproses data dan Excel."
      );
    } finally {
      setIsProcessing(false);
      setProcessStatus("");
    }
  };

  const totalImagesCount = useMemo(() => {
    return units.reduce((acc, u) => acc + u.images.length, 0);
  }, [units]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title="JSON ke Excel Toco"
      closeButtonAriaLabel="Tutup modal"
    >
      <Modal.Body className="space-y-4">
        {/* Step 1: Input JSON */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="field-label mb-0">
              Paste JSON Hasil Prompt Tocco <span className="text-danger">*</span>
            </label>
            <button
              type="button"
              onClick={handleUseSample}
              className="text-xs text-brand hover:underline cursor-pointer"
            >
              Gunakan Contoh JSON
            </button>
          </div>
          <textarea
            rows={5}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Tempel (paste) array JSON produk tocco di sini..."
            className="textarea text-xs"
          />
        </div>

        {jsonError && (
          <div className="notice notice-danger">
            <AlertCircle className="size-4 shrink-0" />
            <span>{jsonError}</span>
          </div>
        )}

        {units.length > 0 && (
          <div className="notice notice-success">
            <Check className="size-4 shrink-0" />
            <span className="font-medium">
              Terdeteksi {units.length} unit produk siap diisi gambar.
            </span>
          </div>
        )}

        {/* Step 2: Input Gambar per Unit */}
        {units.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="field-label mb-0">
                Gambar per Unit (Maks. 5 Foto per Unit)
              </label>
              <span className="text-xs text-muted">
                {totalImagesCount} foto dipilih
              </span>
            </div>

            <div className="space-y-3 max-h-[50dvh] overflow-y-auto pr-1">
              {units.map((unit, uIdx) => {
                const isSelected = activeUnitPasteIdx === uIdx;
                const canAddMore = unit.images.length < 5;

                return (
                  <div
                    key={uIdx}
                    onClick={() => setActiveUnitPasteIdx(uIdx)}
                    className={`rounded-xl border p-3.5 transition-colors ${
                      isSelected
                        ? "border-brand bg-brand-soft/20"
                        : "border-line bg-surface"
                    }`}
                  >
                    {/* Header Unit */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center size-5 rounded-full bg-ink text-white text-[11px] font-bold shrink-0">
                            {uIdx + 1}
                          </span>
                          <p className="truncate text-xs font-semibold text-ink">
                            {unit.judul}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted mt-0.5 truncate">
                          SKU: <span className="font-medium text-ink">{unit.sku}</span>
                          {unit.data.Harga ? ` • Rp ${Number(unit.data.Harga).toLocaleString("id-ID")}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <label
                          className={`btn btn-secondary text-xs py-1 px-2.5 min-h-[32px] cursor-pointer ${
                            !canAddMore ? "opacity-50 pointer-events-none" : ""
                          }`}
                          title="Pilih berkas dari folder"
                        >
                          <Upload className="size-3.5 text-brand" />
                          <span>Pilih Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={!canAddMore}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                addFilesToUnit(uIdx, files);
                              }
                              e.target.value = "";
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Slots Gambar 1-5 */}
                    <div className="grid grid-cols-5 gap-2">
                      {[0, 1, 2, 3, 4].map((slotIdx) => {
                        const img = unit.images[slotIdx];

                        return (
                          <div
                            key={slotIdx}
                            className="relative aspect-square rounded-lg border border-dashed border-line bg-canvas flex flex-col items-center justify-center p-1 overflow-hidden group/slot"
                          >
                            {img ? (
                              <>
                                <img
                                  src={img.previewUrl}
                                  alt={`Foto ${slotIdx + 1}`}
                                  className="size-full object-cover rounded-md"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImageFromUnit(uIdx, slotIdx);
                                  }}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-danger transition-colors cursor-pointer"
                                  title="Hapus foto"
                                >
                                  <X className="size-3" />
                                </button>
                                <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[9px] bg-black/60 text-white font-medium">
                                  Foto {slotIdx + 1}
                                </span>
                              </>
                            ) : (
                              <label
                                className={`size-full flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-subtle ${
                                  !canAddMore ? "opacity-30 cursor-not-allowed" : ""
                                }`}
                              >
                                <ImageIcon className="size-4 text-faint mb-1" />
                                <span className="text-[10px] text-faint">
                                  Foto {slotIdx + 1}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={!canAddMore}
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length > 0) {
                                      addFilesToUnit(uIdx, files);
                                    }
                                    e.target.value = "";
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[11px] text-muted">
                      <span>
                        Tips: Klik kartu ini lalu tekan{" "}
                        <kbd className="px-1 py-0.5 rounded bg-subtle border border-line text-[10px] font-mono">
                          Ctrl+V
                        </kbd>{" "}
                        /{" "}
                        <kbd className="px-1 py-0.5 rounded bg-subtle border border-line text-[10px] font-mono">
                          ⌘+V
                        </kbd>{" "}
                        untuk paste gambar langsung dari clipboard.
                      </span>
                      <span className="font-medium shrink-0">
                        {unit.images.length}/5 foto
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notices */}
        {errorMessage && (
          <div className="notice notice-danger">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="notice notice-success">
            <Check className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isProcessing && (
          <div className="notice notice-info flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-brand" />
            <span>{processStatus}</span>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="btn btn-secondary"
        >
          Tutup
        </button>

        <button
          type="button"
          onClick={handleProcessAndDownload}
          disabled={units.length === 0 || isProcessing}
          className="btn btn-primary"
        >
          {isProcessing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="size-4" />
          )}
          <span>
            {isProcessing ? "Memproses..." : "Upload & Unduh Excel (.xlsx)"}
          </span>
        </button>
      </Modal.Footer>
    </Modal>
  );
}

