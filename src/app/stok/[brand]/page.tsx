import { Suspense } from "react";
import BrandStokClient from "./BrandStokClient";
import LoadingPage from "@/components/LoadingPage";

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

export default function BrandStokPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  return (
    <Suspense fallback={<LoadingPage />}>
      <BrandStokContent params={params} />
    </Suspense>
  );
}
