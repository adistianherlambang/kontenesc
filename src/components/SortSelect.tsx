"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import {
  ArrowDownAZ,
  ArrowDown10,
  ArrowUp01,
  ArrowUpDown,
  Check,
  ChevronDown,
} from "lucide-react";

export type StokSortOption = "name-asc" | "stok-desc" | "stok-asc";

export interface SortOptionItem {
  value: StokSortOption;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

export const STOK_SORT_OPTIONS: SortOptionItem[] = [
  {
    value: "name-asc",
    label: "Nama (A–Z)",
    shortLabel: "A–Z",
    icon: <ArrowDownAZ className="size-4 shrink-0 text-muted" />,
  },
  {
    value: "stok-desc",
    label: "Stok Terbanyak",
    shortLabel: "Stok ↓",
    icon: <ArrowDown10 className="size-4 shrink-0 text-muted" />,
  },
  {
    value: "stok-asc",
    label: "Stok Tersedikit",
    shortLabel: "Stok ↑",
    icon: <ArrowUp01 className="size-4 shrink-0 text-muted" />,
  },
];

export interface SortSelectProps {
  value: StokSortOption;
  onChange: (val: StokSortOption) => void;
  options?: SortOptionItem[];
  className?: string;
  align?: "left" | "right";
  ariaLabel?: string;
}

/**
 * Reusable Custom Sort Dropdown Component.
 * Fully accessible with pointer-down dismiss, keyboard navigation,
 * and seamless mobile/desktop responsive trigger labels.
 */
export default function SortSelect({
  value,
  onChange,
  options = STOK_SORT_OPTIONS,
  className = "",
  align = "right",
  ariaLabel = "Urutkan stok",
}: SortSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const buttonId = useId();

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  // Dismiss on pointerdown outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter" ||
        e.key === " "
      ) {
        e.preventDefault();
        setIsOpen(true);
        const idx = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % options.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const target = options[highlightedIndex];
      if (target) {
        onChange(target.value);
        setIsOpen(false);
        triggerRef.current?.focus();
      }
      return;
    }

    if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  const handleSelect = (opt: SortOptionItem) => {
    onChange(opt.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Custom Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={buttonId}
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) {
            const idx = options.findIndex((opt) => opt.value === value);
            setHighlightedIndex(idx >= 0 ? idx : 0);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer select-none outline-none border ${
          isOpen
            ? "bg-white border-line-strong shadow-xs text-ink ring-2 ring-brand/10"
            : "bg-[#F4F4F6] hover:bg-[#EAEAEB] border-transparent text-[#18181B]"
        }`}
      >
        <ArrowUpDown className="size-3.5 shrink-0 text-muted" />

        {/* Desktop Full Label */}
        <span className="hidden sm:inline whitespace-nowrap">
          {selectedOption.label}
        </span>

        {/* Mobile Short Label */}
        <span className="sm:hidden whitespace-nowrap">
          {selectedOption.shortLabel}
        </span>

        <ChevronDown
          className={`size-3 shrink-0 text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180 text-ink" : ""
          }`}
        />
      </button>

      {/* Custom Dropdown Popover */}
      {isOpen && (
        <ul
          role="listbox"
          aria-labelledby={buttonId}
          className={`absolute z-50 mt-1.5 min-w-[170px] sm:min-w-[190px] rounded-xl border border-line bg-canvas p-1 shadow-lg shadow-black/5 animate-in fade-in zoom-in-95 duration-150 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === highlightedIndex;

            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer select-none transition-colors ${
                  isSelected
                    ? "bg-brand-soft text-brand font-semibold"
                    : isHighlighted
                    ? "bg-subtle text-ink"
                    : "text-ink hover:bg-subtle"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={
                      isSelected ? "text-brand" : "text-muted"
                    }
                  >
                    {opt.icon}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </div>

                {isSelected && (
                  <Check className="size-3.5 shrink-0 text-brand stroke-[2.5]" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
