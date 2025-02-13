const CUR_API_VERSION = '1';
const SERVER_URL =
  process.env.SERVER_URL || process.env.EXPO_PUBLIC_SERVER_URL || '';

const AUTH_NAME =
  process.env.AUTH_EMAIL || process.env.EXPO_PUBLIC_AUTH_NAME || '';
const AUTH_EMAIL =
  process.env.AUTH_EMAIL || process.env.EXPO_PUBLIC_AUTH_EMAIL || '';
const AUTH_PASSWORD =
  process.env.AUTH_PASSWORD || process.env.EXPO_PUBLIC_AUTH_PASSWORD || '';

// Fetching
const BASE_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

// Router
const MAIN_REDIRECT_URL = '/';

// Local DB
const LOCAL_DB_NAME = 'messenger.db';

// Events
const EVENT_HISTORY_LENGTH = 5;

export {
  CUR_API_VERSION,
  AUTH_NAME,
  AUTH_EMAIL,
  AUTH_PASSWORD,
  BASE_HEADERS,
  MAIN_REDIRECT_URL,
  SERVER_URL,
  LOCAL_DB_NAME,
  EVENT_HISTORY_LENGTH,
};
