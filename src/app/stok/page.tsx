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
import StoreSecurityGate from "@/components/StoreSecurityGate";
import LoadingPage from "@/components/LoadingPage";

export function addOneDay(rawDate: string): string {
  if (!rawDate || typeof rawDate !== "string") return "";
  const trimmed = rawDate.trim();
  if (!trimmed) return "";

  const prefixMatch = trimmed.match(/^([A-Za-z]+[\s:]+)(.*)$/);
  const prefix = prefixMatch ? prefixMatch[1] : "";
  const dateStr = prefixMatch ? prefixMatch[2].trim() : trimmed;

  // Pattern 1: DD/MM/YYYY or D/M/YYYY or DD/MM/YY
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10);
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + 1);
    const newDay = String(d.getDate()).padStart(slashMatch[1].length === 1 ? 1 : 2, "0");
    const newMonth = String(d.getMonth() + 1).padStart(slashMatch[2].length === 1 ? 1 : 2, "0");
    const newYear = slashMatch[3].length === 2 ? String(d.getFullYear()).slice(-2) : d.getFullYear();
    return `${prefix}${newDay}/${newMonth}/${newYear}`;
  }

  // Pattern 2: DD-MM-YYYY or D-M-YYYY
  const dashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dashMatch) {
    const day = parseInt(dashMatch[1], 10);
    const month = parseInt(dashMatch[2], 10);
    let year = parseInt(dashMatch[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + 1);
    const newDay = String(d.getDate()).padStart(dashMatch[1].length === 1 ? 1 : 2, "0");
    const newMonth = String(d.getMonth() + 1).padStart(dashMatch[2].length === 1 ? 1 : 2, "0");
    const newYear = dashMatch[3].length === 2 ? String(d.getFullYear()).slice(-2) : d.getFullYear();
    return `${prefix}${newDay}-${newMonth}-${newYear}`;
  }

  // Pattern 3: YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + 1);
    const newDay = String(d.getDate()).padStart(2, "0");
    const newMonth = String(d.getMonth() + 1).padStart(2, "0");
    return `${prefix}${d.getFullYear()}-${newMonth}-${newDay}`;
  }

  // Pattern 4: Indonesian month name, e.g. 15 November 2026
  const idMonths = [
    "januari", "februari", "maret", "april", "mei", "juni",
    "juli", "agustus", "september", "oktober", "november", "desember"
  ];
  const textMatch = dateStr.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthIdx = idMonths.indexOf(textMatch[2].toLowerCase());
    if (monthIdx !== -1) {
      const year = parseInt(textMatch[3], 10);
      const d = new Date(year, monthIdx, day);
      d.setDate(d.getDate() + 1);
      const capMonth = idMonths[d.getMonth()].charAt(0).toUpperCase() + idMonths[d.getMonth()].slice(1);
      return `${prefix}${d.getDate()} ${capMonth} ${d.getFullYear()}`;
    }
  }

  // Fallback: Date parse
  const fallbackDate = new Date(dateStr);
  if (!isNaN(fallbackDate.getTime())) {
    fallbackDate.setDate(fallbackDate.getDate() + 1);
    return `${prefix}${fallbackDate.toLocaleDateString("id-ID")}`;
  }

  return rawDate;
}

export default function StokOverviewPage() {
  const [items, setItems] = useState<StokItem[]>([]);
  const [summary, setSummary] = useState<StokSummary | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<
    "connected" | "offline" | "syncing"
  >("offline");
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 2500);

    const handleOnline = () => {
      setFirebaseStatus((prev) => (prev === "offline" ? "syncing" : prev));
    };
    const handleOffline = () => setFirebaseStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    getStokFromDb().then(({ items: initItems, summary: initSummary }) => {
      if (!isMounted) return;
      if (initItems.length > 0) {
        setItems(initItems);
        setSummary(initSummary);
        clearTimeout(safetyTimer);
        setIsLoading(false);
      }
    });

    const unsub = subscribeToStok(
      ({ items: newItems, summary: newSummary }) => {
        if (!isMounted) return;
        setItems(newItems);
        setSummary(newSummary);
        clearTimeout(safetyTimer);
        setIsLoading(false);
        setFirebaseStatus(
          typeof window !== "undefined" && !window.navigator.onLine
            ? "offline"
            : "connected"
        );
      },
      () => {
        if (!isMounted) return;
        clearTimeout(safetyTimer);
        setIsLoading(false);
        if (typeof window !== "undefined" && !window.navigator.onLine) {
          setFirebaseStatus("offline");
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
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

  const tanggal = addOneDay(summary?.tanggal || items[0]?.tanggal || "");

  return (
    <StoreSecurityGate pageTitle="Stok Handphone">
      {isLoading ? (
        <LoadingPage />
      ) : (
        <div className="h-dvh w-full overflow-hidden flex bg-white text-[#18181B] font-sans">
        <StokSidebar
          activeBrand="all"
          brandTotals={brandTotals}
          totalUnits={totalUnits}
          tanggal={tanggal}
          firebaseStatus={firebaseStatus}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          items={items}
        />

        <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-white">
          {/* Top Header */}
          <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-[#ECEBE8] flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* <Link
                href="/"
                className="btn btn-ghost btn-icon -ml-2"
                title="Kembali ke Beranda"
                aria-label="Kembali ke Beranda"
              >
                <ArrowLeft className="size-4" />
              </Link> */}
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-ink truncate leading-tight">
                  Stok Handphone
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Buka menu navigasi"
              className="btn btn-ghost btn-icon md:hidden"
            >
              <Menu className="size-5" />
            </button>
          </header>

          {/* Stretched Brand Cards Grid - Full Width Edge-to-Edge */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 pb-20 w-full">
              {BRAND_LIST.map(({ slug, bgColor, logoColor }) => {
                return (
                  <Link
                    key={slug}
                    href={`/stok/${slug}`}
                    style={{ backgroundColor: bgColor }}
                    className="group relative w-full rounded-2xl p-4 sm:p-5 flex items-center justify-center shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer min-h-[84px] sm:min-h-[92px] overflow-hidden"
                  >
                    <div className="flex items-center justify-center w-full min-w-0">
                      <BrandLogo
                        brand={slug}
                        color={logoColor}
                        className={
                          slug === "xiaomi"
                            ? "h-7 sm:h-8 w-auto"
                            : "h-5 sm:h-6 w-auto max-w-[130px] sm:max-w-[150px]"
                        }
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
      )}
    </StoreSecurityGate>
  );
}
