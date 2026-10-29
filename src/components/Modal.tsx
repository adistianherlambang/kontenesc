"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export type ModalMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";

const maxWidthClasses: Record<ModalMaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  full: "max-w-full",
};

// Global scroll-lock tracker to handle nested modals cleanly
let openModalCount = 0;

function lockBodyScroll() {
  if (typeof document === "undefined") return;
  if (openModalCount === 0) {
    document.body.style.overflow = "hidden";
  }
  openModalCount++;
}

function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.style.overflow = "";
  }
}

export interface ModalHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  children?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  closeButtonAriaLabel?: string;
}

export function ModalHeader({
  children,
  title,
  subtitle,
  icon,
  extra,
  onClose,
  showCloseButton = true,
  closeButtonAriaLabel = "Tutup",
  className = "",
  ...props
}: ModalHeaderProps) {
  return (
    <div className={`modal-header ${className}`} {...props}>
      {children ? (
        children
      ) : (
        <>
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            {title && (
              typeof title === "string" ? (
                <h2 className="modal-title">{title}</h2>
              ) : (
                title
              )
            )}
            {subtitle && <span className="text-xs text-muted truncate">{subtitle}</span>}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {extra}
            {showCloseButton && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-icon"
                aria-label={closeButtonAriaLabel}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ModalBody({ children, className = "", ...props }: ModalBodyProps) {
  return (
    <div className={`modal-body ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ModalFooter({ children, className = "", ...props }: ModalFooterProps) {
  return (
    <div className={`modal-footer ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  titleIcon?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerExtra?: React.ReactNode;
  headerClassName?: string;
  hideHeader?: boolean;
  showCloseButton?: boolean;
  closeButtonAriaLabel?: string;
  footer?: React.ReactNode;
  footerClassName?: string;
  maxWidth?: ModalMaxWidth;
  className?: string; // extra class for modal dialog container
  overlayClassName?: string; // extra class for backdrop overlay
  zIndex?: string; // e.g. "z-50" or "z-[60]"
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  titleIcon,
  subtitle,
  headerExtra,
  headerClassName = "",
  hideHeader = false,
  showCloseButton = true,
  closeButtonAriaLabel = "Tutup",
  footer,
  footerClassName = "",
  maxWidth = "2xl",
  className = "",
  overlayClassName = "",
  zIndex = "z-50",
  closeOnOutsideClick = true,
  closeOnEsc = true,
  children,
  ariaLabel,
  ariaLabelledBy,
}: ModalProps) {
  const isPointerDownOnBackdrop = useRef(false);

  // Background scroll lock
  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = maxWidthClasses[maxWidth] || maxWidth;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownOnBackdrop.current = e.target === e.currentTarget;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && isPointerDownOnBackdrop.current && e.target === e.currentTarget) {
      onClose();
    }
    isPointerDownOnBackdrop.current = false;
  };

  const shouldRenderHeader = !hideHeader && (title || titleIcon || headerExtra || showCloseButton);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={`modal-overlay ${zIndex} ${overlayClassName}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div
        className={`modal ${maxWidthClass} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {shouldRenderHeader && (
          <ModalHeader
            title={title}
            icon={titleIcon}
            subtitle={subtitle}
            extra={headerExtra}
            onClose={onClose}
            showCloseButton={showCloseButton}
            closeButtonAriaLabel={closeButtonAriaLabel}
            className={headerClassName}
          />
        )}

        {children}

        {footer && (
          <ModalFooter className={footerClassName}>
            {footer}
          </ModalFooter>
        )}
      </div>
    </div>
  );
}

// Compound component attachments for flexible composition
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
