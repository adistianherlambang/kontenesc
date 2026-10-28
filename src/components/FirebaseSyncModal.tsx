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
  RefreshCw,
  Sparkles
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
      setMsg({ type: "success", text: "Berhasil mengunggah dan menyinkronkan data ke Cloud Firestore!" });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-overlay">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl modal-content border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1F6FB6] flex items-center justify-center border border-blue-100 shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pusat Sinkronisasi Firebase
              </h3>
              <p className="text-xs text-slate-500">
                Project ID: <span className="font-mono font-semibold text-slate-700">{firebaseConfig.projectId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert */}
        <div className={`p-4 rounded-2xl mb-4 border flex items-start gap-3 ${
          firebaseStatus === "connected"
            ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
            : "bg-amber-50/80 border-amber-200 text-amber-900"
        }`}>
          {firebaseStatus === "connected" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <p className="font-bold">
              {firebaseStatus === "connected"
                ? "Cloud Firestore Terhubung"
                : "Mode Penyimpanan Lokal & Menunggu Setup Firestore"}
            </p>
            <p className="leading-relaxed opacity-90">
              {firebaseStatus === "connected"
                ? `Semua perubahan otomatis tersimpan di Cloud Firestore dan sinkron di semua perangkat. (${localCount} konten aktif)`
                : `Aplikasi saat ini beroperasi penuh menggunakan penyimpanan lokal browser (${localCount} konten aktif).`}
            </p>
          </div>
        </div>

        {msg && (
          <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 border ${
            msg.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}>
            {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Setup Guide Accordion */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <HelpCircle className="w-4 h-4 text-[#1F6FB6]" />
            <span>Panduan Singkat Aktivasi Firestore di Firebase Console:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed pl-1">
            <li>Buka <a href="https://console.firebase.google.com/project/konten-semarang/firestore" target="_blank" rel="noreferrer" className="text-[#1F6FB6] font-semibold underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a></li>
            <li>Klik menu <span className="font-semibold text-slate-800">Build ➔ Firestore Database</span>.</li>
            <li>Klik tombol <span className="font-semibold text-slate-800">Create database</span> (pilih Mode Test atau Production).</li>
            <li>Setelah database dibuat, kembali ke sini dan klik tombol <span className="font-semibold text-[#1F6FB6]">"Unggah Semua ke Firestore"</span> di bawah!</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Push to Firestore */}
          <button
            onClick={handlePush}
            disabled={loadingAction !== null}
            className="w-full btn-primary py-2.5 px-4 justify-center text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loadingAction === "push" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mengunggah {localCount} Konten ke Firestore...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>Unggah & Sinkronkan Semua Konten ke Firestore</span>
              </>
            )}
          </button>

          {/* Pull from Firestore */}
          <button
            onClick={handlePull}
            disabled={loadingAction !== null}
            className="w-full btn-secondary py-2.5 px-4 justify-center text-xs sm:text-sm font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            {loadingAction === "pull" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#1F6FB6]" />
                <span>Memuat dari Firestore...</span>
              </>
            ) : (
              <>
                <CloudDownload className="w-4 h-4 text-[#1F6FB6]" />
                <span>Tarik Data Terbaru dari Firestore</span>
              </>
            )}
          </button>

          {/* Reset to Default */}
          <button
            onClick={handleReset}
            disabled={loadingAction !== null}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data ke 60 Ide Asli brief.json</span>
          </button>
        </div>
      </div>
    </div>
  );
}
