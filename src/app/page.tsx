"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Smartphone,
  BarChart3,
  ArrowRight,
  Store,
  Layers,
  PackageCheck,
  TrendingUp,
} from "lucide-react";
import { getStokFromDb, getLajulFromDb, subscribeToContents } from "@/lib/firebase";

export default function HubPortalPage() {
  const [stokTotal, setStokTotal] = useState<number | null>(null);
  const [lajulUnit, setLajulUnit] = useState<number | null>(null);
  const [contentCount, setContentCount] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState<string>("15/11/2026");

  useEffect(() => {
    // Load live stock count
    getStokFromDb().then(({ summary, items }) => {
      if (summary?.total_units) {
        setStokTotal(summary.total_units);
        if (summary.tanggal) setTanggal(summary.tanggal);
      } else if (items.length > 0) {
        const total = items.reduce((acc, it) => acc + (it.total_stok || 0), 0);
        setStokTotal(total);
      }
    });

    // Load live sales count
    getLajulFromDb().then(({ summary }) => {
      if (summary?.metrics?.unit_terjual !== undefined) {
        setLajulUnit(summary.metrics.unit_terjual);
        if (summary.tanggal) setTanggal(summary.tanggal);
      }
    });

    // Subscribe to content items
    const unsub = subscribeToContents((items) => {
      setContentCount(items.length);
    });

    return () => unsub();
  }, []);

  const ACCESS_MENUS = [
    {
      title: "Konten Hub",
      href: "/konten",
      badge: contentCount !== null ? `${contentCount} Konten` : "Konten Aktif",
      desc: "Manajemen konten Instagram, ekstraksi harga, prompt generator & Excel Toco.",
      icon: Sparkles,
      accentColor: "#1F6FB6",
      bgSoft: "bg-[#1F6FB6]/10",
      textColor: "text-[#1F6FB6]",
      borderColor: "hover:border-[#1F6FB6]/50",
    },
    {
      title: "Stok Handphone",
      href: "/stok",
      badge: stokTotal !== null ? `${stokTotal} Unit Gudang` : "Stok Ready",
      desc: "Laporan persediaan handphone per brand dengan detail variasi warna.",
      icon: Smartphone,
      accentColor: "#059669",
      bgSoft: "bg-[#059669]/10",
      textColor: "text-[#059669]",
      borderColor: "hover:border-[#059669]/50",
    },
    {
      title: "Laporan Penjualan",
      href: "/lajul",
      badge: lajulUnit !== null ? `${lajulUnit} Terjual` : "Laporan Penjualan",
      desc: "Rekap data penjualan harian toko per brand, metode cash & transfer.",
      icon: BarChart3,
      accentColor: "#4F46E5",
      bgSoft: "bg-[#4F46E5]/10",
      textColor: "text-[#4F46E5]",
      borderColor: "hover:border-[#4F46E5]/50",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between overflow-y-auto">
      {/* Top Header */}
      <header className="border-b border-line bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Store className="size-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-ink leading-tight">
                Semarang Cell
              </h1>
              <p className="text-xs text-muted">Portal Sistem Operasional</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-canvas text-xs font-medium text-muted">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span>Online</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full flex-1 flex flex-col justify-center">
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Pusat Akses Operasional
          </h2>
          <p className="text-sm text-muted">
            Pilih menu untuk mengelola konten Instagram, mengecek stok handphone gudang, atau melihat laporan penjualan harian.
          </p>
        </div>

        {/* 3 Action Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {ACCESS_MENUS.map((menu) => {
            const Icon = menu.icon;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`group relative flex flex-col justify-between p-6 rounded-2xl border border-line bg-surface hover:bg-canvas transition-all duration-200 hover:shadow-lg ${menu.borderColor}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`size-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${menu.bgSoft} ${menu.textColor}`}
                    >
                      <Icon className="size-6" />
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold ${menu.bgSoft} ${menu.textColor}`}
                    >
                      {menu.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-ink group-hover:text-brand transition-colors mb-2">
                    {menu.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {menu.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-xs font-semibold text-ink group-hover:text-brand transition-colors">
                  <span>Buka Akses</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Subtle Quick Status Banner */}
        <div className="mt-12 p-4 rounded-xl border border-line bg-surface/50 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">Status Data Terakhir:</span>
            <span>{tanggal ? `Data per ${tanggal}` : "Real-time sync Firestore"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Stok: <strong className="text-ink">{stokTotal ?? "..."} Unit</strong></span>
            <span>Penjualan: <strong className="text-ink">{lajulUnit ?? "..."} Unit</strong></span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-4 bg-surface text-center text-xs text-muted">
        <p>Eldorado Semarang Cell &copy; 2026. All rights reserved.</p>
      </footer>
    </div>
  );
}
