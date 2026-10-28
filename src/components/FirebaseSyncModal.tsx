"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  CloudUpload, 
  CloudDownload, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Cloud
} from "lucide-react";
import { firebaseConfig } from "@/lib/firebase";

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseStatus: "connected" | "offline" | "syncing";
  onPushToFirebase: () => Promise<void>;
  onPullFromFirebase: () => Promise<void>;
  onResetToDefault: () => void;
  localCount: number;
}

export default function FirebaseSyncModal({
  isOpen,
  onClose,
  firebaseStatus,
  onPushToFirebase,
  onPullFromFirebase,
  onResetToDefault,
  localCount
}: FirebaseSyncModalProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePush = async () => {
    try {
      setLoadingAction("push");
      setMsg(null);
      await onPushToFirebase();
      setMsg({ type: "success", text: "Berhasil mengunggah seluruh konten ke Cloud Firestore!" });
    } catch (err: any) {
      setMsg({ 
        type: "error", 
        text: `Gagal mengunggah: ${err?.message || "Pastikan Firestore Database telah dibuat di Firebase Console."}` 
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePull = async () => {
    try {
      setLoadingAction("pull");
      setMsg(null);
      await onPullFromFirebase();
      setMsg({ type: "success", text: "Berhasil memuat data terbaru dari Cloud Firestore!" });
    } catch (err: any) {
      setMsg({ 
        type: "error", 
        text: `Gagal memuat: ${err?.message || "Pastikan Firestore Database telah dibuat di Firebase Console."}` 
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = () => {
    if (confirm("Reset seluruh data konten kembali ke 60 ide asli dari brief.json?")) {
      onResetToDefault();
      setMsg({ type: "success", text: "Data berhasil direset ke 60 ide asli brief.json!" });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <Cloud className="size-4 text-brand" />
            <div>
              <h3 className="modal-title">Koneksi Cloud Firestore</h3>
              <p className="font-mono text-[11px] text-faint">
                Project: {firebaseConfig.projectId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-4">
          {/* Status Notice */}
          <div
            className={`notice ${
              firebaseStatus === "connected" ? "notice-success" : "notice-info"
            }`}
          >
            {firebaseStatus === "connected" ? (
              <CheckCircle2 className="size-4 shrink-0 text-success" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-muted" />
            )}
            <div className="space-y-0.5">
              <p className="font-semibold text-ink">
                {firebaseStatus === "connected"
                  ? "Cloud Firestore Terhubung"
                  : "Penyimpanan Lokal Aktif"}
              </p>
              <p className="text-xs text-muted leading-relaxed">
                {firebaseStatus === "connected"
                  ? `Perubahan otomatis tersinkronisasi dengan Cloud Firestore (${localCount} konten aktif).`
                  : `Aplikasi saat ini menyimpan perubahan di browser Anda (${localCount} konten). Hubungkan ke Firestore untuk sinkronisasi multi-perangkat.`}
              </p>
            </div>
          </div>

          {msg && (
            <div
              className={`notice ${
                msg.type === "success" ? "notice-success" : "notice-danger"
              }`}
            >
              {msg.type === "success" ? (
                <CheckCircle2 className="size-4 shrink-0" />
              ) : (
                <AlertCircle className="size-4 shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Guide Box */}
          <div className="rounded-xl border border-line bg-surface p-3.5 text-xs text-muted space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-ink">
              <HelpCircle className="size-3.5 text-brand" />
              <span>Cara Mengaktifkan Firestore di Firebase Console:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed pl-1">
              <li>
                Buka{" "}
                <a
                  href="https://console.firebase.google.com/project/konten-semarang/firestore"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand underline inline-flex items-center gap-0.5"
                >
                  Firebase Console <ExternalLink className="size-2.5" />
                </a>
              </li>
              <li>
                Pilih menu <strong className="text-ink font-medium">Firestore Database</strong> lalu klik{" "}
                <strong className="text-ink font-medium">Create database</strong>.
              </li>
              <li>Pilih mode pengujian (<em>Test mode</em>) atau <em>Production</em>.</li>
              <li>
                Klik tombol <strong className="text-brand font-medium">"Unggah ke Firestore"</strong> di bawah.
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handlePush}
              disabled={loadingAction !== null}
              className="btn btn-primary w-full justify-center"
            >
              {loadingAction === "push" ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Mengunggah {localCount} Konten ke Firestore...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="size-3.5" />
                  <span>Unggah & Sinkronkan {localCount} Konten ke Firestore</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePull}
              disabled={loadingAction !== null}
              className="btn btn-secondary w-full justify-center"
            >
              {loadingAction === "pull" ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin text-brand" />
                  <span>Memuat dari Firestore...</span>
                </>
              ) : (
                <>
                  <CloudDownload className="size-3.5 text-brand" />
                  <span>Tarik Data Terbaru dari Firestore</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loadingAction !== null}
              className="btn btn-ghost w-full justify-center text-xs text-danger hover:bg-danger-soft"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset Data ke 60 Ide Asli brief.json</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
