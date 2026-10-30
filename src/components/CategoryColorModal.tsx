"use client";

import React, { useState, useEffect } from "react";
import { Palette, Check, RotateCcw } from "lucide-react";
import Modal, { ModalBody, ModalFooter } from "@/components/Modal";
import {
  CategoryTone,
  SWATCH_OPTIONS,
  getDefaultCategoryTone,
  getCategoryTone,
  setCustomTone,
  resetCategoryTone,
  createToneFromHex,
} from "@/lib/categoryTone";

interface CategoryColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
}

export default function CategoryColorModal({
  isOpen,
  onClose,
  categoryName,
}: CategoryColorModalProps) {
  const [selectedTone, setSelectedTone] = useState<CategoryTone>(() =>
    getCategoryTone(categoryName)
  );
  const [customHex, setCustomHex] = useState("#3B82F6");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Sync state whenever modal opens or categoryName changes
  useEffect(() => {
    if (isOpen && categoryName) {
      const tone = getCategoryTone(categoryName);
      setSelectedTone(tone);
      const hex = tone.dotHex || "#3B82F6";
      setCustomHex(hex);
      const isPreset = SWATCH_OPTIONS.some(
        (s) => s.dotHex.toLowerCase() === hex.toLowerCase()
      );
      setIsCustomMode(!isPreset && Boolean(tone.dotHex));
    }
  }, [isOpen, categoryName]);

  if (!isOpen || !categoryName) return null;

  const defaultTone = getDefaultCategoryTone(categoryName);
  const isDefaultSelected = Boolean(
    (selectedTone.id && selectedTone.id === defaultTone.id) ||
    (selectedTone.dotHex &&
      defaultTone.dotHex &&
      selectedTone.dotHex.toLowerCase() === defaultTone.dotHex.toLowerCase())
  );

  const handleSelectSwatch = (swatch: (typeof SWATCH_OPTIONS)[0]) => {
    setSelectedTone(swatch.tone);
    setCustomHex(swatch.dotHex);
    setIsCustomMode(false);
  };

  const handleCustomHexChange = (hexValue: string) => {
    let clean = hexValue.trim();
    if (!clean.startsWith("#")) {
      clean = `#${clean}`;
    }
    setCustomHex(clean);

    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      const customTone = createToneFromHex(clean, `Kustom (${clean})`);
      setSelectedTone(customTone);
      setIsCustomMode(true);
    }
  };

  const handleResetToDefault = () => {
    resetCategoryTone(categoryName);
    setSelectedTone(defaultTone);
    if (defaultTone.dotHex) {
      setCustomHex(defaultTone.dotHex);
    }
    setIsCustomMode(false);
  };

  const handleSave = () => {
    setCustomTone(categoryName, selectedTone);
    onClose();
  };

  // Contrast checker for checkmark inside swatch circle
  const isLightColor = (hex: string) => {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return false;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 165;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ubah Warna Kategori"
      subtitle={categoryName}
      titleIcon={<Palette className="size-4.5 text-brand" />}
      maxWidth="md"
    >
      <ModalBody className="space-y-5">
        {/* Live Preview Box */}
        <section aria-labelledby="preview-heading">
          <p id="preview-heading" className="field-label">
            Pratinjau Tampilan
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Card Preview */}
            <div
              className={`rounded-xl border p-3 transition-colors ${selectedTone.card}`}
              style={
                selectedTone.bgHex && selectedTone.borderHex
                  ? {
                      backgroundColor: selectedTone.bgHex,
                      borderColor: selectedTone.borderHex,
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className={`size-2 rounded-full shrink-0 ${selectedTone.dot}`}
                  style={
                    selectedTone.dotHex
                      ? { backgroundColor: selectedTone.dotHex }
                      : undefined
                  }
                />
                <span
                  className={`text-xs font-semibold truncate ${selectedTone.title}`}
                  style={
                    selectedTone.textHex
                      ? { color: selectedTone.textHex }
                      : undefined
                  }
                >
                  {categoryName}
                </span>
              </div>
              <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                Visual card pada feed akan menggunakan palet warna ini.
              </p>
            </div>

            {/* Sidebar Row Preview */}
            <div className="rounded-xl border border-line bg-surface p-3 flex flex-col justify-center">
              <span className="text-[10px] text-faint uppercase font-semibold tracking-wider mb-1.5">
                Tampilan Sidebar
              </span>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-line/60">
                <span
                  className={`size-2.5 rounded-full shrink-0 ring-1 ring-black/10 ${selectedTone.dot}`}
                  style={
                    selectedTone.dotHex
                      ? { backgroundColor: selectedTone.dotHex }
                      : undefined
                  }
                />
                <span className="truncate text-xs font-medium text-ink flex-1">
                  {categoryName}
                </span>
                <span className="text-[11px] text-faint">12</span>
              </div>
            </div>
          </div>
        </section>

        {/* Color Swatch Picker Grid */}
        <section aria-labelledby="swatch-heading">
          <div className="flex items-center justify-between mb-2">
            <p id="swatch-heading" className="field-label mb-0">
              Pilihan Warna Preset
            </p>
            <span className="text-[11px] text-muted">
              {SWATCH_OPTIONS.length} warna pilihan
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 sm:gap-2.5 p-3 rounded-xl border border-line bg-surface/50">
            {SWATCH_OPTIONS.map((swatch) => {
              const isSelected =
                !isCustomMode &&
                selectedTone.dotHex?.toLowerCase() ===
                  swatch.dotHex.toLowerCase();
              const light = isLightColor(swatch.dotHex);

              return (
                <button
                  type="button"
                  key={swatch.id}
                  onClick={() => handleSelectSwatch(swatch)}
                  title={swatch.name}
                  aria-label={`Pilih warna ${swatch.name}`}
                  className={`group relative size-10 sm:size-10.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-brand ring-offset-2 scale-105 shadow-xs"
                      : "hover:scale-105 hover:shadow-xs"
                  }`}
                  style={{ backgroundColor: swatch.dotHex }}
                >
                  {isSelected && (
                    <Check
                      className={`size-4 stroke-[2.5] ${
                        light ? "text-ink" : "text-white"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Custom Hex Color Picker */}
        <section aria-labelledby="custom-heading">
          <p id="custom-heading" className="field-label">
            Warna Kustom (Hex)
          </p>
          <div className="flex items-center gap-2.5">
            {/* Color preview circle with hidden native input */}
            <label
              className="relative size-10 shrink-0 rounded-xl border border-line cursor-pointer overflow-hidden shadow-2xs hover:scale-105 transition-transform flex items-center justify-center"
              style={{ backgroundColor: customHex }}
              title="Buka pemilih warna sistem"
            >
              <input
                type="color"
                value={
                  /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : "#3B82F6"
                }
                onChange={(e) => handleCustomHexChange(e.target.value)}
                className="opacity-0 absolute inset-0 size-full cursor-pointer"
                aria-label="Pilih warna kustom dengan color picker"
              />
            </label>

            {/* Hex input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={customHex}
                maxLength={7}
                placeholder="#3B82F6"
                onChange={(e) => handleCustomHexChange(e.target.value)}
                className="input uppercase text-xs"
              />
            </div>
          </div>
        </section>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={handleResetToDefault}
          disabled={isDefaultSelected}
          className="btn btn-ghost mr-auto text-xs text-muted hover:text-ink disabled:opacity-40 disabled:hover:text-muted cursor-pointer"
          title="Kembalikan ke warna bawaan sistem"
        >
          <RotateCcw className="size-3.5" />
          <span>Reset ke Bawaan</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary text-xs"
        >
          Batal
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary text-xs"
        >
          <Check className="size-3.5" />
          <span>Simpan Warna</span>
        </button>
      </ModalFooter>
    </Modal>
  );
}
