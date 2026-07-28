import type { BankStatementUpload, BankTransactionLine } from '../services/reconciliationService';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format ISO date like Jago PDF: 18 Jul 2025 */
export function formatJagoDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const mon = MON[Number(m[2]) - 1];
  return mon ? `${Number(m[3])} ${mon} ${m[1]}` : iso;
}

export function formatIdrSigned(amount: number, direction: 'INCOMING' | 'OUTGOING'): string {
  const n = amount.toLocaleString('id-ID');
  return direction === 'OUTGOING' ? `-${n}` : `+${n}`;
}

export function formatIdrPlain(amount: number): string {
  return amount.toLocaleString('id-ID');
}

const BANK_RE =
  /\b(Bank\s+[A-Za-z][\w.]*(?:\s+[A-Za-z][\w.]*){0,3}|BCA(?:\s+Digital)?|BRI|BNI|BTN|Mandiri|CIMB|Permata|Danamon|Jago|Seabank|KEB Hana Bank)\b/i;

/** Derive PDF-like columns from stored recon line (works for existing uploads). */
export function jagoLineDisplay(line: BankTransactionLine) {
  const desc = (line.description || '').replace(/\bID#\s*\S+/gi, ' ');
  const time = desc.match(/\b(\d{1,2}:\d{2})\b/)?.[1] ?? '';
  const detail = /Outgoing Transfer/i.test(line.description)
    ? 'Outgoing Transfer'
    : /Incoming Transfer/i.test(line.description)
      ? 'Incoming Transfer'
      : line.direction === 'OUTGOING'
        ? 'Outgoing Transfer'
        : 'Incoming Transfer';
  const notes = line.description.match(/\b(Bea Guru|TRANSFER DANA)\b/i)?.[1] ?? '';
  const txnId = line.description.match(/\bID#\s*(\S+)/i)?.[1] ?? '';
  const bank = desc.match(BANK_RE)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
  return {
    dateLabel: formatJagoDate(line.transactionDate),
    time,
    bank,
    detail,
    notes,
    txnId,
  };
}

/** Period from PDF header when available; IDR figure = sum of Amount column (not PDF saldo). */
export function jagoReviewSummary(lines: BankTransactionLine[], upload?: BankStatementUpload | null) {
  if (lines.length === 0 && !upload?.periodStart) return null;
  const dates = lines.map((l) => l.transactionDate).sort();
  const matched = lines.filter((l) => l.matchStatus === 'MATCHED').length;
  const amountTotal = lines.reduce((s, l) => s + l.amount, 0);
  const fromIso = upload?.periodStart || dates[0] || '';
  const toIso = upload?.periodEnd || dates[dates.length - 1] || '';
  const asOfIso = upload?.balanceAsOf || dates[dates.length - 1] || toIso;
  return {
    from: fromIso ? formatJagoDate(fromIso) : '—',
    to: toIso ? formatJagoDate(toIso) : '—',
    count: lines.length,
    matched,
    amountTotal,
    balanceAsOf: asOfIso ? formatJagoDate(asOfIso) : null,
    /** PDF header saldo — hanya pembanding, bukan angka utama. */
    pdfLatestBalance: upload?.latestBalance ?? null,
  };
}
