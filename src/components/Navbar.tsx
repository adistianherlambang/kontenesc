"use client";

import React from "react";
import { 
  Sparkles, 
  Database, 
  Download, 
  Plus, 
  Smartphone,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface NavbarProps {
  firebaseStatus: "connected" | "offline" | "syncing";
  totalCount: number;
  onOpenCreate: () => void;
  onOpenSync: () => void;
  onExport: () => void;
}

export default function Navbar({
  firebaseStatus,
  totalCount,
  onOpenCreate,
  onOpenSync,
  onExport
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 glass-header px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1F6FB6] to-[#0E497C] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Semarang Cell
                </h1>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#1F6FB6] border border-blue-200">
                  Konten Hub
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Eldorado Semarang Cell Metro • {totalCount} Ide Konten
              </p>
            </div>
          </div>

          {/* Mobile Actions Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenCreate}
              className="w-9 h-9 rounded-lg bg-[#1F6FB6] text-white flex items-center justify-center shadow-sm"
              title="Tambah Konten"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between md:justify-end">
          {/* Firebase Connection Status Badge */}
          <button
            onClick={onOpenSync}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              firebaseStatus === "connected"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : firebaseStatus === "syncing"
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
            title="Klik untuk membuka pengaturan Firebase Firestore"
          >
            {firebaseStatus === "connected" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Firebase Aktif</span>
              </>
            ) : firebaseStatus === "syncing" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>Menyinkronkan...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Penyimpanan Lokal (Klik Setup)</span>
              </>
            )}
          </button>

          {/* Export JSON Button */}
          <button
            onClick={onExport}
            className="btn-secondary text-xs sm:text-sm py-1.5 px-3"
            title="Unduh data brief saat ini dalam format JSON"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          {/* Sync / Database Button */}
          <button
            onClick={onOpenSync}
            className="btn-secondary text-xs sm:text-sm py-1.5 px-3 text-[#1F6FB6] border-blue-200 hover:bg-blue-50"
            title="Sinkronisasi ke Firestore"
          >
            <RefreshCw className="w-4 h-4 text-[#1F6FB6]" />
            <span className="hidden sm:inline">Sinkronisasi</span>
          </button>

          {/* New Content Button */}
          <button
            onClick={onOpenCreate}
            className="hidden md:inline-flex btn-primary text-xs sm:text-sm py-1.5 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Konten</span>
          </button>
        </div>
      </div>
    </header>
  );
}
