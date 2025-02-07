export const defaultTheme = 'dark';

const white = '#fff';
const black = '#000';
const muted = '#0284C7'; // sky 600
const card = '#001a2b';

const colorSet = {
  white,
  text: '#7DD3FC', // sky 300
  title: '#2DD4BF', // teal 400
  textAlt: '#67E8F9', // cyan 300
  muted,
  background: '#000812',
  card,
  cardAlt: '#002b4f',
  border: card,
  inactive: '#4c6b8f',
  red: '#FF245B',

  btnPrimaryText: black,
  btnPrimaryBg: '#22D3EE', // cyan 400
  btnSecondaryText: muted,
  btnSecondaryBg: card,
};

export const colors = {
  light: colorSet,
  dark: colorSet,
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
