export function TabFallback({ label = 'Memuat tab…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-[24vh]">
      <div className="w-7 h-7 border-2 border-bea-copper border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-bea-sage-muted">{label}</p>
    </div>
  );
}
