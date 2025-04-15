import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const disposableDomains = new Set(
  fs
    .readFileSync(path.join(__dirname, 'mailList.txt'), 'utf8')
    .split('\n')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
);

export function isDisposable(email: any) {
  const domain = email.split('@')[1].toLowerCase().trim();
  return disposableDomains.has(domain);
}
