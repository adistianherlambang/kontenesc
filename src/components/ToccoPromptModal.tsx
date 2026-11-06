"use client";

import React, { useState, useMemo, useRef } from "react";
import { Copy, Check, Upload, Trash2, AlertCircle, Loader2, Search } from "lucide-react";
import Modal from "./Modal";
import CustomSelect from "./CustomSelect";
import { extractHargaFromBuffer, ExtractResult } from "@/lib/extractHarga";
import { generateToccoPrompt, SelectedToccoUnit } from "@/lib/promptHelper";

interface ToccoPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRupiah(val: number): string {
  if (!val || isNaN(val)) return "-";
  const full = val > 0 && val < 100000 ? val * 1000 : val;
  return "Rp " + full.toLocaleString("id-ID");
}

export default function ToccoPromptModal({
  isOpen,
  onClose,
}: ToccoPromptModalProps) {
  const [priceResult, setPriceResult] = useState<ExtractResult | null>(null);
  const [isExtractingPrice, setIsExtractingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [brandFilter, setBrandFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const allUnits = useMemo<SelectedToccoUnit[]>(() => {
    if (!priceResult) return [];
    const list: SelectedToccoUnit[] = [];

    priceResult.data.forEach((group) => {
      // Kelompokkan item berdasarkan tipe yang sama (walau RAM/storage berbeda)
      const tipeMap = new Map<string, typeof group.detail>();
      group.detail.forEach((item) => {
        const key = item.tipe.trim().toUpperCase();
        if (!tipeMap.has(key)) {
          tipeMap.set(key, []);
        }
        tipeMap.get(key)!.push(item);
      });

      tipeMap.forEach((items, key) => {
        const first = items[0];
        const seriList = items.map((it) => {
          const net = it.cashback > 0 ? Math.max(0, it.harga - it.cashback) : it.harga;
          return {
            ram: it.ram,
            harga: it.harga,
            cashback: it.cashback,
            netHarga: net,
          };
        });

        // Urutkan seri dari harga terendah ke tertinggi
        seriList.sort((a, b) => a.netHarga - b.netHarga);
        const lowest = seriList[0];

        list.push({
          id: `${group.merk}-${key}`,
          merk: group.merk,
          tipe: first.tipe,
          nama: first.nama,
          ram: lowest.ram,
          harga: lowest.harga,
          cashback: lowest.cashback,
          seriList,
          minPrice: seriList[0].netHarga,
          maxPrice: seriList[seriList.length - 1].netHarga,
        });
      });
    });

    return list;
  }, [priceResult]);

  const brandOptions = useMemo(() => {
    if (!priceResult) return [{ value: "ALL", label: "Semua Merk" }];
    return [
      { value: "ALL", label: `Semua Merk (${allUnits.length})` },
      ...priceResult.data
        .map((b) => {
          const count = allUnits.filter((u) => u.merk === b.merk).length;
          return {
            value: b.merk,
            label: `${b.merk} (${count})`,
          };
        })
        .filter((b) => !b.label.includes("(0)")),
    ];
  }, [priceResult, allUnits]);

  const filteredUnits = useMemo(() => {
    return allUnits.filter((u) => {
      if (brandFilter !== "ALL" && u.merk !== brandFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ramAll = u.seriList ? u.seriList.map((s) => s.ram).join(" ") : u.ram || "";
        const text = `${u.merk} ${u.tipe} ${u.nama || ""} ${ramAll}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [allUnits, brandFilter, searchQuery]);

  const selectedUnits = useMemo(() => {
    return allUnits.filter((u) => selectedIds.has(u.id));
  }, [allUnits, selectedIds]);

  const totalVariantsCount = useMemo(() => {
    return selectedUnits.reduce((acc, u) => {
      const seriCount = u.seriList && u.seriList.length > 0 ? u.seriList.length : 1;
      return acc + seriCount;
    }, 0);
  }, [selectedUnits]);

  const handlePriceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPriceError(null);
    setIsExtractingPrice(true);

    try {
      const buffer = await file.arrayBuffer();
      const extracted = await extractHargaFromBuffer(buffer, file.name);
      setPriceResult(extracted);
      setSelectedIds(new Set());
      setBrandFilter("ALL");
      setSearchQuery("");
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
    setSelectedIds(new Set());
    setBrandFilter("ALL");
    setSearchQuery("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleToggleUnit = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allFilteredSelected =
    filteredUnits.length > 0 && filteredUnits.every((u) => selectedIds.has(u.id));

  const handleToggleAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredUnits.forEach((u) => next.delete(u.id));
      } else {
        filteredUnits.forEach((u) => next.add(u.id));
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const promptOutput = useMemo(() => {
    if (selectedUnits.length === 0) return "";
    return generateToccoPrompt(selectedUnits);
  }, [selectedUnits]);

  const handleCopyPrompt = async () => {
    if (!promptOutput) return;

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
      title="Prompt Tocco"
      closeButtonAriaLabel="Tutup modal"
    >
      <Modal.Body className="space-y-4">
        {/* Step 1: Upload Berkas Harga */}
        <div>
          <label className="field-label">
            Dokumen Daftar Harga (.doc / .docx) <span className="text-danger">*</span>
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
                    Unggah berkas .doc atau .docx untuk memilih unit yang akan dibuatkan prompt Tocco.
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

        {/* Step 2: Ceklis Unit */}
        {priceResult && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="field-label mb-0">
                Pilih Unit ({selectedUnits.length} tipe{totalVariantsCount > selectedUnits.length ? ` / ${totalVariantsCount} varian` : ""} dipilih) <span className="text-danger">*</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleAllFiltered}
                  disabled={filteredUnits.length === 0}
                  className="text-xs font-medium text-brand hover:underline cursor-pointer disabled:opacity-40"
                >
                  {allFilteredSelected ? "Batal Pilih Tampilan" : "Pilih Semua Tampilan"}
                </button>
                {selectedUnits.length > 0 && (
                  <>
                    <span className="text-line-strong">•</span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-xs font-medium text-danger hover:underline cursor-pointer"
                    >
                      Reset ({selectedUnits.length})
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Filter Merk & Pencarian Unit */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <CustomSelect
                  value={brandFilter}
                  onChange={setBrandFilter}
                  options={brandOptions}
                />
              </div>
              <div className="relative sm:col-span-7">
                <Search className="size-4 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama tipe atau RAM..."
                  className="input pl-9"
                />
              </div>
            </div>

            {/* Daftar Ceklis Unit */}
            <div className="max-h-60 overflow-y-auto rounded-xl border border-line bg-canvas divide-y divide-line">
              {filteredUnits.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted">
                  Tidak ada unit yang sesuai dengan pencarian.
                </p>
              ) : (
                filteredUnits.map((unit) => {
                  const checked = selectedIds.has(unit.id);
                  const hasMultipleSeri = (unit.seriList?.length || 0) > 1;
                  const ramSummary =
                    unit.seriList && unit.seriList.length > 0
                      ? unit.seriList
                          .map((s) => (s.ram ? `${s.ram}GB` : ""))
                          .filter(Boolean)
                          .join(", ")
                      : unit.ram
                      ? `${unit.ram}GB`
                      : "Aksesoris / Non-RAM";

                  return (
                    <label
                      key={unit.id}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs cursor-pointer transition-colors select-none ${
                        checked ? "bg-brand-soft/50" : "hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleUnit(unit.id)}
                          className="checkbox"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink truncate">
                            {unit.merk} {unit.tipe}
                            {unit.nama ? ` (${unit.nama})` : ""}
                          </p>
                          <p className="text-[11px] text-muted truncate">
                            RAM/ROM: {ramSummary}
                            {hasMultipleSeri && ` (${unit.seriList!.length} seri)`}
                            {unit.cashback > 0 && !hasMultipleSeri
                              ? ` • Cashback ${formatRupiah(unit.cashback)}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-semibold text-ink">
                          {hasMultipleSeri && unit.minPrice !== unit.maxPrice
                            ? `${formatRupiah(unit.minPrice!)} - ${formatRupiah(unit.maxPrice!)}`
                            : formatRupiah(unit.minPrice || unit.harga)}
                        </p>
                        {unit.cashback > 0 && !hasMultipleSeri && (
                          <p className="text-[11px] text-faint line-through">
                            {formatRupiah(unit.harga)}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Step 3: Output Prompt Siap Salin */}
        {selectedUnits.length > 0 && (
          <div>
            <label className="field-label">Teks Prompt Tocco Siap Salin</label>
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
          disabled={selectedUnits.length === 0}
          className="btn btn-primary"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span>
            {copied
              ? "Tersalin"
              : totalVariantsCount > selectedUnits.length
              ? `Salin Prompt (${selectedUnits.length} Tipe / ${totalVariantsCount} Varian)`
              : `Salin Prompt (${selectedUnits.length} Unit)`}
          </span>
        </button>
      </Modal.Footer>
    </Modal>
  );
}

