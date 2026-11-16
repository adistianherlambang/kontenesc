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

async function BrandStokContent({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  return <BrandStokClient brand={brand} />;
}

function BrandStokFallback() {
  return (
    <div className="h-dvh w-full overflow-hidden flex bg-white text-[#18181B] font-sans">
      <aside className="hidden md:flex h-full w-64 shrink-0 flex-col border-r border-line bg-surface">
        <div className="flex min-h-14 sm:min-h-[62px] shrink-0 items-center border-b border-line px-4 sm:px-5">
          <div className="h-4 w-28 bg-subtle rounded animate-pulse" />
        </div>
        <div className="flex-1 p-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-full bg-subtle rounded-xl animate-pulse"
            />
          ))}
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-white">
        <header className="px-3 sm:px-6 py-3 border-b border-[#ECEBE8] flex items-center justify-between shrink-0 bg-white">
          <div className="h-8 w-36 bg-subtle rounded-xl animate-pulse" />
          <div className="h-8 w-28 bg-subtle rounded-xl animate-pulse" />
        </header>

        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4 pb-20 w-full">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl border border-line bg-canvas p-4 sm:p-5 animate-pulse"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BrandStokPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  return (
    <Suspense fallback={<BrandStokFallback />}>
      <BrandStokContent params={params} />
    </Suspense>
  );
}
