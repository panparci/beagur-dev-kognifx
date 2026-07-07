import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
// ponytail: be/.env holds DATABASE_URL; fe/.env holds auth secrets — load both, fe wins on conflict
dotenv.config({ path: path.resolve(serverDir, '../../be/.env') });
dotenv.config({ path: path.resolve(serverDir, '../.env') });
