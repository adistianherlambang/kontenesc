"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  ArrowLeft,
  Laptop,
} from "lucide-react";

const DEFAULT_SECRET = "semarang-cell-store-sec-2026";
const SYNC_INTERVAL_SEC = 3600; // 1 jam = 3600 detik

export default function SyncIpPage() {
  const [secretKey, setSecretKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("store_sync_secret") || DEFAULT_SECRET;
    }
    return DEFAULT_SECRET;
  });

  const [status, setStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [currentIp, setCurrentIp] = useState<string>("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [syncCount, setSyncCount] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(SYNC_INTERVAL_SEC);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSync = useCallback(
    async (secretToUse?: string) => {
      setStatus("syncing");
      setErrorMessage("");

      const key = secretToUse || secretKey || DEFAULT_SECRET;

      try {
        const res = await fetch(`/api/security/sync?secret=${encodeURIComponent(key)}`, {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
          setCurrentIp(data.ip || "");
          setLastSyncedAt(data.synced_at || new Date().toISOString());
          setSyncCount((prev) => prev + 1);
          setCountdown(SYNC_INTERVAL_SEC); // Reset hitung mundur 1 jam
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Gagal melakukan sinkronisasi IP");
        }
      } catch (err: unknown) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Koneksi terputus saat sinkronisasi IP"
        );
      }
    },
    [secretKey]
  );

  // Jalankan sinkronisasi pertama kali saat halaman dibuka
  useEffect(() => {
    let active = true;

    async function initialSync() {
      try {
        const key = secretKey || DEFAULT_SECRET;
        const res = await fetch(`/api/security/sync?secret=${encodeURIComponent(key)}`, {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });
        const data = await res.json();
        if (!active) return;

        if (res.ok && data.success) {
          setStatus("success");
          setCurrentIp(data.ip || "");
          setLastSyncedAt(data.synced_at || new Date().toISOString());
          setSyncCount(1);
          setCountdown(SYNC_INTERVAL_SEC);
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Gagal melakukan sinkronisasi IP");
        }
      } catch (err: unknown) {
        if (!active) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Koneksi terputus saat sinkronisasi IP"
        );
      }
    }

    initialSync();

    return () => {
      active = false;
    };
  }, [secretKey]);

  // Timer hitung mundur 1 jam & auto-sync berulang
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerSync();
          return SYNC_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [triggerSync]);

  const handleSaveSecret = (newKey: string) => {
    setSecretKey(newKey);
    if (typeof window !== "undefined") {
      localStorage.setItem("store_sync_secret", newKey);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const curlCommand = `curl -s "${typeof window !== "undefined" ? window.location.origin : "https://domain-anda.com"}/api/security/sync?secret=${secretKey}"`;

  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#18181B] font-sans flex flex-col justify-between p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors py-1.5 px-3 rounded-xl hover:bg-zinc-200/60"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-mono tracking-wider text-zinc-500 font-semibold uppercase">
            PC Kasir Sync Hub
          </span>
        </div>
      </header>

      {/* Main Card */}
      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Status Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-colors ${
                  status === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
                    : status === "error"
                    ? "bg-rose-50 border border-rose-200 text-rose-600"
                    : "bg-blue-50 border border-blue-200 text-blue-600"
                }`}
              >
                {status === "success" ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : status === "error" ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
                  Sinkronisasi IP Wi-Fi Toko
                </h1>
                <p className="text-xs text-zinc-500">
                  Semarang Cell &bull; Otomatis diperbarui setiap 1 jam
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="text-[11px] font-medium text-zinc-400 block">
                Auto Sync:
              </span>
              <span className="text-xs font-mono font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 inline-flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-zinc-400" />
                {formatCountdown(countdown)}
              </span>
            </div>
          </div>

          {/* Alert Error if any */}
          {status === "error" && errorMessage && (
            <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-700 space-y-1">
              <p className="font-semibold">Sinkronisasi Gagal:</p>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Info Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200/70 p-4">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
                IP Wi-Fi Toko Saat Ini
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono text-zinc-900">
                  {currentIp || "—"}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Semua perangkat di Wi-Fi ini diizinkan
              </span>
            </div>

            <div className="bg-zinc-50 rounded-2xl border border-zinc-200/70 p-4">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
                Terakhir Diperbarui
              </span>
              <div className="mt-1.5">
                <span className="text-sm font-semibold text-zinc-800">
                  {lastSyncedAt
                    ? new Date(lastSyncedAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Total sukses sesi ini: {syncCount} kali
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => triggerSync()}
            disabled={status === "syncing"}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 text-white text-xs font-semibold py-3 px-4 rounded-2xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${status === "syncing" ? "animate-spin" : ""}`}
            />
            <span>
              {status === "syncing"
                ? "Menyinkronkan IP..."
                : "Sinkronkan IP Sekarang (Manual)"}
            </span>
          </button>

          {/* Guidance Section */}
          <div className="border-t border-zinc-200/80 pt-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
              <Laptop className="w-4 h-4 text-zinc-500" />
              <span>Instruksi untuk Komputer Kasir Toko:</span>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-4 text-xs text-zinc-600 space-y-2 leading-relaxed">
              <p>
                <b>Metode 1 (Paling Mudah):</b> Cukup buka halaman ini di browser Google Chrome / Microsoft Edge di PC Kasir dan <b>pin tab</b>. Komputer kasir akan otomatis mengirim dan memperbarui IP Wi-Fi toko setiap 1 jam tanpa perlu tindakan manual.
              </p>
              <p>
                <b>Metode 2 (Latar Belakang / Background):</b> Jika ingin berjalan di latar belakang tanpa membuka browser, Anda dapat menyalin perintah di bawah ini ke <i>Windows Task Scheduler</i> atau file <code>.bat</code>:
              </p>

              <div className="relative mt-2">
                <div className="bg-zinc-900 text-zinc-200 rounded-xl p-3 font-mono text-[11px] overflow-x-auto pr-10">
                  {curlCommand}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(curlCommand)}
                  className="absolute right-2 top-2 p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Salin Perintah"
                >
                  {copiedScript ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Secret Key Input Toggle */}
            <details className="text-xs text-zinc-500">
              <summary className="cursor-pointer font-medium hover:text-zinc-700 select-none">
                Pengaturan Kunci Keamanan (Secret Key)
              </summary>
              <div className="mt-3 space-y-2">
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => handleSaveSecret(e.target.value)}
                  placeholder="Kunci rahasia sinkronisasi..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-zinc-500"
                />
                <p className="text-[10px] text-zinc-400">
                  Tersimpan di browser lokal PC kasir. Ubah hanya jika secret di server diperbarui.
                </p>
              </div>
            </details>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl w-full mx-auto text-center py-2">
        <p className="text-[11px] text-zinc-400">
          Sistem Keamanan Toko Semarang Cell &bull; Dilindungi Otentikasi Jaringan IP
        </p>
      </footer>
    </div>
  );
}
