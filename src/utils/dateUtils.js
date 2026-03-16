const formatDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getFloatingHoliday = (year, month, dayOfWeek, occurrence) => {
  let count = 0;
  const date = new Date(Date.UTC(year, month, 1));
  while (date.getUTCMonth() === month) {
    if (date.getUTCDay() === dayOfWeek) {
      count++;
      if (count === occurrence) {
        return date;
      }
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return null;
};

export const getUSHolidaysForYears = (years) => {
  const holidays = new Set();
  const addHoliday = (date) => holidays.add(formatDate(date));

  for (const year of years) {
    const newYear = new Date(Date.UTC(year, 0, 1));
    addHoliday(newYear);
    if (newYear.getUTCDay() === 6) addHoliday(new Date(Date.UTC(year - 1, 11, 31)));
    if (newYear.getUTCDay() === 0) addHoliday(new Date(Date.UTC(year, 0, 2)));

    addHoliday(getFloatingHoliday(year, 0, 1, 3));

    addHoliday(getFloatingHoliday(year, 1, 1, 3));

    const may31 = new Date(Date.UTC(year, 4, 31));
    const memorialDay = new Date(may31);
    memorialDay.setUTCDate(may31.getUTCDate() - ((may31.getUTCDay() + 6) % 7));
    addHoliday(memorialDay);

    const juneteenth = new Date(Date.UTC(year, 5, 19));
    addHoliday(juneteenth);
    if (juneteenth.getUTCDay() === 6) addHoliday(new Date(Date.UTC(year, 5, 18)));
    if (juneteenth.getUTCDay() === 0) addHoliday(new Date(Date.UTC(year, 5, 20)));

    const independenceDay = new Date(Date.UTC(year, 6, 4));
    addHoliday(independenceDay);
    if (independenceDay.getUTCDay() === 6) addHoliday(new Date(Date.UTC(year, 6, 3)));
    if (independenceDay.getUTCDay() === 0) addHoliday(new Date(Date.UTC(year, 6, 5)));

    addHoliday(getFloatingHoliday(year, 8, 1, 1));

    addHoliday(getFloatingHoliday(year, 9, 1, 2));

    const veteransDay = new Date(Date.UTC(year, 10, 11));
    addHoliday(veteransDay);
    if (veteransDay.getUTCDay() === 6) addHoliday(new Date(Date.UTC(year, 10, 10)));
    if (veteransDay.getUTCDay() === 0) addHoliday(new Date(Date.UTC(year, 10, 12)));

    addHoliday(getFloatingHoliday(year, 10, 4, 4));

    const christmasDay = new Date(Date.UTC(year, 11, 25));
    addHoliday(christmasDay);
    if (christmasDay.getUTCDay() === 6) addHoliday(new Date(Date.UTC(year, 11, 24)));
    if (christmasDay.getUTCDay() === 0) addHoliday(new Date(Date.UTC(year, 11, 26)));
  }
  return holidays;
};