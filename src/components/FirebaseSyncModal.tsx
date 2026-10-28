"use client";

import React, { useState } from "react";
import { 
  X, 
  Database, 
  CloudUpload, 
  CloudDownload, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  ExternalLink,
  RefreshCw
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 notion-modal-overlay">
      <div className="notion-modal max-w-lg w-full p-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E9E7] mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">☁️</span>
            <div>
              <h3 className="text-sm font-semibold text-[#37352F]">
                Koneksi Cloud Firestore
              </h3>
              <p className="text-[11px] text-[#787774]">
                Project: <span className="font-mono">{firebaseConfig.projectId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#9B9A97] hover:text-[#37352F] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Notice */}
        <div className={`p-3 rounded border mb-3.5 text-xs flex items-start gap-2.5 ${
          firebaseStatus === "connected"
            ? "bg-[#E7F3E8] border-[#E9E9E7] text-[#2B7830]"
            : "bg-[#FAEBDD] border-[#E9E9E7] text-[#D9730D]"
        }`}>
          {firebaseStatus === "connected" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2B7830]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D9730D]" />
          )}
          <div className="space-y-0.5">
            <p className="font-semibold">
              {firebaseStatus === "connected"
                ? "Cloud Firestore Terhubung"
                : "Penyimpanan Lokal Aktif"}
            </p>
            <p className="opacity-90 leading-relaxed text-[11.5px]">
              {firebaseStatus === "connected"
                ? `Perubahan otomatis tersimpan ke Cloud Firestore (${localCount} konten aktif).`
                : `Aplikasi menyimpan perubahan di browser (${localCount} konten). Klik sinkronkan setelah database diaktifkan.`}
            </p>
          </div>
        </div>

        {msg && (
          <div className={`p-2.5 rounded mb-3 text-xs flex items-center gap-2 border ${
            msg.type === "success" 
              ? "bg-[#E7F3E8] border-[#E9E9E7] text-[#2B7830]" 
              : "bg-[#FDEBEC] border-[#E9E9E7] text-[#DF5452]"
          }`}>
            {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-[#DF5452]" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Setup Accordion */}
        <div className="bg-[#F7F6F3] border border-[#E9E9E7] rounded p-3 mb-4 text-xs text-[#787774] space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-[#37352F]">
            <HelpCircle className="w-3.5 h-3.5 text-[#1F6FB6]" />
            <span>Cara Mengaktifkan Firestore di Firebase Console:</span>
          </div>
          <ol className="list-decimal list-inside space-y-0.5 text-[11.5px] leading-relaxed pl-1">
            <li>Buka <a href="https://console.firebase.google.com/project/konten-semarang/firestore" target="_blank" rel="noreferrer" className="text-[#1F6FB6] underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-2.5 h-2.5" /></a></li>
            <li>Pilih menu <span className="font-medium text-[#37352F]">Firestore Database</span> lalu klik <span className="font-medium text-[#37352F]">Create database</span>.</li>
            <li>Pilih mode pengujian (*Test mode*) atau *Production*.</li>
            <li>Klik tombol <span className="font-medium text-[#1F6FB6]">"Unggah ke Firestore"</span> di bawah.</li>
          </ol>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={handlePush}
            disabled={loadingAction !== null}
            className="w-full notion-btn notion-btn-primary py-2 justify-center text-xs"
          >
            {loadingAction === "push" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mengunggah {localCount} Konten ke Firestore...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Unggah & Sinkronkan {localCount} Konten ke Firestore</span>
              </>
            )}
          </button>

          <button
            onClick={handlePull}
            disabled={loadingAction !== null}
            className="w-full notion-btn notion-btn-bordered py-2 justify-center text-xs"
          >
            {loadingAction === "pull" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1F6FB6]" />
                <span>Memuat dari Firestore...</span>
              </>
            ) : (
              <>
                <CloudDownload className="w-3.5 h-3.5 text-[#1F6FB6]" />
                <span>Tarik Data Terbaru dari Firestore</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={loadingAction !== null}
            className="w-full py-1.5 text-xs text-[#787774] hover:text-[#DF5452] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Data ke 60 Ide Asli brief.json</span>
          </button>
        </div>
      </div>
    </div>
  );
}
