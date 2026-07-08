/**
 * KrishiSeva — i18n module.
 * Simple key-path lookup from the active language pack.
 * No external dependency — just a plain module.
 *
 * Usage:
 *   import { t } from '@/i18n';
 *   t('auth.farmerLoginTitle')  // → "Farmer Login"
 */

import en from './en';

const languages = { en };
let activeLang = 'en';

/**
 * Look up a dotted key path in the active language pack.
 * Returns the key itself if not found (makes missing translations visible).
 *
 * @param {string} key — dot-separated path, e.g. 'auth.enterAadhaar'
 * @param {Record<string, string>} [vars] — optional interpolation: {{name}} → vars.name
 * @returns {string}
 */
export function t(key, vars) {
  const parts = key.split('.');
  let value = languages[activeLang];

  for (const part of parts) {
    if (value == null) return key;
    value = value[part];
  }

  if (typeof value !== 'string') return key;

  if (vars) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
  }

  return value;
}

/**
 * Set the active language.
 * @param {'en'} lang
 */
export function setLanguage(lang) {
  if (languages[lang]) {
    activeLang = lang;
  }
}

/**
 * Get the current language code.
 * @returns {string}
 */
export function getLanguage() {
  return activeLang;
}
