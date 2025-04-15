import { disposableMails } from './data';

export function isDisposable(email: any) {
  const domain = email.split('@')[1].toLowerCase().trim();
  return disposableMails.includes(domain);
}
