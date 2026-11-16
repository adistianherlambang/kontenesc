"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import {
  StokItem,
  StokSummary,
  subscribeToStok,
  getStokFromDb,
} from "@/lib/firebase";
import { BrandLogo, BRAND_LIST } from "@/lib/brandLogos";
import StokSidebar from "@/components/StokSidebar";

export default function StokOverviewPage() {
  const [items, setItems] = useState<StokItem[]>([]);
  const [summary, setSummary] = useState<StokSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState<
    "connected" | "offline" | "syncing"
  >("offline");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setFirebaseStatus((prev) => (prev === "offline" ? "syncing" : prev));
    };
    const handleOffline = () => setFirebaseStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    getStokFromDb().then(({ items: initItems, summary: initSummary }) => {
      if (initItems.length > 0) {
        setItems(initItems);
        setSummary(initSummary);
        setIsLoading(false);
      }
    });

    const unsub = subscribeToStok(
      ({ items: newItems, summary: newSummary }) => {
        setItems(newItems);
        setSummary(newSummary);
        setIsLoading(false);
        setFirebaseStatus(
          typeof window !== "undefined" && !window.navigator.onLine
            ? "offline"
            : "connected"
        );
      },
      () => {
        if (typeof window !== "undefined" && !window.navigator.onLine) {
          setFirebaseStatus("offline");
        }
      }
    );

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsub();
    };
  }, []);

  const brandTotals = useMemo(() => {
    if (summary?.brand_totals) {
      return summary.brand_totals;
    }
    const map: Record<string, number> = {};
    items.forEach((it) => {
      const b = it.brand || "Lainnya";
      map[b] = (map[b] || 0) + (it.total_stok || 0);
    });
    return map;
  }, [summary, items]);

  const totalUnits = useMemo(() => {
    if (summary?.total_units) return summary.total_units;
    return items.reduce((acc, it) => acc + (it.total_stok || 0), 0);
  }, [summary, items]);

  const tanggal = summary?.tanggal || items[0]?.tanggal || "";

  return (
    <div className="h-dvh w-full overflow-hidden flex bg-white text-[#18181B] font-sans">
      <StokSidebar
        activeBrand="all"
        brandTotals={brandTotals}
        totalUnits={totalUnits}
        tanggal={tanggal}
        firebaseStatus={firebaseStatus}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-white">
        {/* Top Header */}
        <header className="h-14 sm:h-16 px-4 sm:px-8 border-b border-[#ECEBE8] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/"
              className="btn btn-ghost btn-icon -ml-2"
              title="Kembali ke Beranda"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="size-4" />
            </Link>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-ink truncate leading-tight">
                Stok Handphone
              </h1>
              {tanggal && (
                <p className="text-[11px] text-muted truncate">
                  Per {tanggal}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-subtle border border-line text-xs font-semibold text-ink">
              Total <strong className="font-bold text-ink">{totalUnits}</strong> unit
            </span>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Buka menu navigasi"
              className="btn btn-ghost btn-icon md:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </header>

        {/* Brand App Launcher Grid — 3 columns matching reference image */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:py-10">
          <div className="w-full max-w-xs sm:max-w-md md:max-w-xl mx-auto">
            <div className="grid grid-cols-3 gap-3 sm:gap-4.5 md:gap-6 pb-20">
              {BRAND_LIST.map(({ slug, name, bgColor, logoColor }) => {
                const count =
                  brandTotals[name] ??
                  brandTotals[slug] ??
                  brandTotals[slug.toUpperCase()] ??
                  0;

                return (
                  <div key={slug} className="flex flex-col items-center group">
                    <Link
                      href={`/stok/${slug}`}
                      title={`${name} (${count} unit)`}
                      aria-label={`${name} (${count} unit)`}
                      style={{ backgroundColor: bgColor }}
                      className="w-full aspect-square rounded-[20px] sm:rounded-[26px] md:rounded-[30px] flex items-center justify-center p-3 sm:p-4 md:p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-95 cursor-pointer"
                    >
                      <BrandLogo
                        brand={slug}
                        color={logoColor}
                        className={
                          slug === "xiaomi"
                            ? "w-[44%] max-h-12 h-auto"
                            : "w-[76%] max-h-8 sm:max-h-10 md:max-h-12 h-auto"
                        }
                      />
                    </Link>
                    <div className="mt-1.5 text-center select-none">
                      <p className="text-xs sm:text-[13px] font-semibold text-ink leading-tight group-hover:text-brand transition-colors">
                        {name}
                      </p>
                      <p className="text-[11px] text-muted">
                        {isLoading ? "…" : `${count} unit`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
