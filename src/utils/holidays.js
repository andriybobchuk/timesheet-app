import { format, getYear, setYear, parseISO } from 'date-fns';

const getEasterDate = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const getMovableHolidays = (year) => {
  const easter = getEasterDate(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  
  return {
    [format(easter, 'yyyy-MM-dd')]: 'Wielkanoc',
    [format(easterMonday, 'yyyy-MM-dd')]: 'Poniedziałek Wielkanocny',
    [format(corpusChristi, 'yyyy-MM-dd')]: 'Boże Ciało',
  };
};

export const getPolishHolidays = (year) => {
  const fixedHolidays = {
    [`${year}-01-01`]: 'Nowy Rok',
    [`${year}-01-06`]: 'Trzech Króli',
    [`${year}-05-01`]: 'Święto Pracy',
    [`${year}-05-03`]: 'Święto Konstytucji 3 Maja',
    [`${year}-08-15`]: 'Wniebowzięcie NMP',
    [`${year}-11-01`]: 'Wszystkich Świętych',
    [`${year}-11-11`]: 'Święto Niepodległości',
    [`${year}-12-25`]: 'Boże Narodzenie',
    [`${year}-12-26`]: 'Drugi Dzień Świąt',
  };
  
  const movableHolidays = getMovableHolidays(year);
  
  return { ...fixedHolidays, ...movableHolidays };
};

export const isHoliday = (date) => {
  const year = getYear(date);
  const holidays = getPolishHolidays(year);
  const dateStr = format(date, 'yyyy-MM-dd');
  return holidays[dateStr] || null;
};