"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileSpreadsheet,
  Upload,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  X,
  GripVertical,
  Plus,
} from "lucide-react";
import Modal from "./Modal";
import CustomSelect from "./CustomSelect";
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

const NUMERIC_KEYS = new Set([
  "Harga",
  "Harga Diskon",
  "Total Stok",
  "Berat Produk",
  "Length",
  "Height",
  "Width",
]);

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
  const [draggedItem, setDraggedItem] = useState<{ unitIdx: number; imgIdx: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ unitIdx: number; imgIdx: number } | null>(null);

  const isTypingJsonRef = useRef(false);
  const lastPasteTimestampRef = useRef<number>(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parse JSON input whenever it changes via user typing or sample button
  useEffect(() => {
    if (!isOpen) return;
    if (!isTypingJsonRef.current) return;

    if (!jsonInput.trim()) {
      setUnits([]);
      setJsonError(null);
      isTypingJsonRef.current = false;
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const arr = Array.isArray(parsed) ? parsed : [parsed];

      if (arr.length === 0) {
        setJsonError("Array JSON kosong.");
        setUnits([]);
        isTypingJsonRef.current = false;
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
            data: {
              "Main Category": item["Main Category"] || "handphone-tablet",
              "Sub Category 1": item["Sub Category 1"] || "handphone",
              "Sub Category 2": item["Sub Category 2"] || "android-os",
              "Jenis Produk": item["Jenis Produk"] || "Buy Now",
              "Kondisi Barang": item["Kondisi Barang"] || "Baru",
              "Status Produk": item["Status Produk"] || "Aktif",
              Preorder: item.Preorder || "Tidak",
              Length: item.Length ?? 18,
              Width: item.Width ?? 10,
              Height: item.Height ?? 6,
              "Berat Produk": item["Berat Produk"] ?? 500,
              "Total Stok": item["Total Stok"] ?? 10,
              ...item,
              SKU: sku,
              Judul: judul,
            },
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
    } finally {
      isTypingJsonRef.current = false;
    }
  }, [jsonInput, isOpen]);

  // Global paste handler to capture pasted images for the active unit
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Debounce rapid duplicate paste events (within 300ms)
      const now = Date.now();
      if (now - lastPasteTimestampRef.current < 300) {
        return;
      }

      // If user is pasting plain text into an input or textarea, let it pass through
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLInputElement
      ) {
        const text = e.clipboardData?.getData("text/plain");
        if (text && text.trim().length > 0) {
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

      return prev.map((u, i) => {
        if (i !== unitIdx) return u;
        return {
          ...u,
          images: u.images.filter((_, idx) => idx !== imgIdx),
        };
      });
    });
  };

  const reorderImages = (unitIdx: number, fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setUnits((prev) => {
      return prev.map((u, i) => {
        if (i !== unitIdx) return u;
        const newImages = [...u.images];
        if (fromIdx >= newImages.length) return u;
        const safeToIdx = Math.min(toIdx, newImages.length - 1);
        const [moved] = newImages.splice(fromIdx, 1);
        newImages.splice(safeToIdx, 0, moved);
        return {
          ...u,
          images: newImages,
        };
      });
    });
  };

  const handleUpdateUnitField = (
    unitIdx: number,
    field: string,
    value: any
  ) => {
    let formattedValue = value;
    if (NUMERIC_KEYS.has(field)) {
      if (value === "" || value === null || value === undefined) {
        formattedValue = "";
      } else {
        const num = Number(value);
        formattedValue = isNaN(num) ? value : num;
      }
    }

    setUnits((prev) => {
      const updated = prev.map((u, i) => {
        if (i !== unitIdx) return u;
        const updatedData = { ...u.data, [field]: formattedValue };
        return {
          ...u,
          sku: field === "SKU" ? String(formattedValue) : u.sku,
          judul: field === "Judul" ? String(formattedValue) : u.judul,
          data: updatedData,
        };
      });

      // Keep jsonInput in sync without triggering re-parse loop
      const updatedRaw = updated.map((u) => u.data);
      isTypingJsonRef.current = false;
      setJsonInput(JSON.stringify(updatedRaw, null, 2));

      return updated;
    });
  };

  const handleRemoveUnit = (unitIdx: number) => {
    setUnits((prev) => {
      const target = prev[unitIdx];
      if (target) {
        target.images.forEach((img) => {
          if (img.previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(img.previewUrl);
          }
        });
      }

      const updated = prev.filter((_, idx) => idx !== unitIdx);
      const updatedRaw = updated.map((u) => u.data);
      isTypingJsonRef.current = false;
      setJsonInput(updated.length > 0 ? JSON.stringify(updatedRaw, null, 2) : "");

      if (activeUnitPasteIdx === unitIdx) {
        setActiveUnitPasteIdx(null);
      } else if (activeUnitPasteIdx !== null && activeUnitPasteIdx > unitIdx) {
        setActiveUnitPasteIdx(activeUnitPasteIdx - 1);
      }

      return updated;
    });
  };

  const handleAddUnit = () => {
    const newIdx = units.length;
    const newRow: TocoProductRow = {
      "Main Category": "handphone-tablet",
      "Sub Category 1": "handphone",
      "Sub Category 2": "android-os",
      Judul: `Unit ${newIdx + 1}`,
      SKU: `ANDROID-BRAND-TIPE-${newIdx + 1}`,
      Deskripsi: "",
      Harga: 0,
      "Harga Diskon": "",
      "Jenis Produk": "Buy Now",
      "Total Stok": 10,
      "Kondisi Barang": "Baru",
      "Berat Produk": 500,
      "Status Produk": "Aktif",
      Length: 18,
      Height: 6,
      Width: 10,
      Preorder: "Tidak",
    };

    setUnits((prev) => {
      const nextUnits = [
        ...prev,
        {
          index: newIdx,
          data: newRow,
          sku: newRow.SKU!,
          judul: newRow.Judul!,
          images: [],
        },
      ];
      isTypingJsonRef.current = false;
      setJsonInput(JSON.stringify(nextUnits.map((u) => u.data), null, 2));
      setActiveUnitPasteIdx(newIdx);
      return nextUnits;
    });
  };

  const handleUseSample = () => {
    isTypingJsonRef.current = true;
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

        // Clean up remaining unused photo slots in rowData
        for (let emptySlot = unit.images.length + 1; emptySlot <= 10; emptySlot++) {
          delete rowData[`Foto ${emptySlot}`];
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

      setSuccessMessage("Excel berhasil diunduh.");
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title="JSON ke Excel Toco"
      closeButtonAriaLabel="Tutup modal"
    >
      <Modal.Body className="space-y-4">
        {/* Top: JSON Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-muted">
              JSON Hasil Prompt
            </label>
            {units.length === 0 && (
              <button
                type="button"
                onClick={handleUseSample}
                className="text-xs text-brand hover:underline font-medium cursor-pointer"
              >
                Gunakan Contoh JSON
              </button>
            )}
          </div>
          <textarea
            rows={units.length > 0 ? 2 : 4}
            value={jsonInput}
            onChange={(e) => {
              isTypingJsonRef.current = true;
              setJsonInput(e.target.value);
            }}
            placeholder="Paste JSON hasil prompt di sini..."
            className="textarea text-xs"
          />
        </div>

        {jsonError && (
          <div className="notice notice-danger">
            <AlertCircle className="size-4 shrink-0" />
            <span>{jsonError}</span>
          </div>
        )}

        {/* Product Cards with Full Editable Inputs */}
        {units.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">
                Daftar Produk ({units.length} unit)
              </label>
              <button
                type="button"
                onClick={handleAddUnit}
                className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-medium cursor-pointer"
              >
                <Plus className="size-3.5" />
                Tambah Unit
              </button>
            </div>

            <div className="space-y-4 max-h-[60dvh] overflow-y-auto pr-1">
              {units.map((unit, uIdx) => {
                const isSelected = activeUnitPasteIdx === uIdx;
                const canAddMore = unit.images.length < 5;

                return (
                  <div
                    key={uIdx}
                    onClick={() => setActiveUnitPasteIdx(uIdx)}
                    onFocus={() => setActiveUnitPasteIdx(uIdx)}
                    className={`rounded-xl border p-4 transition-colors space-y-3.5 ${
                      isSelected
                        ? "border-brand bg-brand-soft/10 ring-1 ring-brand/30"
                        : "border-line bg-surface"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-line">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex items-center justify-center size-5.5 rounded-md bg-brand text-white text-xs font-semibold shrink-0">
                          {uIdx + 1}
                        </span>
                        <span className="text-xs font-semibold text-ink truncate">
                          {unit.sku || `Unit ${uIdx + 1}`}
                        </span>
                        {isSelected && (
                          <span className="text-[11px] text-brand font-medium shrink-0">
                            (Aktif untuk paste foto)
                          </span>
                        )}
                      </div>

                      {units.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveUnit(uIdx);
                          }}
                          className="p-1 rounded-lg text-muted hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer"
                          title="Hapus unit ini"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>

                    {/* Section 1: Foto Produk (Maks 5) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-medium text-muted">
                          Foto Produk ({unit.images.length}/5) &middot; Geser untuk atur urutan atau paste foto
                        </label>
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {[0, 1, 2, 3, 4].map((slotIdx) => {
                          const img = unit.images[slotIdx];
                          const isSlotOccupied = Boolean(img);
                          const isBeingDragged =
                            draggedItem?.unitIdx === uIdx && draggedItem?.imgIdx === slotIdx;
                          const isSnapTarget =
                            dragOverItem?.unitIdx === uIdx &&
                            dragOverItem?.imgIdx === slotIdx &&
                            draggedItem?.imgIdx !== slotIdx;

                          return (
                            <div
                              key={slotIdx}
                              draggable={isSlotOccupied}
                              onDragStart={(e) => {
                                if (!isSlotOccupied) return;
                                setDraggedItem({ unitIdx: uIdx, imgIdx: slotIdx });
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", `${uIdx}:${slotIdx}`);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (draggedItem && draggedItem.unitIdx === uIdx) {
                                  e.dataTransfer.dropEffect = "move";
                                  if (
                                    dragOverItem?.unitIdx !== uIdx ||
                                    dragOverItem?.imgIdx !== slotIdx
                                  ) {
                                    setDragOverItem({ unitIdx: uIdx, imgIdx: slotIdx });
                                  }
                                }
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault();
                                if (
                                  dragOverItem?.unitIdx === uIdx &&
                                  dragOverItem?.imgIdx === slotIdx
                                ) {
                                  setDragOverItem(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                if (draggedItem && draggedItem.unitIdx === uIdx) {
                                  const fromIdx = draggedItem.imgIdx;
                                  const toIdx = Math.min(slotIdx, unit.images.length - 1);
                                  reorderImages(uIdx, fromIdx, toIdx);
                                  setDraggedItem(null);
                                  setDragOverItem(null);
                                  return;
                                }

                                const droppedFiles = Array.from(e.dataTransfer.files || []).filter((f) =>
                                  f.type.startsWith("image/")
                                );
                                if (droppedFiles.length > 0) {
                                  addFilesToUnit(uIdx, droppedFiles);
                                }
                                setDraggedItem(null);
                                setDragOverItem(null);
                              }}
                              onDragEnd={() => {
                                setDraggedItem(null);
                                setDragOverItem(null);
                              }}
                              className={`relative aspect-square rounded-lg border transition-all duration-200 flex flex-col items-center justify-center p-1 overflow-hidden select-none group/slot ${
                                isBeingDragged
                                  ? "opacity-30 scale-95 border-dashed border-brand bg-brand-soft/30 ring-2 ring-brand/40"
                                  : isSnapTarget
                                  ? "scale-105 border-brand ring-2 ring-brand shadow-md bg-brand-soft/50 z-10"
                                  : isSlotOccupied
                                  ? "border-line bg-canvas cursor-grab active:cursor-grabbing hover:border-brand/60 hover:shadow-xs"
                                  : "border-dashed border-line bg-canvas hover:border-brand/40"
                              }`}
                            >
                              {img ? (
                                <>
                                  <img
                                    src={img.previewUrl}
                                    alt={`Foto ${slotIdx + 1}`}
                                    className="size-full object-cover rounded-md pointer-events-none"
                                  />
                                  <div
                                    className="absolute top-1 left-1 p-0.5 rounded bg-black/60 text-white opacity-0 group-hover/slot:opacity-100 transition-opacity pointer-events-none"
                                    title="Geser untuk ubah urutan"
                                  >
                                    <GripVertical className="size-3" />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeImageFromUnit(uIdx, slotIdx);
                                    }}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-danger transition-colors cursor-pointer z-10"
                                    title="Hapus foto"
                                  >
                                    <X className="size-3" />
                                  </button>
                                  <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[9px] bg-black/60 text-white font-medium pointer-events-none">
                                    {slotIdx + 1}
                                  </span>
                                </>
                              ) : (
                                <label
                                  className={`size-full flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-subtle ${
                                    !canAddMore ? "opacity-30 cursor-not-allowed" : ""
                                  }`}
                                >
                                  <ImageIcon className="size-4 text-faint" />
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
                    </div>

                    {/* Section 2: Full Editable Inputs */}
                    <div className="space-y-3 pt-1 border-t border-line/70">
                      {/* Judul Produk */}
                      <div>
                        <label className="block text-[11px] font-medium text-muted mb-1">
                          Nama Produk / Judul
                        </label>
                        <textarea
                          rows={2}
                          value={unit.data.Judul || ""}
                          onChange={(e) => handleUpdateUnitField(uIdx, "Judul", e.target.value)}
                          placeholder="Nama produk lengkap..."
                          className="textarea text-xs resize-none"
                        />
                      </div>

                      {/* SKU */}
                      <div>
                        <label className="block text-[11px] font-medium text-muted mb-1">
                          SKU (Format: ANDROID-BRAND-TIPE-RAM/STORAGE)
                        </label>
                        <input
                          type="text"
                          value={unit.data.SKU || ""}
                          onChange={(e) => handleUpdateUnitField(uIdx, "SKU", e.target.value)}
                          placeholder="ANDROID-SAMSUNG-A07 5G-4/128"
                          className="input text-xs"
                        />
                      </div>

                      {/* Harga, Diskon, Stok, Berat */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Harga (Rp)
                          </label>
                          <input
                            type="number"
                            value={unit.data.Harga ?? ""}
                            onChange={(e) => handleUpdateUnitField(uIdx, "Harga", e.target.value)}
                            placeholder="2399000"
                            className="input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Harga Diskon (Rp)
                          </label>
                          <input
                            type="number"
                            value={unit.data["Harga Diskon"] ?? ""}
                            onChange={(e) => handleUpdateUnitField(uIdx, "Harga Diskon", e.target.value)}
                            placeholder="Opsional"
                            className="input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Total Stok
                          </label>
                          <input
                            type="number"
                            value={unit.data["Total Stok"] ?? ""}
                            onChange={(e) => handleUpdateUnitField(uIdx, "Total Stok", e.target.value)}
                            placeholder="10"
                            className="input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Berat (gram)
                          </label>
                          <input
                            type="number"
                            value={unit.data["Berat Produk"] ?? ""}
                            onChange={(e) => handleUpdateUnitField(uIdx, "Berat Produk", e.target.value)}
                            placeholder="500"
                            className="input text-xs"
                          />
                        </div>
                      </div>

                      {/* Kondisi, Status, Preorder, Jenis Produk */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Kondisi Barang
                          </label>
                          <CustomSelect
                            value={unit.data["Kondisi Barang"] || "Baru"}
                            onChange={(val) => handleUpdateUnitField(uIdx, "Kondisi Barang", val)}
                            options={["Baru", "Bekas"]}
                            size="sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Status Produk
                          </label>
                          <CustomSelect
                            value={unit.data["Status Produk"] || "Aktif"}
                            onChange={(val) => handleUpdateUnitField(uIdx, "Status Produk", val)}
                            options={["Aktif", "Nonaktif"]}
                            size="sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Preorder
                          </label>
                          <CustomSelect
                            value={unit.data.Preorder || "Tidak"}
                            onChange={(val) => handleUpdateUnitField(uIdx, "Preorder", val)}
                            options={["Tidak", "Ya"]}
                            size="sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Jenis Produk
                          </label>
                          <input
                            type="text"
                            value={unit.data["Jenis Produk"] || "Buy Now"}
                            onChange={(e) => handleUpdateUnitField(uIdx, "Jenis Produk", e.target.value)}
                            placeholder="Buy Now"
                            className="input text-xs"
                          />
                        </div>
                      </div>

                      {/* Dimensi Paket */}
                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Panjang / Length (cm)
                          </label>
                          <input
                            type="number"
                            value={unit.data.Length ?? ""}
                            onChange={(e) => handleUpdateUnitField(uIdx, "Length", e.target.value)}
                            placeholder="18"
                            className="input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Lebar / Width (cm)
                          </label>
                          <input
                            type="number"
                            value={unit.data.Width ?? ""}
                            onChange={(e) => handleUpdateUnitField(uIdx, "Width", e.target.value)}
                            placeholder="10"
                            className="input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Tinggi / Height (cm)
                          </label>
                          <input
                            type="number"
                            value={unit.data.Height ?? ""}
                            onChange={(e) => handleUpdateUnitField(uIdx, "Height", e.target.value)}
                            placeholder="6"
                            className="input text-xs"
                          />
                        </div>
                      </div>

                      {/* Kategori Toco */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Main Category
                          </label>
                          <input
                            type="text"
                            value={unit.data["Main Category"] || ""}
                            onChange={(e) => handleUpdateUnitField(uIdx, "Main Category", e.target.value)}
                            placeholder="handphone-tablet"
                            className="input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Sub Category 1
                          </label>
                          <input
                            type="text"
                            value={unit.data["Sub Category 1"] || ""}
                            onChange={(e) => handleUpdateUnitField(uIdx, "Sub Category 1", e.target.value)}
                            placeholder="handphone"
                            className="input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Sub Category 2
                          </label>
                          <input
                            type="text"
                            value={unit.data["Sub Category 2"] || ""}
                            onChange={(e) => handleUpdateUnitField(uIdx, "Sub Category 2", e.target.value)}
                            placeholder="android-os"
                            className="input text-xs"
                          />
                        </div>
                      </div>

                      {/* Deskripsi */}
                      <div>
                        <label className="block text-[11px] font-medium text-muted mb-1">
                          Deskripsi Produk
                        </label>
                        <textarea
                          rows={4}
                          value={unit.data.Deskripsi || ""}
                          onChange={(e) => handleUpdateUnitField(uIdx, "Deskripsi", e.target.value)}
                          placeholder="Deskripsi spesifikasi, garansi, kelengkapan box..."
                          className="textarea text-xs"
                        />
                      </div>
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
          Batal
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
            {isProcessing ? "Memproses..." : "Unduh Excel"}
          </span>
        </button>
      </Modal.Footer>
    </Modal>
  );
}
