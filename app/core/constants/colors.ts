export const defaultTheme = 'dark';

const white = '#fff';
const black = '#000';
const accentBackground = '#ffd6ad';

const monoColors = {
  white,
  text: '#F6F6FA',
  background: '#070d17',
  card: '#131a29',
  brand: '#002d66',
  accent: '#ffe4c9',
  accentBackground,

  btnPrimaryText: black,
  btnBrandText: white,
  btnPrimaryBackground: accentBackground,
  btnSecondaryText: white,

  border: '#2c2f42',
  red: '#ed1561',
  muted: '#6e758a',
};

export const colors = {
  light: monoColors,
  dark: monoColors,
};

export const consoleClors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};
