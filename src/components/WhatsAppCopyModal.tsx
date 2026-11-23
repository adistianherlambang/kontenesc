"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { Copy, Check, AlertCircle, MessageSquareText } from "lucide-react";
import Modal from "@/components/Modal";

export interface WhatsAppPickerChoice {
  id: string;
  label: string;
  count?: number;
  muted?: boolean;
}

export interface WhatsAppFormatOption<T extends string = string> {
  id: T;
  label: string;
}

interface WhatsAppCopyModalProps<T extends string = string> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  ariaLabel: string;
  closeButtonAriaLabel: string;
  pickerLabel: string;
  pickerHint?: string;
  choices: WhatsAppPickerChoice[];
  selectedChoice: string;
  onSelectChoice: (id: string) => void;
  formatOptions: readonly WhatsAppFormatOption<T>[];
  selectedFormat: T;
  onSelectFormat: (format: T) => void;
  extraControls?: React.ReactNode;
  previewText: string;
  emptyMessage: string;
}

function legacyCopyText(text: string): boolean {
  const field = Object.assign(document.createElement("textarea"), {
    value: text,
  });
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
  document.body.append(field);
  field.select();
  try {
    return document.execCommand("copy");
  } finally {
    field.remove();
  }
}

export default function WhatsAppCopyModal<T extends string = string>({
  isOpen,
  onClose,
  title,
  subtitle,
  ariaLabel,
  closeButtonAriaLabel,
  pickerLabel,
  pickerHint,
  choices,
  selectedChoice,
  onSelectChoice,
  formatOptions,
  selectedFormat,
  onSelectFormat,
  extraControls,
  previewText,
  emptyMessage,
}: WhatsAppCopyModalProps<T>) {
  const previewId = useId();
  const [feedback, setFeedback] = useState<{
    status: "idle" | "copied" | "failed";
    message: string;
    forText: string;
  }>({ status: "idle", message: "", forText: "" });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnnouncementRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isCurrentFeedback =
    feedback.status !== "idle" && feedback.forText === previewText;
  const effectiveStatus = isCurrentFeedback ? feedback.status : "idle";
  const effectiveMessage = isCurrentFeedback ? feedback.message : "";

  const clearFeedback = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFeedback({ status: "idle", message: "", forText: "" });
  };

  const reportCopyOutcome = (ok: boolean, copiedText: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    let msg = ok ? "Tersalin" : "Gagal menyalin";
    // Append NBSP on identical consecutive announcements so VoiceOver re-announces.
    if (msg === lastAnnouncementRef.current) {
      msg += "\u00A0";
    }
    lastAnnouncementRef.current = msg;
    setFeedback({
      status: ok ? "copied" : "failed",
      message: msg,
      forText: copiedText,
    });
    timerRef.current = setTimeout(() => {
      setFeedback({ status: "idle", message: "", forText: "" });
    }, 2000);
  };

  const handleCopy = async () => {
    if (!previewText) return;
    try {
      await navigator.clipboard.writeText(previewText);
      reportCopyOutcome(true, previewText);
    } catch {
      const ok = legacyCopyText(previewText);
      reportCopyOutcome(ok, previewText);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={title}
      titleIcon={<MessageSquareText className="size-4 text-brand shrink-0" />}
      subtitle={subtitle}
      ariaLabel={ariaLabel}
      closeButtonAriaLabel={closeButtonAriaLabel}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              role="status"
              aria-live="polite"
              className={`text-xs font-medium transition-opacity duration-150 ${
                effectiveStatus === "copied"
                  ? "text-success opacity-100"
                  : effectiveStatus === "failed"
                  ? "text-danger opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              {effectiveMessage}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleCopy}
              aria-disabled={!previewText}
              data-copied={effectiveStatus === "copied" ? "" : undefined}
              data-failed={effectiveStatus === "failed" ? "" : undefined}
              className={`btn ${
                previewText
                  ? "btn-primary"
                  : "btn-secondary opacity-50 cursor-not-allowed"
              }`}
            >
              {effectiveStatus === "copied" ? (
                <Check className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <Copy className="size-4 shrink-0" aria-hidden="true" />
              )}
              <span>
                {effectiveStatus === "copied"
                  ? "Tersalin"
                  : effectiveStatus === "failed"
                  ? "Gagal Menyalin"
                  : "Copy untuk WhatsApp"}
              </span>
            </button>
          </div>
        </div>
      }
    >
      <Modal.Body className="space-y-5">
        {/* Brand / Scope Picker */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="field-label mb-0">{pickerLabel}</label>
            {pickerHint && (
              <span className="text-[11px] text-muted">{pickerHint}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {choices.map((choice) => {
              const isSelected = selectedChoice === choice.id;
              return (
                <button
                  type="button"
                  key={choice.id}
                  onClick={() => {
                    onSelectChoice(choice.id);
                    clearFeedback();
                  }}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "border-brand bg-brand-soft text-brand font-semibold"
                      : choice.muted
                      ? "border-line bg-surface text-faint hover:bg-subtle hover:text-muted"
                      : "border-line bg-canvas text-ink hover:bg-subtle"
                  }`}
                >
                  <span>{choice.label}</span>
                  {typeof choice.count === "number" && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${
                        isSelected
                          ? "bg-brand/10 text-brand"
                          : "bg-subtle text-muted"
                      }`}
                    >
                      {choice.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {extraControls}

        {/* Preview Header + Format Switch */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={previewId} className="field-label mb-0">
              Pratinjau Pesan WhatsApp
            </label>

            <div
              className="inline-flex items-center rounded-xl border border-line bg-surface p-0.5 text-xs"
              role="group"
              aria-label="Format pesan WhatsApp"
            >
              {formatOptions.map(({ id, label }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => {
                    onSelectFormat(id);
                    clearFeedback();
                  }}
                  aria-pressed={selectedFormat === id}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedFormat === id
                      ? "bg-canvas text-ink shadow-2xs font-semibold"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {previewText ? (
            <textarea
              id={previewId}
              readOnly
              rows={12}
              value={previewText}
              className="textarea bg-surface font-mono text-xs sm:text-[13px] leading-relaxed"
            />
          ) : (
            <div className="notice notice-info">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{emptyMessage}</span>
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}
