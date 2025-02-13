export const defaultTheme = 'dark';

const white = '#fff';
const black = '#000';
const muted = '#0284C7'; // sky 600
const card = '#001224';
const title = '#32edd4';

const colorSet = {
  white,
  black,
  title,
  text: '#7DD3FC', // sky 300
  muted,
  link: title,
  background: '#000812',
  card,
  cardAccent: '#00203b',
  border: '#133352',
  inactive: '#2e5370',
  red: '#FF245B',

  btnPrimaryText: black,
  btnPrimaryBg: '#00c9b5',
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
