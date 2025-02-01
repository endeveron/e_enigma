export function getTime() {
  return new Date().toLocaleTimeString('uk-UA');
}

export const configureMessageDate = (): {
  createdAt: number; // timestamp
  date: {
    day: string; // YYYY-MM-DD
    time: string; // hh:mm
  };
} => {
  const date = new Date();
  const createdAt = date.getTime();
  const day = date.toISOString().split('T')[0];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return {
    createdAt,
    date: {
      day,
      time,
    },
  };
};
