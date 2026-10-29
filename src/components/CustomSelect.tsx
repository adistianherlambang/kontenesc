"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption<T extends string | number = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  options: (CustomSelectOption<T> | string)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  id?: string;
  name?: string;
  ariaLabel?: string;
}

export default function CustomSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  disabled = false,
  className = "",
  triggerClassName = "",
  dropdownClassName = "",
  id,
  name,
  ariaLabel,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Normalize options to CustomSelectOption<T> objects
  const normalizedOptions: CustomSelectOption<T>[] = options.map((opt) => {
    if (typeof opt === "string" || typeof opt === "number") {
      return { value: opt as unknown as T, label: String(opt) };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Position calculation (flip upward if close to viewport bottom)
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = Math.min(normalizedOptions.length * 40 + 16, 240);

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }

    // Initialize highlighted index to current selected option
    const idx = normalizedOptions.findIndex((opt) => opt.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  }, [isOpen, value, normalizedOptions]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // Prevent closing parent modal
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev + 1;
        while (next < normalizedOptions.length && normalizedOptions[next]?.disabled) {
          next++;
        }
        return next < normalizedOptions.length ? next : prev;
      });
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev - 1;
        while (next >= 0 && normalizedOptions[next]?.disabled) {
          next--;
        }
        return next >= 0 ? next : prev;
      });
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const targetOption = normalizedOptions[highlightedIndex];
      if (targetOption && !targetOption.disabled) {
        onChange(targetOption.value);
        setIsOpen(false);
        triggerRef.current?.focus();
      }
      return;
    }

    if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  const handleSelectOption = (opt: CustomSelectOption<T>) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for native form compatibility */}
      {name && <input type="hidden" name={name} value={String(value)} />}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        className={`flex min-h-10 sm:min-h-9 w-full items-center justify-between gap-2 rounded-xl border border-line bg-canvas px-3.5 py-2 text-left text-base sm:text-[13px] text-ink outline-none transition-all cursor-pointer select-none hover:border-line-strong focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50 ${
          isOpen ? "border-brand ring-3 ring-brand/15" : ""
        } ${triggerClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-muted">{selectedOption.icon}</span>
          )}
          {selectedOption ? (
            <span className="truncate text-ink font-normal">{selectedOption.label}</span>
          ) : (
            <span className="truncate text-faint">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform duration-200 ease-out ${
            isOpen ? "rotate-180 text-ink" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <ul
          ref={listboxRef}
          role="listbox"
          aria-labelledby={selectId}
          className={`absolute left-0 right-0 z-[70] max-h-60 overflow-y-auto rounded-xl border border-line bg-canvas p-1 shadow-[0_12px_32px_rgba(28,25,23,0.12)] animate-in fade-in zoom-in-95 duration-150 ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${dropdownClassName}`}
        >
          {normalizedOptions.map((opt, index) => {
            const isSelected = opt.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <li
                key={String(opt.value)}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled}
                onClick={() => handleSelectOption(opt)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex min-h-[38px] sm:min-h-[34px] cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-[13px] select-none transition-colors ${
                  opt.disabled
                    ? "cursor-not-allowed text-faint opacity-50"
                    : isSelected
                    ? "bg-brand-soft text-brand font-semibold"
                    : isHighlighted
                    ? "bg-subtle text-ink font-medium"
                    : "text-ink hover:bg-subtle"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && (
                    <span
                      className={`shrink-0 ${
                        isSelected ? "text-brand" : "text-muted"
                      }`}
                    >
                      {opt.icon}
                    </span>
                  )}
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

