"use client";

import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import Modal from "@/components/Modal";
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
  const [customHex, setCustomHex] = useState("#6FA3DB");
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    if (isOpen && categoryName) {
      const tone = getCategoryTone(categoryName);
      setSelectedTone(tone);
      const hex = tone.dotHex || "#6FA3DB";
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
      maxWidth="sm"
      title="Ubah Warna Kategori"
      subtitle={categoryName}
      closeButtonAriaLabel="Tutup modal"
    >
      <Modal.Body className="space-y-4">
        <div>
          <label className="field-label">Pilihan Warna</label>
          <div className="grid grid-cols-6 gap-2">
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
                  className={`h-9 rounded-lg border border-black/10 flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected ? "ring-2 ring-ink ring-offset-2" : "hover:opacity-90"
                  }`}
                  style={{ backgroundColor: swatch.dotHex }}
                >
                  {isSelected && (
                    <Check
                      className={`size-4 ${light ? "text-ink" : "text-white"}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="field-label">Warna Kustom (Hex)</label>
          <div className="flex items-center gap-2">
            <label
              className="relative size-10 sm:size-9 shrink-0 rounded-xl border border-line cursor-pointer overflow-hidden"
              style={{ backgroundColor: customHex }}
              title="Pilih warna kustom"
            >
              <input
                type="color"
                value={
                  /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : "#6FA3DB"
                }
                onChange={(e) => handleCustomHexChange(e.target.value)}
                className="opacity-0 absolute inset-0 size-full cursor-pointer"
                aria-label="Pemilih warna"
              />
            </label>

            <input
              type="text"
              value={customHex}
              maxLength={7}
              placeholder="#6FA3DB"
              onChange={(e) => handleCustomHexChange(e.target.value)}
              className="input uppercase"
            />
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={handleResetToDefault}
          disabled={isDefaultSelected}
          className="btn btn-ghost mr-auto"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
        >
          Batal
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
        >
          Simpan
        </button>
      </Modal.Footer>
    </Modal>
  );
}
