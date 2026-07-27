import { parseJagoStatementText } from '../src/modules/admin/utils/jagoStatementParse.ts';

const vertical = `
18 Jul 2025
12:34
YUANDI
Bank SMBC Indonesia
90370136906
Incoming Transfer
ID# 2049639313
+1.000.000,00
1.000.000,00
15 Jul 2026
09:01
YOHANES BANI
BRI 466301026931532
Outgoing Transfer
ID# 260715JAGBIDJA00129945
Bea Guru
-200.000,00
10.000.000,00
16 Jul 2026
10:00
Tabungan Bea Guru
Movement between Pockets
+5.000.000,00
15.000.000,00
`;

const horizontal = `
18 Jul 2025 - 19 Jul 2026 IDR 38.891.726,15
Date & Time Source/Destination Transaction Details Notes Amount Balance
July 2025
18 Jul 2025 YUANDI Incoming Transfer +1.000.000,00 1.000.000,00
13:36 Bank SMBC Indonesia ID# 2049639313
90370136906
18 Jul 2025 ANDY HALIM Incoming Transfer +500.000,00 1.500.000,00
13:37 BCA 0292059009 ID# 2049643886
15 Jul 2026 YOHANES BANI Outgoing Transfer -200.000,00 10.000.000,00
09:01 BRI 466301026931532 ID# 260715JAGBIDJA00129945 Bea Guru
`;

const vIn = parseJagoStatementText(vertical, 'INCOMING');
const vOut = parseJagoStatementText(vertical, 'OUTGOING');
const hIn = parseJagoStatementText(horizontal, 'INCOMING');
const hOut = parseJagoStatementText(horizontal, 'OUTGOING');

console.assert(vIn.length === 1 && vIn[0].amount === 1_000_000 && vIn[0].counterpartyName === 'YUANDI', 'vertical in');
console.assert(vOut.length === 1 && vOut[0].amount === 200_000, 'vertical out');
console.assert(hIn.length === 2 && hIn[0].amount === 1_000_000 && hIn[0].counterpartyAccount === '90370136906', 'horizontal in');
console.assert(hOut.length === 1 && hOut[0].amount === 200_000 && hOut[0].counterpartyName.includes('YOHANES'), 'horizontal out');
console.log('jagoStatementParse ok', { vIn: vIn[0], hIn: hIn[0], hOut: hOut[0] });
