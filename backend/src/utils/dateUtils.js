export const getLocalMidnightUTC = (date = new Date()) => {
  const localMidnight = new Date(date);
  localMidnight.setHours(0, 0, 0, 0);
  const offsetMs = localMidnight.getTimezoneOffset() * 60 * 1000;
  return new Date(localMidnight.getTime() - offsetMs);
};

export const getLocalDayRangeUTC = (date = new Date()) => {
  const start = getLocalMidnightUTC(date);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};
