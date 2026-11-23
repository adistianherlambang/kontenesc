export default function LoadingPage() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="h-dvh w-full bg-canvas flex items-center justify-center p-4"
    >
      <p className="text-sm font-medium text-muted">Loading</p>
    </main>
  );
}
