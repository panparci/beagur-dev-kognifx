import { parseJagoStatementText } from '../src/modules/admin/utils/jagoStatementParse.ts';

const sample = `
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

const inn = parseJagoStatementText(sample, 'INCOMING');
const out = parseJagoStatementText(sample, 'OUTGOING');

console.assert(inn.length === 1 && inn[0].amount === 1_000_000 && inn[0].counterpartyName === 'YUANDI', 'incoming');
console.assert(out.length === 1 && out[0].amount === 200_000 && out[0].counterpartyName === 'YOHANES BANI', 'outgoing');
console.assert(inn[0].counterpartyAccount === '90370136906', 'account');
console.log('jagoStatementParse ok', { inn: inn[0], out: out[0] });
