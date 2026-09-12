import { IST, UPDATE_INTERVAL_HOURS } from '../config';

const istDateFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST, day: '2-digit', month: 'short', year: 'numeric',
});
const istDateShortFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST, day: '2-digit', month: 'short',
});
const istTimeFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST, hour: '2-digit', minute: '2-digit', hour12: true,
});
const istFullFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST, day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: true,
});
const istWeekdayFmt = new Intl.DateTimeFormat('en-IN', { timeZone: IST, weekday: 'long' });

export const istDate = (d: Date | string | number): string => istDateFmt.format(new Date(d));
export const istTime = (d: Date | string | number): string => istTimeFmt.format(new Date(d));
export const istDateShort = (d: Date | string | number): string => istDateShortFmt.format(new Date(d));
export const istFull = (d: Date | string | number): string => istFullFmt.format(new Date(d));
export const istWeekday = (d: Date | string | number): string => istWeekdayFmt.format(new Date(d));

/** YYYY-MM-DD as seen in India. */
export function istDateKey(d: Date | string | number = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(d));
  return parts; // en-CA gives YYYY-MM-DD
}

/** "2h 14m ago" style relative label. */
export function relTime(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return '—';
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function countdown(msLeft: number): string {
  if (msLeft <= 0) return 'any moment';
  const totalMin = Math.floor(msLeft / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Next scheduled run: next 6-hour IST boundary (00/06/12/18 IST ⇒ 18:30Z slots). */
export function nextUpdateAt(now: number = Date.now()): number {
  const IST_OFFSET_MIN = 330; // +05:30
  const istNow = new Date(now + IST_OFFSET_MIN * 60_000);
  const hour = istNow.getUTCHours();
  const nextSlotHour = (Math.floor(hour / UPDATE_INTERVAL_HOURS) + 1) * UPDATE_INTERVAL_HOURS; // 6,12,18,24
  const istNext = Date.UTC(
    istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(),
    nextSlotHour % 24, 0, 0
  ) - IST_OFFSET_MIN * 60_000;
  if (nextSlotHour >= 24) return istNext + 24 * 3600_000; // rolled to next day
  return istNext;
}

export function istSlotKey(now: number = Date.now()): string {
  // Identifies which 6-hour window we're in, e.g. "2026-09-12T06"
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, '0');
  const date = istDateKey(d);
  const hour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: IST, hour: '2-digit', hour12: false,
  }).format(d));
  const slot = Math.floor(hour / UPDATE_INTERVAL_HOURS) * UPDATE_INTERVAL_HOURS;
  return `${date}T${p(slot)}`;
}
