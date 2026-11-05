"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileSpreadsheet,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  X,
  GripVertical,
  Globe,
  ExternalLink,
  Cloud,
  ImageIcon,
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
  uploadedUrl?: string; // e.g. "https://domainsaya.com/r2/ANDROID-SAMSUNG-A07_5G-4-128_1.jpg"
  uploadedKey?: string; // e.g. "tocco_esc/ANDROID-SAMSUNG-A07_5G-4-128_1.jpg"
  isUploaded?: boolean;
}

interface UnitState {
  index: number;
  data: TocoProductRow;
  sku: string;
  judul: string;
  images: UnitImageItem[];
}

function getCleanSku(sku: string): string {
  return sku
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/_+/g, "_");
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
  const [customDomain, setCustomDomain] = useState<string>("");
  const [activeUnitPasteIdx, setActiveUnitPasteIdx] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ unitIdx: number; imgIdx: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ unitIdx: number; imgIdx: number } | null>(null);
  const [sampleLinks, setSampleLinks] = useState<string[]>([]);
  const lastPasteTimestampRef = useRef<number>(0);

  // Restore saved domain or default to current browser origin
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tocco_custom_domain");
      if (saved) {
        setCustomDomain(saved);
      } else if (!customDomain) {
        setCustomDomain(window.location.origin);
      }
    }
  }, []);

  const handleDomainChange = (val: string) => {
    setCustomDomain(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("tocco_custom_domain", val);
    }
  };

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
      const imageFiles: File[] = [];

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
      isUploaded: false,
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

  const handleUseSample = () => {
    setJsonInput(SAMPLE_JSON);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSampleLinks([]);
  };

  const getEffectiveDomain = () => {
    let domain = customDomain.trim();
    if (!domain) {
      domain = typeof window !== "undefined" ? window.location.origin : "";
    }
    if (!domain.startsWith("http://") && !domain.startsWith("https://")) {
      domain = `https://${domain}`;
    }
    return domain.replace(/\/+$/, "");
  };

  const handleProcessAndDownload = async () => {
    if (units.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSampleLinks([]);

    try {
      const baseDomain = getEffectiveDomain();
      const updatedUnits = [...units];
      const updatedRows: TocoProductRow[] = [];
      const collectedLinks: string[] = [];

      // Step 1: Upload all unit images to Cloudflare R2
      for (let uIdx = 0; uIdx < updatedUnits.length; uIdx++) {
        const unit = updatedUnits[uIdx];
        const rowData = { ...unit.data };
        const newImages = [...unit.images];

        setProcessStatus(
          `1/3: Mengunggah gambar unit ${uIdx + 1}/${updatedUnits.length} (${unit.sku}) ke Cloudflare R2...`
        );

        for (let imgIdx = 0; imgIdx < newImages.length; imgIdx++) {
          const imgItem = { ...newImages[imgIdx] };
          const slotKey = `Foto ${imgIdx + 1}` as keyof TocoProductRow;

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
                  `Gagal mengunggah foto ${imgIdx + 1} untuk SKU ${unit.sku} ke R2`
              );
            }

            const data = await res.json();
            const forwardedUrl = `${baseDomain}${data.path}`;
            imgItem.uploadedUrl = forwardedUrl;
            imgItem.uploadedKey = data.key;
            imgItem.isUploaded = true;
            rowData[slotKey] = forwardedUrl;

            if (collectedLinks.length < 5) {
              collectedLinks.push(forwardedUrl);
            }
          } else if (imgItem.uploadedUrl) {
            rowData[slotKey] = imgItem.uploadedUrl;
            if (collectedLinks.length < 5) {
              collectedLinks.push(imgItem.uploadedUrl);
            }
          }

          newImages[imgIdx] = imgItem;
        }

        updatedUnits[uIdx] = {
          ...unit,
          images: newImages,
        };
        updatedRows.push(rowData);
      }

      setUnits(updatedUnits);
      setSampleLinks(collectedLinks);

      // Step 2: Fetch template Excel file
      setProcessStatus("2/3: Menyiapkan berkas toco_bulk_upload_template.xlsx...");
      const tplRes = await fetch("/toco_bulk_upload_template.xlsx");
      if (!tplRes.ok) {
        throw new Error(
          "Gagal memuat template Excel toco_bulk_upload_template.xlsx dari server."
        );
      }
      const tplBuffer = await tplRes.arrayBuffer();

      // Step 3: Inject rows into template
      setProcessStatus("3/3: Menulis link forwarding Next.js ke kolom Foto 1-5 Excel...");
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
        `Sukses! File Excel untuk ${units.length} unit berhasil dibuat dan diunduh. Semua gambar telah terunggah ke Cloudflare R2 (folder: tocco_esc/) dan link forwarding Next.js (${baseDomain}/r2/...) telah tersimpan di kolom Foto 1 s/d Foto 5.`
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

  const activeDomain = getEffectiveDomain();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title="JSON ke Excel Toco (Cloudflare R2)"
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
              Terdeteksi {units.length} unit produk siap diproses.
            </span>
          </div>
        )}

        {/* Step 2: Konfigurasi Domain Forwarding Next.js */}
        {units.length > 0 && (
          <div className="rounded-xl border border-line bg-surface p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="field-label mb-0 flex items-center gap-1.5 text-ink font-semibold">
                <Globe className="size-4 text-brand" />
                <span>Domain Forwarding Next.js untuk Link Foto</span>
              </label>
              <span className="text-[11px] text-muted">
                Ditulis ke kolom Foto 1 - 5 Excel
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customDomain}
                onChange={(e) => handleDomainChange(e.target.value)}
                placeholder="https://domainsaya.com atau http://localhost:3000"
                className="input text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <Cloud className="size-3.5 text-brand shrink-0" />
              <span>
                Gambar diunggah ke Cloudflare R2 (<span className="text-ink font-medium">folder: tocco_esc/</span>), lalu di-forward via route Next.js:{" "}
                <span className="text-ink font-medium">
                  {activeDomain}/r2/[nama-sku]_[1-5].jpg
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Input Gambar per Unit */}
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
                const cleanSku = getCleanSku(unit.sku);

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
                          {" • "}
                          Target R2: <span className="text-ink font-medium">tocco_esc/{cleanSku}_*.jpg</span>
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

                    {/* Slots Gambar 1-5 dengan Drag & Snap Reorder */}
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
                                  Foto {slotIdx + 1}{slotIdx === 0 ? " (Utama)" : ""}
                                </span>
                                {img.isUploaded && (
                                  <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[9px] bg-emerald-600 text-white font-medium flex items-center gap-0.5">
                                    <Check className="size-2.5" />
                                    <span>R2</span>
                                  </span>
                                )}
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

                    <div className="flex flex-wrap items-center justify-between gap-1 mt-2 text-[11px] text-muted">
                      <span>
                        Tips: Geser foto untuk susun urutan, atau tekan{" "}
                        <kbd className="px-1 py-0.5 rounded bg-subtle border border-line text-[10px] font-medium">
                          Ctrl+V
                        </kbd>{" "}
                        /{" "}
                        <kbd className="px-1 py-0.5 rounded bg-subtle border border-line text-[10px] font-medium">
                          ⌘+V
                        </kbd>{" "}
                        untuk paste.
                      </span>
                      <span className="font-medium shrink-0 ml-auto">
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
          <div className="space-y-2">
            <div className="notice notice-success">
              <Check className="size-4 shrink-0" />
              <span>{successMessage}</span>
            </div>

            {sampleLinks.length > 0 && (
              <div className="rounded-xl border border-line bg-surface p-3 space-y-1.5 text-xs">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <ExternalLink className="size-3.5 text-brand" />
                  <span>Uji Link Forwarding Next.js yang Masuk ke Excel:</span>
                </span>
                <div className="space-y-1">
                  {sampleLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted shrink-0">Foto {idx + 1}:</span>
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand hover:underline truncate text-[11px]"
                      >
                        {link}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
