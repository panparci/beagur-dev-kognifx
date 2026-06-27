export function AppLoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 h-screen bg-bea-ivory">
      <div className="w-8 h-8 border-2 border-bea-copper border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-bea-sage-muted">Memuat sesi...</p>
    </div>
  );
}
