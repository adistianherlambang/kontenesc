import { Suspense } from "react";
import BrandStokClient from "./BrandStokClient";

export function generateStaticParams() {
  return [
    { brand: "samsung" },
    { brand: "xiaomi" },
    { brand: "vivo" },
    { brand: "oppo" },
    { brand: "infinix" },
    { brand: "realme" },
    { brand: "tecno" },
    { brand: "nokia" },
  ];
}

export default async function BrandStokPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center p-8 text-xs text-muted">
          Memuat data stok...
        </div>
      }
    >
      <BrandStokClient brand={brand} />
    </Suspense>
  );
}
