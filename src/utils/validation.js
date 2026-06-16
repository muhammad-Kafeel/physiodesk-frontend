// Shared validators — keep registration and profile in sync.
// Pakistani mobile: +923XXXXXXXXX or 03XXXXXXXXX
//   - International:  '+92' + '3' + 9 digits  (13 chars total)
//   - Local:          '0'   + '3' + 9 digits  (11 digits)
export const PHONE_REGEX = /^(\+923\d{9}|03\d{9})$/;

export const isValidPakistaniPhone = (value) => {
  if (!value) return false;
  return PHONE_REGEX.test(String(value).trim());
};

// Returns null if valid, otherwise a human-readable error string.
export const validatePakistaniPhone = (value, { required = true } = {}) => {
  const v = String(value || '').trim();
  if (!v) return required ? 'Phone number is required' : null;
  if (!PHONE_REGEX.test(v)) {
    return 'Enter a valid Pakistani mobile (e.g. +923001234567 or 03001234567)';
  }
  return null;
};

// ── Email validation ────────────────────────────────────────────────────────
// Browser's type="email" only checks for an @ and a dot — it accepts garbage
// like "a@b.c" or "user@gmail.c". We tighten it with:
//   1. A regex that requires a TLD of at least 2 letters.
//   2. A typo dictionary for common provider misspellings (gmial, hotnail, etc.)
//      so we catch fat-finger mistakes that look syntactically valid.
export const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Maps common typos to the correct domain. We *suggest* the fix instead of
// silently rejecting, because some legitimate domains (e.g. gmail.co.uk) look
// odd at a glance.
const DOMAIN_TYPOS = {
  'gmial.com':   'gmail.com',
  'gmai.com':    'gmail.com',
  'gnail.com':   'gmail.com',
  'gamil.com':   'gmail.com',
  'gmail.con':   'gmail.com',
  'gmail.co':    'gmail.com',
  'gmail.cm':    'gmail.com',
  'gmail.c':     'gmail.com',
  'gmail.om':    'gmail.com',
  'yahooo.com':  'yahoo.com',
  'yaho.com':    'yahoo.com',
  'yhaoo.com':   'yahoo.com',
  'yahoo.con':   'yahoo.com',
  'yahoo.co':    'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotnail.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.co':  'hotmail.com',
  'outloook.com':'outlook.com',
  'outlok.com':  'outlook.com',
  'outlook.con': 'outlook.com',
};

export const validateEmail = (value, { required = true } = {}) => {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return required ? 'Email is required' : null;

  // 1. Basic shape check — must have something before @, something after, and a 2+ char TLD.
  if (!EMAIL_REGEX.test(v)) {
    return 'Enter a valid email address (e.g. you@example.com)';
  }

  // 2. Domain-typo check against the small dictionary above.
  const domain = v.split('@')[1];
  if (DOMAIN_TYPOS[domain]) {
    return `Did you mean @${DOMAIN_TYPOS[domain]}?`;
  }

  return null;
};

