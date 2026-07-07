/** Format rupiah in jutaan (jt) — matches laporan yayasan. */
export function formatRupiahJt(amount: number): string {
  const jt = amount / 1_000_000;
  return `Rp ${jt.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
}

export function formatRupiahFull(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatPeriodLabel(from: string, to: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };
  return `${fmt(from)} – ${fmt(to)}`;
}

export function yAxisJt(value: number): string {
  if (value === 0) return '0jt';
  return `${Math.round(value / 1_000_000)}jt`;
}
