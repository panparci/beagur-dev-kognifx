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

/** Date alone or at start of a pdfjs table row. */
const DATE_START_RE = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:\s+(.*))?$/;
const AMOUNT_IN_LINE_RE = /([+-][\d.,]+)/;
const BANK_ACCT_RE = /^(.+?)\s+(\d{6,})$/;
const SKIP_LINE_RE =
  /^(Date & Time|Source\/Destination|Transaction Details|Notes|Amount|Balance|Page \d|PT Bank Jago|July |August |September |October |November |December |January |February |March |April |May |June )/i;

function parseIdAmount(raw: string): number {
  const s = raw.replace(/^[+-]/, '').trim();
  if (!s) return 0;
  if (/,\d{1,2}$/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s)) {
    const n = Number.parseInt(s.replace(/\./g, '').split(',')[0] ?? '', 10);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number.parseInt(s.replace(/,/g, '').split('.')[0] ?? '', 10);
  return Number.isFinite(n) ? n : 0;
}

function toIsoDate(day: string, mon: string, year: string): string | null {
  const m = MONTHS[mon.toLowerCase()];
  if (!m) return null;
  return `${year}-${m}-${day.padStart(2, '0')}`;
}

/** Header block from Jago PDF: period range + latest balance. */
export type JagoStatementMeta = {
  periodStart: string | null;
  periodEnd: string | null;
  balanceAsOf: string | null;
  latestBalance: number | null;
};

const PERIOD_BAL_RE =
  /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s*-\s*(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+IDR\s+([\d.,]+)/i;
const BALANCE_AS_OF_RE = /Latest Balance per\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/i;

export function parseJagoStatementMeta(rawText: string): JagoStatementMeta {
  const period = rawText.match(PERIOD_BAL_RE);
  const asOf = rawText.match(BALANCE_AS_OF_RE);
  return {
    periodStart: period ? toIsoDate(period[1], period[2], period[3]) : null,
    periodEnd: period ? toIsoDate(period[4], period[5], period[6]) : null,
    balanceAsOf: asOf ? toIsoDate(asOf[1], asOf[2], asOf[3]) : null,
    latestBalance: period ? parseIdAmount(period[7]) || null : null,
  };
}

function isPeriodHeader(rest: string): boolean {
  return /^\s*-\s*\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(rest) || /\bIDR\b/i.test(rest);
}

function isTxnDateLine(line: string): boolean {
  const m = line.match(DATE_START_RE);
  if (!m) return false;
  return !isPeriodHeader((m[4] ?? '').trim());
}

function stripNoise(s: string): string {
  return s
    .replace(AMOUNT_IN_LINE_RE, ' ')
    .replace(/\bIncoming Transfer\b/gi, ' ')
    .replace(/\bOutgoing Transfer\b/gi, ' ')
    .replace(/\bMovement between Pockets\b/gi, ' ')
    .replace(/\bID#\s*\S+/gi, ' ')
    .replace(/\bBea Guru\b/gi, ' ')
    .replace(/\bTRANSFER DANA\b/gi, ' ')
    .replace(/^\d{1,2}:\d{2}\b/, ' ')
    // unsigned balance leftovers: 1.000.000,00 or 14.767.793
    .replace(/\b\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCounterparty(blockParts: string[], blockText: string): { name: string; account: string } {
  let name = '';
  let account = '';

  for (const part of blockParts) {
    const cleaned = stripNoise(part);
    if (!cleaned) continue;

    const acct = cleaned.match(BANK_ACCT_RE);
    if (acct) {
      account = acct[2];
      continue;
    }
    if (/^\d{6,}$/.test(cleaned)) {
      account = cleaned;
      continue;
    }
    if (/^(BCA|BRI|BNI|BTN|Mandiri|CIMB|Permata|Danamon|Bank\b|Jago|Digital)/i.test(cleaned)) continue;

    if (!name) name = cleaned;
  }

  if (!name) {
    const m = stripNoise(blockText).match(/^(.+?)(?:\s+(?:BCA|BRI|BNI|BTN|Mandiri|CIMB|Permata|Danamon|Bank|Jago)|\s+\d{6,}|$)/i);
    if (m?.[1]) name = m[1].trim();
  }
  if (!account) {
    // Prefer account next to bank label; ignore ID# already stripped.
    const cleaned = stripNoise(blockText);
    const withBank = cleaned.match(
      /\b(?:BCA|BRI|BNI|BTN|Mandiri|CIMB|Permata|Danamon|Jago|Bank(?:\s+\w+)*)\s+(\d{6,})\b/i,
    );
    if (withBank) account = withBank[1];
    else {
      const acct = cleaned.match(/\b(\d{6,})\b/);
      if (acct) account = acct[1];
    }
  }

  return { name: name.trim(), account: account.trim() };
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
    const dateMatch = lines[i].match(DATE_START_RE);
    if (!dateMatch || isPeriodHeader((dateMatch[4] ?? '').trim())) {
      i += 1;
      continue;
    }

    const transactionDate = toIsoDate(dateMatch[1], dateMatch[2], dateMatch[3]);
    if (!transactionDate) {
      i += 1;
      continue;
    }

    const blockParts: string[] = [];
    const restAfterDate = (dateMatch[4] ?? '').trim();
    if (restAfterDate) blockParts.push(restAfterDate);

    let j = i + 1;
    let txnTime = '';
    if (j < lines.length && /^\d{1,2}:\d{2}$/.test(lines[j])) {
      txnTime = lines[j];
      j += 1;
    }

    while (j < lines.length && !isTxnDateLine(lines[j])) {
      if (!SKIP_LINE_RE.test(lines[j])) blockParts.push(lines[j]);
      j += 1;
      if (blockParts.length > 16) break;
    }
    i = j;

    if (txnTime && !blockParts.some((p) => /\b\d{1,2}:\d{2}\b/.test(p))) {
      blockParts.unshift(txnTime);
    }
    const blockText = blockParts.join(' ');
    const amountMatch = blockText.match(AMOUNT_IN_LINE_RE);
    if (!amountMatch) continue;

    const amountRaw = amountMatch[1];
    const signed = amountRaw.startsWith('-') ? -1 : 1;
    const amount = parseIdAmount(amountRaw);
    if (amount <= 0) continue;

    const isIncoming = /Incoming Transfer/i.test(blockText);
    const isOutgoing = /Outgoing Transfer/i.test(blockText);
    if (/Movement between Pockets/i.test(blockText)) continue;
    if (wantIncoming && (!isIncoming || signed < 0)) continue;
    if (!wantIncoming && (!isOutgoing || signed > 0)) continue;

    const { name, account } = extractCounterparty(blockParts, blockText);
    out.push({
      transactionDate,
      amount,
      counterpartyName: name,
      counterpartyAccount: account,
      description: blockText.slice(0, 240),
    });
  }

  return out;
}
