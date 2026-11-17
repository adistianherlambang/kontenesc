"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, WifiOff, RefreshCw, ArrowLeft, Lock } from "lucide-react";

interface VerifyResponse {
  allowed: boolean;
  mode?: string;
  client_ip?: string;
  store_ip?: string;
  last_sync?: string | null;
  reason?: string;
  message?: string;
  error?: string;
}

interface StoreSecurityGateProps {
  children: React.ReactNode;
  pageTitle?: string;
}

const STORAGE_KEY = "semarang_cell_wifi_auth";
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 menit validasi lokal antar halaman

export default function StoreSecurityGate({
  children,
  pageTitle = "Data Toko",
}: StoreSecurityGateProps) {
  const [status, setStatus] = useState<"checking" | "allowed" | "blocked" | "error">("checking");
  const [clientIp, setClientIp] = useState<string>("");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const performCheck = async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
    }

    // Periksa cache sesi jika bukan manual retry
    if (!isManualRetry && typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.allowed && parsed.expiresAt > Date.now()) {
            setClientIp(parsed.clientIp || "");
            setLastSync(parsed.lastSync || null);
            setStatus("allowed");
            return;
          }
        }
      } catch {
        // Abaikan parse error, lanjutkan fetch
      }
    }

    try {
      const res = await fetch("/api/security/verify", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      const data: VerifyResponse = await res.json();

      if (res.ok && data.allowed) {
        setStatus("allowed");
        setClientIp(data.client_ip || "");
        setLastSync(data.last_sync || null);

        // Simpan ke cache sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              allowed: true,
              clientIp: data.client_ip,
              lastSync: data.last_sync,
              expiresAt: Date.now() + CACHE_DURATION_MS,
            })
          );
        }
      } else {
        setStatus("blocked");
        setClientIp(data.client_ip || "");
        setLastSync(data.last_sync || null);
        setErrorMessage(
          data.message ||
            "Akses ditolak: Anda terhubung dari luar jaringan Wi-Fi Toko Semarang Cell."
        );
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      setStatus("error");
      setErrorMessage("Gagal memverifikasi jaringan. Periksa koneksi internet Anda.");
    } finally {
      if (isManualRetry) {
        setIsRetrying(false);
      }
    }
  };

  useEffect(() => {
    let active = true;

    async function initialVerify() {
      // Periksa cache sesi terlebih dahulu
      if (typeof window !== "undefined") {
        try {
          const cached = sessionStorage.getItem(STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.allowed && parsed.expiresAt > Date.now()) {
              if (!active) return;
              setClientIp(parsed.clientIp || "");
              setLastSync(parsed.lastSync || null);
              setStatus("allowed");
              return;
            }
          }
        } catch {
          // Abaikan
        }
      }

      try {
        const res = await fetch("/api/security/verify", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });
        const data: VerifyResponse = await res.json();
        if (!active) return;

        if (res.ok && data.allowed) {
          setStatus("allowed");
          setClientIp(data.client_ip || "");
          setLastSync(data.last_sync || null);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                allowed: true,
                clientIp: data.client_ip,
                lastSync: data.last_sync,
                expiresAt: Date.now() + CACHE_DURATION_MS,
              })
            );
          }
        } else {
          setStatus("blocked");
          setClientIp(data.client_ip || "");
          setLastSync(data.last_sync || null);
          setErrorMessage(
            data.message ||
              "Akses ditolak: Anda terhubung dari luar jaringan Wi-Fi Toko Semarang Cell."
          );
        }
      } catch {
        if (!active) return;
        setStatus("error");
        setErrorMessage("Gagal memverifikasi jaringan. Periksa koneksi internet Anda.");
      }
    }

    initialVerify();

    return () => {
      active = false;
    };
  }, []);

  // Loading state
  if (status === "checking") {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 text-[#18181B] font-sans">
        <div className="flex flex-col items-center max-w-sm text-center">
          <div className="relative mb-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-sm animate-pulse">
              <Lock className="w-7 h-7" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-line flex items-center justify-center shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
            </div>
          </div>
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
            Memverifikasi Jaringan Toko
          </h2>
          <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
            Menghubungkan ke sistem otentikasi Wi-Fi Semarang Cell untuk mengamankan {pageTitle.toLowerCase()}...
          </p>
        </div>
      </div>
    );
  }

  // Allowed state: Render halaman asli
  if (status === "allowed") {
    return <>{children}</>;
  }

  // Blocked / Error state
  const formattedSyncDate = lastSync
    ? new Date(lastSync).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Belum pernah sinkronisasi";

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col justify-between p-4 sm:p-6 text-[#18181B] font-sans">
      {/* Top Header */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors py-1.5 px-3 rounded-xl hover:bg-zinc-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          Semarang Cell Security
        </span>
      </header>

      {/* Main Locked Card */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 sm:p-8 text-center">
          {/* Badge Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600 mx-auto mb-5 shadow-xs">
            {status === "blocked" ? (
              <WifiOff className="w-8 h-8" />
            ) : (
              <ShieldAlert className="w-8 h-8" />
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold tracking-wide uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Akses Terbatas: Wi-Fi Toko
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
            Hanya Bisa Diakses di Toko
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
            Halaman <span className="font-semibold text-zinc-800">{pageTitle}</span> memuat informasi internal toko. Untuk mencegah kebocoran data, akses dibatasi khusus perangkat yang terhubung ke jaringan Wi-Fi Toko Semarang Cell.
          </p>

          {/* Network Detail Box */}
          <div className="bg-zinc-50 rounded-2xl border border-zinc-200/70 p-4 text-left text-xs space-y-2.5 mb-6">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200/50">
              <span className="text-zinc-500 font-medium">Status Koneksi:</span>
              <span className="text-rose-600 font-semibold inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {status === "error" ? "Kesalahan Jaringan" : "Di Luar Jaringan Toko"}
              </span>
            </div>
            {errorMessage && (
              <div className="text-[11px] text-rose-600 bg-rose-50/80 p-2 rounded-lg border border-rose-200/60">
                {errorMessage}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">IP Perangkat Anda:</span>
              <span className="font-mono text-zinc-800 bg-white px-2 py-0.5 rounded border border-zinc-200 text-[11px]">
                {clientIp || "Tidak terdeteksi"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Sinkronisasi Toko Terakhir:</span>
              <span className="text-zinc-700 font-medium text-[11px]">
                {formattedSyncDate}
              </span>
            </div>
          </div>

          {/* Steps Guidance */}
          <div className="text-left bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 mb-6">
            <h3 className="text-xs font-semibold text-amber-900 mb-2">
              Langkah Menghubungkan:
            </h3>
            <ol className="text-[11px] text-amber-800/90 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Pastikan ponsel/laptop terhubung ke <b>Wi-Fi Toko Semarang Cell</b>.</li>
              <li>Matikan <b>VPN</b> atau <b>iCloud Private Relay</b> bila sedang aktif.</li>
              <li>Tekan tombol <b>Cek Ulang Jaringan</b> di bawah ini.</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => performCheck(true)}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-70 text-white text-xs font-medium py-3 px-4 rounded-xl transition-all shadow-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`}
              />
              <span>{isRetrying ? "Memeriksa Ulang..." : "Cek Ulang Jaringan"}</span>
            </button>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 active:scale-[0.99] text-zinc-700 text-xs font-medium py-2.5 px-4 rounded-xl transition-all"
            >
              <span>Buka Menu Lain (Konten)</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-xl w-full mx-auto text-center py-4">
        <p className="text-[11px] text-zinc-400">
          Sistem Keamanan Jaringan IP Otomatis &bull; Semarang Cell
        </p>
      </footer>
    </div>
  );
}
