"use client";

import React from "react";
import Link from "next/link";
import { Layers, Smartphone, BarChart3, ChevronRight } from "lucide-react";

const MENUS = [
  {
    label: "Konten",
    href: "/konten",
    icon: Layers,
  },
  {
    label: "Stok",
    href: "/stok",
    icon: Smartphone,
  },
  {
    label: "Laporan Penjualan",
    href: "/lajul",
    icon: BarChart3,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="px-1">
          <h1 className="text-base font-semibold text-ink">Semarang Cell</h1>
        </div>

        <nav className="space-y-2">
          {MENUS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-subtle active:bg-line/60"
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4 text-muted" />
                <span>{label}</span>
              </span>
              <ChevronRight className="size-4 text-faint" />
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
