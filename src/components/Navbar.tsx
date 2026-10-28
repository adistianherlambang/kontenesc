"use client";

import React, { useState } from "react";
import { 
  Database, 
  Download, 
  Plus, 
  Smartphone,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  ChevronDown
} from "lucide-react";

interface NavbarProps {
  firebaseStatus: "connected" | "offline" | "syncing";
  totalCount: number;
  executedCount: number;
  onOpenCreate: () => void;
  onOpenSync: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

export default function Navbar({
  firebaseStatus,
  totalCount,
  executedCount,
  onOpenCreate,
  onOpenSync,
  onExportJSON,
  onExportCSV
}: NavbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const percent = totalCount > 0 ? Math.round((executedCount / totalCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E9E9E7] px-4 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        
        {/* Left: Notion-Style Breadcrumb & Execution Progress */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#1F6FB6] flex items-center justify-center text-white font-bold text-xs shadow-xs">
            📱
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#787774]">
              <span>Eldorado Semarang Cell</span>
              <span>/</span>
              <span className="font-semibold text-[#37352F] flex items-center gap-1">
                Konten Hub
              </span>
            </div>
            
            {/* Minimalist Progress Meter */}
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-24 sm:w-32 h-1.5 rounded-full bg-[#EFEFED] overflow-hidden">
                <div 
                  className="h-full bg-[#1F6FB6] rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-[#787774]">
                {executedCount}/{totalCount} dieksekusi ({percent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Notion Minimalist Buttons) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-between sm:justify-end">
          
          {/* Cloud Sync Status Pill */}
          <button
            type="button"
            onClick={onOpenSync}
            className="notion-btn notion-btn-default text-xs"
            title="Pengaturan koneksi Firebase Firestore"
          >
            {firebaseStatus === "connected" ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[#2B7830] font-medium">Cloud Aktif</span>
              </>
            ) : firebaseStatus === "syncing" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                <span className="text-amber-600 font-medium">Sinkron...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4 text-[#787774]" />
                <span className="text-[#787774]">Lokal (Firestore)</span>
              </>
            )}
          </button>

          {/* Export Dropdown (JSON / CSV) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="notion-btn notion-btn-bordered text-xs"
            >
              <Download className="w-4 h-4 text-[#787774]" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9B9A97]" />
            </button>

            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowExportMenu(false)} 
                />
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#E9E9E7] rounded-xl shadow-lg z-50 py-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onExportJSON();
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3.5 py-2.5 min-h-[40px] text-left hover:bg-[#F7F6F3] active:bg-[#EFEFED] flex items-center gap-2.5 text-[#37352F] cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-[#1F6FB6]" />
                    <span>Download JSON (.json)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onExportCSV();
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3.5 py-2.5 min-h-[40px] text-left hover:bg-[#F7F6F3] active:bg-[#EFEFED] flex items-center gap-2.5 text-[#37352F] cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Download CSV (.csv)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* New / Batch Add Content Button */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="notion-btn notion-btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Konten</span>
          </button>
        </div>

      </div>
    </header>
  );
}
