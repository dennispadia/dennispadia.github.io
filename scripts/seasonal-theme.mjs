// Applies a calendar-driven seasonal theme to a copy of the static site at deploy time.
// Usage: node scripts/seasonal-theme.mjs --source site --out _site [--date YYYY-MM-DD]
import { appendFile, cp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const TIME_ZONE = 'America/Los_Angeles';

// Hindu lunisolar festivals move every year. Dates (MM-DD) follow published panchang calendars.
// Add each new year before it starts; the build warns when a year is missing.
export const LUNAR_DATES = {
  2026: { holi: '03-04', janmashtami: '09-04', ganesh: '09-14', navratri: ['10-11', '10-20'], diwali: '11-08' },
  2027: { holi: '03-22', janmashtami: '08-25', ganesh: '09-04', navratri: ['09-30', '10-09'], diwali: '10-29' },
  2028: { holi: '03-11', janmashtami: '08-13', ganesh: '08-23', navratri: ['09-18', '09-27'], diwali: '10-17' },
  2029: { holi: '02-28', janmashtami: '09-01', ganesh: '09-12', navratri: ['10-07', '10-16'], diwali: '11-04' },
  2030: { holi: '03-19', janmashtami: '08-21', ganesh: '09-01', navratri: ['09-26', '10-05'], diwali: '10-25' },
};

const palette = (accent, from, to, glowA, glowB, border) => ({ accent, from, to, glowA, glowB, border });

export const THEMES = {
  'new-year': { emoji: '✨', note: 'Happy New Year', colors: palette('#c9d6ea', '#23344f', '#101b2c', '#2b3f6188', '#8fa7c71a', '#8fa7c766') },
  'valentine': { emoji: '💝', note: 'Season of warmth', colors: palette('#e7a7b4', '#4a2230', '#2a121b', '#4a223070', '#e7a7b414', '#e7a7b455') },
  'spring': { emoji: '🌱', note: 'Hello, spring', colors: palette('#a9d5a0', '#24452a', '#112718', '#2a4a3070', '#a9d5a014', '#a9d5a055') },
  'blossom': { emoji: '🌸', note: 'Spring blossoms', colors: palette('#efb7cf', '#4a2a3c', '#2a1622', '#4a2a3c70', '#a9d5a014', '#efb7cf55') },
  'bloom': { emoji: '🌼', note: 'Bloom season', colors: palette('#f0d27a', '#3f3a1c', '#24210f', '#4a422070', '#a9d5a014', '#f0d27a55') },
  'summer': { emoji: '☀️', note: 'Hello, summer', colors: palette('#7fd6cf', '#174a48', '#0b2a2a', '#1d4a4a80', '#f0d27a14', '#7fd6cf55') },
  'summer-sky': { emoji: '🌤️', note: 'Summer skies', colors: palette('#8fc4f0', '#1d3d5c', '#0e2236', '#1f405f80', '#f0d27a14', '#8fc4f055') },
  'late-summer': { emoji: '🌻', note: 'Late summer', colors: palette('#f2b866', '#4a3418', '#2a1d0c', '#4a341870', '#f2b86614', '#f2b86655') },
  'autumn': { emoji: '🍂', note: 'Hello, autumn', colors: palette('#e09a62', '#4a2c18', '#28170c', '#4a2c1870', '#e09a6214', '#e09a6255') },
  'halloween': { emoji: '🎃', note: 'Happy Halloween', colors: palette('#f28c38', '#3d2350', '#1e1029', '#3d235088', '#f28c381c', '#f28c3866') },
  'gratitude': { emoji: '🍁', note: 'Season of gratitude', colors: palette('#d9894f', '#47291a', '#26150c', '#47291a70', '#d9894f14', '#d9894f55') },
  'christmas': { emoji: '🎄', note: 'Merry Christmas', colors: palette('#e8c66a', '#174a2c', '#0b2a17', '#5a1a1f66', '#174a2c40', '#e8c66a66') },
  'holi': { emoji: '🎨', note: 'Happy Holi', colors: palette('#ff8fc8', '#4b2160', '#1f3b52', '#5a1f5a88', '#3fc8b01c', '#ff8fc866') },
  'independence-us': { emoji: '🎆', note: 'Happy 4th of July', colors: palette('#9cc3ff', '#3a1d2a', '#14243f', '#1c2f5a88', '#c23b4a1c', '#9cc3ff66') },
  'independence-india': { emoji: '🪁', note: 'Happy Independence Day, India', colors: palette('#ffad5c', '#4a2c12', '#123d24', '#5a331488', '#2e8b4f22', '#ffad5c66') },
  'janmashtami': { emoji: '🦚', note: 'Happy Janmashtami', colors: palette('#7fd3e6', '#173d5c', '#0d2a2e', '#1a3f6088', '#e8c66a1a', '#7fd3e666') },
  'ganesh': { emoji: '🌺', note: 'Happy Ganesh Chaturthi', colors: palette('#ffb347', '#5a2412', '#2e1208', '#5a241288', '#ffb3471c', '#ffb34766') },
  'navratri': { emoji: '💃', note: 'Happy Navratri', colors: palette('#ff7a7a', '#5a1838', '#2a0c1c', '#5a183888', '#ffc95c1c', '#ff7a7a66') },
  'diwali': { emoji: '🪔', note: 'Happy Diwali', colors: palette('#ffc95c', '#5a2a12', '#2e1208', '#5a2a1288', '#ffc95c1c', '#ffc95c66') },
  'thanksgiving': { emoji: '🦃', note: 'Happy Thanksgiving', colors: palette('#e3a253', '#4a2f17', '#28180b', '#4a2f1780', '#e3a25318', '#e3a25366') },
};

const MONTHLY = ['new-year', 'valentine', 'spring', 'blossom', 'bloom', 'summer', 'summer-sky', 'late-summer', 'autumn', 'halloween', 'gratitude', 'christmas'];

const DAY = 86_400_000;
const utc = (year, month, day) => Date.UTC(year, month - 1, day);
const at = (year, monthDay) => { const [month, day] = monthDay.split('-').map(Number); return utc(year, month, day); };

export function localDate(now = new Date(), timeZone = TIME_ZONE) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(now).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) throw new Error(`Expected a date in YYYY-MM-DD format, got "${value}"`);
  const [year, month, day] = match.slice(1).map(Number);
  const check = new Date(utc(year, month, day));
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) throw new Error(`Invalid date: ${value}`);
  return { year, month, day };
}

export function thanksgiving(year) {
  const firstWeekday = new Date(utc(year, 11, 1)).getUTCDay();
  return 1 + ((4 - firstWeekday + 7) % 7) + 21;
}

// Festival windows, in priority order: the first match wins, otherwise the month's theme applies.
export function selectTheme({ year, month, day }) {
  const today = utc(year, month, day);
  const within = (start, end) => today >= start && today <= end;
  const around = (date, before, after) => within(date - before * DAY, date + after * DAY);
  const lunar = LUNAR_DATES[year];
  if (lunar) {
    if (around(at(year, lunar.diwali), 2, 2)) return 'diwali';
    if (within(at(year, lunar.navratri[0]), at(year, lunar.navratri[1]))) return 'navratri';
    if (around(at(year, lunar.ganesh), 0, 10)) return 'ganesh';
    if (around(at(year, lunar.janmashtami), 1, 1)) return 'janmashtami';
    if (around(at(year, lunar.holi), 2, 1)) return 'holi';
  }
  if (month === 7 && day >= 1 && day <= 5) return 'independence-us';
  if (month === 8 && day >= 14 && day <= 16) return 'independence-india';
  if (month === 11 && Math.abs(day - thanksgiving(year)) <= 3) return 'thanksgiving';
  return MONTHLY[month - 1];
}

export function themeCss(id) {
  const { accent, from, to, glowA, glowB, border } = THEMES[id].colors;
  const scope = `html[data-season="${id}"]`;
  return `
    ${scope} body { background: radial-gradient(ellipse 75% 650px at 85% 4%, ${glowA} 0%, transparent 80%), radial-gradient(ellipse 55% 500px at 10% 12%, ${glowB} 0%, transparent 75%), #111416; background-repeat: no-repeat; }
    ${scope} header { border-color: ${border}; }
    ${scope} .home svg, ${scope} .start .icon { background: linear-gradient(135deg, ${from}, ${to}); color: ${accent}; border-color: ${border}; }
    ${scope} nav a:hover, ${scope} h1 span { color: ${accent}; }
    ${scope} .project:hover { border-color: ${border}; }
    ${scope} .season-note { display: inline-flex; align-items: center; gap: 8px; margin: 18px 0 0 .25em; padding: 6px 14px; border: 1px solid ${border}; border-radius: 999px; background: linear-gradient(135deg, ${from}, ${to}); color: ${accent}; font-size: 12px; letter-spacing: .4px; }
  `;
}

export function applyTheme(html, id, { note = false } = {}) {
  const theme = THEMES[id];
  if (!theme) throw new Error(`Unknown theme: ${id}`);
  let output = html.replace('<html lang="en">', `<html lang="en" data-season="${id}">`);
  output = output.replace('</style>', `${themeCss(id)}</style>`);
  if (note) {
    output = output.replace('<p class="intro">Principal Software Architect at Microsoft</p>',
      match => `${match}\n          <p class="season-note"><span aria-hidden="true">${theme.emoji}</span>${theme.note}</p>`);
    if (!output.includes('class="season-note"')) throw new Error('Could not place the seasonal note on the homepage');
  }
  if (!output.includes(`data-season="${id}"`)) throw new Error('Could not apply the seasonal theme');
  return output;
}

async function main(args) {
  const option = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
  const source = option('--source') ?? 'site';
  const out = option('--out') ?? '_site';
  const requested = option('--date') || process.env.SEASON_DATE;
  const date = requested ? parseDate(requested) : localDate();
  for (const year of [date.year, date.year + 1]) {
    if (!LUNAR_DATES[year]) console.log(`::warning::Festival dates for ${year} are missing; add them to LUNAR_DATES in scripts/seasonal-theme.mjs.`);
  }
  const id = selectTheme(date);
  await rm(out, { recursive: true, force: true });
  await cp(source, out, { recursive: true });
  for (const [page, note] of [['index.html', true], [path.join('lekh', 'index.html'), false]]) {
    const file = path.join(out, page);
    await writeFile(file, applyTheme(await readFile(file, 'utf8'), id, { note }));
  }
  const stamp = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  console.log(`Applied "${id}" theme for ${stamp} (${TIME_ZONE}).`);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `season=${id}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main(process.argv.slice(2));
}
