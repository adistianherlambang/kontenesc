"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Menu, ChevronRight } from "lucide-react";
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

  const brandTypeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((it) => {
      const b = (it.brand || "Lainnya").trim().toLowerCase();
      map[b] = (map[b] || 0) + 1;
    });
    return map;
  }, [items]);

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

        {/* Stretched Brand Cards Grid */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-7">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-20">
              {BRAND_LIST.map(({ slug, name, bgColor, logoColor }) => {
                const count =
                  brandTotals[name] ??
                  brandTotals[slug] ??
                  brandTotals[slug.toUpperCase()] ??
                  0;
                const typeCount =
                  brandTypeCounts[slug] ??
                  brandTypeCounts[name.toLowerCase()] ??
                  0;

                return (
                  <Link
                    key={slug}
                    href={`/stok/${slug}`}
                    style={{ backgroundColor: bgColor }}
                    className="group relative w-full rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer min-h-[84px] sm:min-h-[92px] overflow-hidden"
                  >
                    <div className="flex flex-col justify-between h-full min-w-0 pr-3">
                      <BrandLogo
                        brand={slug}
                        color={logoColor}
                        className={
                          slug === "xiaomi"
                            ? "h-7 sm:h-8 w-auto"
                            : "h-5 sm:h-6 w-auto max-w-[130px] sm:max-w-[150px]"
                        }
                      />
                      <span
                        className="text-[11px] font-medium opacity-80 mt-2 truncate"
                        style={{ color: logoColor }}
                      >
                        {isLoading ? "…" : `${typeCount} tipe handphone`}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      style={{ color: logoColor }}
                    >
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-bold block leading-tight">
                          {isLoading ? "…" : count}
                        </span>
                        <span className="text-[10px] font-medium opacity-75 uppercase tracking-wider block">
                          unit
                        </span>
                      </div>
                      <ChevronRight className="size-4.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
