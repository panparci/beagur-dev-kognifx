import type { BankDirection, BankLineInput } from '../services/reconciliationService';

const MONTHS: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

const DATE_RE = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/;
const AMOUNT_RE = /^[+-][\d.,]+$/;
const BANK_ACCT_RE = /^(.+?)\s+(\d{6,})$/;

function parseIdAmount(raw: string): number {
  const s = raw.replace(/^[+-]/, '').trim();
  if (!s) return 0;
  // IDR statement uses dot thousands: 1.000.000,00 or 200.000
  if (/,\d{1,2}$/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s)) {
    const n = Number.parseInt(s.replace(/\./g, '').split(',')[0] ?? '', 10);
    return Number.isFinite(n) ? n : 0;
  }
  // US-style: 1,000,000.00
  const n = Number.parseInt(s.replace(/,/g, '').split('.')[0] ?? '', 10);
  return Number.isFinite(n) ? n : 0;
}

function toIsoDate(day: string, mon: string, year: string): string | null {
  const m = MONTHS[mon.toLowerCase()];
  if (!m) return null;
  return `${year}-${m}-${day.padStart(2, '0')}`;
}

/** Parse Bank Jago "Pockets Transactions History" PDF text into recon lines. */
export function parseJagoStatementText(rawText: string, direction: BankDirection): BankLineInput[] {
  const lines = rawText
    .split(/\n/)
    .map((l) => l.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const wantIncoming = direction === 'INCOMING';
  const out: BankLineInput[] = [];
  let i = 0;

  while (i < lines.length) {
    const dateMatch = lines[i].match(DATE_RE);
    if (!dateMatch) {
      i += 1;
      continue;
    }
    const transactionDate = toIsoDate(dateMatch[1], dateMatch[2], dateMatch[3]);
    if (!transactionDate) {
      i += 1;
      continue;
    }

    let j = i + 1;
    if (j < lines.length && /^\d{1,2}:\d{2}$/.test(lines[j])) j += 1;

    const block: string[] = [];
    while (j < lines.length && !DATE_RE.test(lines[j]) && !AMOUNT_RE.test(lines[j].replace(/\s/g, ''))) {
      if (/^(Date & Time|Source\/Destination|Transaction Details|Notes|Amount|Balance|Page \d|PT Bank Jago|July |August |September |October |November |December |January |February |March |April |May |June )/i.test(lines[j])) {
        j += 1;
        continue;
      }
      block.push(lines[j]);
      j += 1;
      if (block.length > 12) break;
    }

    let amountRaw = '';
    while (j < lines.length) {
      const cand = lines[j].replace(/\s/g, '');
      if (AMOUNT_RE.test(cand)) {
        amountRaw = cand;
        j += 1;
        break;
      }
      if (DATE_RE.test(lines[j])) break;
      block.push(lines[j]);
      j += 1;
    }

    i = j;
    if (!amountRaw || !transactionDate) continue;

    const signed = amountRaw.startsWith('-') ? -1 : 1;
    const amount = parseIdAmount(amountRaw);
    if (amount <= 0) continue;

    const detail = block.join(' ');
    const isIncoming = /Incoming Transfer/i.test(detail);
    const isOutgoing = /Outgoing Transfer/i.test(detail);
    const isPocketMove = /Movement between Pockets/i.test(detail);

    if (isPocketMove) continue;
    if (wantIncoming && (!isIncoming || signed < 0)) continue;
    if (!wantIncoming && (!isOutgoing || signed > 0)) continue;

    let counterpartyName = '';
    let counterpartyAccount = '';
    for (const part of block) {
      if (/Incoming Transfer|Outgoing Transfer|Movement between|ID#|Bea Guru|TRANSFER DANA/i.test(part)) continue;
      const acct = part.match(BANK_ACCT_RE);
      if (acct) {
        counterpartyAccount = acct[2];
        continue;
      }
      if (/^\d{6,}$/.test(part)) {
        counterpartyAccount = part;
        continue;
      }
      if (/^(BCA|BRI|BNI|BTN|Mandiri|CIMB|Permata|Danamon|Bank\b)/i.test(part)) continue;
      if (!counterpartyName) counterpartyName = part;
    }

    out.push({
      transactionDate,
      amount,
      counterpartyName: counterpartyName.trim(),
      counterpartyAccount: counterpartyAccount.trim(),
      description: detail.slice(0, 240),
    });
  }

  return out;
}
