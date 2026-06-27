export function parseBankAccount(value: string): { bankName: string; bankAccountNumber: string } {
  const trimmed = value.trim();
  const parts = trimmed.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    return {
      bankName: parts[0].trim(),
      bankAccountNumber: parts.slice(1).join('-').trim(),
    };
  }
  return { bankName: 'BCA', bankAccountNumber: trimmed };
}

export function formatBankAccount(bankName?: string, bankAccountNumber?: string): string {
  if (!bankAccountNumber) return '';
  if (bankName) return `${bankName} - ${bankAccountNumber}`;
  return bankAccountNumber;
}

/** Mask all digits except the last three (for donor/public display). */
export function maskBankAccount(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return value;
  let digitIndex = 0;
  return value.replace(/\d/g, (d) => {
    digitIndex += 1;
    return digitIndex <= digits.length - 3 ? 'x' : d;
  });
}

export function formatMaskedBankAccount(bankName?: string, bankAccountNumber?: string): string {
  if (!bankAccountNumber) return '—';
  const masked = maskBankAccount(bankAccountNumber);
  return bankName ? `${bankName} • ${masked}` : masked;
}
