"use client";

import React, { useState, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import Modal from "@/components/Modal";

const ACCESS_PASSWORD = "Semarang01@";
const STORAGE_KEY = "semarang_cell_password_unlocked";

let memoryUnlocked = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  if (memoryUnlocked) return true;
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

function unlockAccess() {
  memoryUnlocked = true;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Abaikan jika sessionStorage diblokir browser
    }
  }
  listeners.forEach((listener) => listener());
}

interface StoreSecurityGateProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function StoreSecurityGate({
  children,
}: StoreSecurityGateProps) {
  const router = useRouter();
  const isUnlocked = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (isUnlocked) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password) {
      setError("Password wajib diisi");
      inputRef.current?.focus();
      return;
    }

    if (password === ACCESS_PASSWORD) {
      setError("");
      unlockAccess();
    } else {
      setError("Password salah");
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };

  return (
    <div className="h-dvh w-full bg-surface">
      <Modal
        isOpen={true}
        onClose={() => router.push("/")}
        closeOnOutsideClick={false}
        closeOnEsc={false}
        showCloseButton={false}
        maxWidth="sm"
        title="Akses Terkunci"
        titleIcon={<Lock className="size-4 text-ink shrink-0" />}
        ariaLabel="Akses Terkunci"
        footer={
          <>
            <Link href="/" className="btn btn-secondary">
              Kembali
            </Link>
            <button
              type="submit"
              form="store-security-form"
              className="btn btn-primary"
            >
              Masuk
            </button>
          </>
        }
      >
        <Modal.Body>
          <form
            id="store-security-form"
            method="POST"
            onSubmit={handleSubmit}
            className="space-y-3"
            noValidate
          >
            <div>
              <label htmlFor="store-access-password" className="field-label">
                Password
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="store-access-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  enterKeyHint="done"
                  required
                  aria-invalid={error ? "true" : undefined}
                  aria-describedby={error ? "store-password-error" : undefined}
                  className="input pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted hover:text-ink hover:bg-subtle transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div aria-live="polite">
              {error && (
                <div
                  id="store-password-error"
                  className="notice notice-danger text-xs"
                >
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
