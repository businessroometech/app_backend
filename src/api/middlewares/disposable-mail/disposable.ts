// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const disposableDomains = new Set(
//   fs
//     .readFileSync(path.join(__dirname, 'mailList.txt'), 'utf8')
//     .split('\n')
//     .map((domain) => domain.trim().toLowerCase())
//     .filter(Boolean)
// );

// export function isDisposable(email: any) {
//   const domain = email.split('@')[1].toLowerCase().trim();
//   return disposableDomains.has(domain);
// }

// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // This will point to dist/api/middlewares/disposable-mail/mailList.txt after build
// const mailListPath = path.join(__dirname, 'mailList.txt');

// const disposableDomains = new Set(
//   fs
//     .readFileSync(mailListPath, 'utf8')
//     .split('\n')
//     .map((domain) => domain.trim().toLowerCase())
//     .filter(Boolean)
// );

// export function isDisposable(email: string): boolean {
//   const domain = email.split('@')[1].toLowerCase().trim();
//   return disposableDomains.has(domain);
// }
