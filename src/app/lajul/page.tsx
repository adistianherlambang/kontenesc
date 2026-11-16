"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  LajulBrandDoc,
  LajulSummary,
  subscribeToLajul,
  getLajulFromDb,
} from "@/lib/firebase";

const ORDERED_BRAND_KEYS = [
  "samsung",
  "xiaomi",
  "vivo",
  "oppo",
  "infinix",
  "realme",
  "tecno",
  "nokia",
  "acc",
];

function formatNumber(val: number | string): string {
  if (val === undefined || val === null || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString("id-ID");
}

export default function LajulPage() {
  const [brands, setBrands] = useState<LajulBrandDoc[]>([]);
  const [summary, setSummary] = useState<LajulSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLajulFromDb().then(({ brands: initBrands, summary: initSummary }) => {
      if (initBrands.length > 0) {
        setBrands(initBrands);
        setSummary(initSummary);
        setIsLoading(false);
      }
    });

    const unsub = subscribeToLajul(({ brands: newBrands, summary: newSummary }) => {
      setBrands(newBrands);
      setSummary(newSummary);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const tanggal = summary?.tanggal || brands[0]?.tanggal || "";

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => {
      const idxA = ORDERED_BRAND_KEYS.indexOf(a.brand_key.toLowerCase());
      const idxB = ORDERED_BRAND_KEYS.indexOf(b.brand_key.toLowerCase());
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [brands]);

  const metrics = summary?.metrics;

  return (
    <div className="min-h-dvh bg-canvas flex flex-col overflow-y-auto">
      <header className="border-b border-line bg-canvas sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="btn btn-ghost btn-icon -ml-2"
              aria-label="Kembali"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="text-sm font-semibold text-ink">Total Penjualan</h1>
            {tanggal && (
              <span className="text-xs text-faint">&middot; {tanggal}</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 w-full flex-1 space-y-6">
        {/* Ringkasan */}
        {metrics && (
          <div className="rounded-xl border border-line bg-surface px-4 py-3.5 grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-muted">Unit Terjual</p>
              <p className="text-sm font-semibold text-ink mt-0.5">
                {metrics.unit_terjual}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Cash</p>
              <p className="text-sm font-semibold text-ink mt-0.5">
                {metrics.cash}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Transfer</p>
              <p className="text-sm font-semibold text-ink mt-0.5">
                {metrics.transfer}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Debit</p>
              <p className="text-sm font-semibold text-ink mt-0.5">
                {metrics.debit}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-muted">Total Payment</p>
              <p className="text-sm font-semibold text-ink mt-0.5">
                {metrics.total_payment}
              </p>
            </div>
          </div>
        )}

        {/* Tabel per Brand */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted">
            Memuat data...
          </div>
        ) : (
          <div className="space-y-5">
            {sortedBrands.map((brandDoc) => {
              const txList = brandDoc.transaksi || [];
              const isNoSell = brandDoc.no_sell || txList.length === 0;

              return (
                <section key={brandDoc.brand_key} className="space-y-2">
                  <h2 className="text-xs font-semibold text-ink px-0.5">
                    {brandDoc.brand_name}
                  </h2>

                  <div
                    tabIndex={0}
                    role="region"
                    aria-label={`Tabel ${brandDoc.brand_name}`}
                    className="rounded-xl border border-line bg-canvas overflow-x-auto"
                  >
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="th w-12 text-center">No</th>
                          <th className="th">Rincian</th>
                          <th className="th w-20">User</th>
                          <th className="th w-24">Metode</th>
                          <th className="th w-24 text-right">Harga</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isNoSell ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-3 text-center text-xs text-faint"
                            >
                              No Sell
                            </td>
                          </tr>
                        ) : (
                          txList.map((tx, idx) => (
                            <tr
                              key={idx}
                              className="last:[&>td]:border-b-0 hover:bg-subtle/50"
                            >
                              <td className="td text-center text-muted">
                                {tx.no ?? idx + 1}
                              </td>
                              <td className="td font-medium">{tx.rincian}</td>
                              <td className="td text-muted">{tx.user || "-"}</td>
                              <td className="td text-muted">{tx.metode}</td>
                              <td className="td text-right font-medium">
                                {formatNumber(tx.harga)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
