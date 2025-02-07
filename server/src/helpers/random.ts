import crypto from 'node:crypto';

export const generateAlphanumeric = (length: number) => {
  const isOdd = length % 2 !== 0;

  // Generate the hex string. We add 1 byte if the length is odd.
  const string = crypto.randomBytes((length + 1) / 2).toString('hex');

  // If the length was odd, we truncate the extra character at the end
  return isOdd ? string.slice(0, length) : string;
};
