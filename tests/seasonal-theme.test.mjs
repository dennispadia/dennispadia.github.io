import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  THEMES, LUNAR_DATES, applyTheme, localDate, parseDate, selectTheme, thanksgiving,
} from '../scripts/seasonal-theme.mjs';

const on = value => selectTheme(parseDate(value));

test('every month has a default theme', () => {
  const expected = ['new-year', 'valentine', 'spring', 'blossom', 'bloom', 'summer', 'summer-sky', 'late-summer', 'autumn', 'halloween', 'gratitude', 'christmas'];
  // 2031 has no lunar dates configured, so only monthly defaults and fixed holidays apply.
  for (const [index, id] of expected.entries()) {
    assert.equal(on(`2031-${String(index + 1).padStart(2, '0')}-10`), id);
  }
});

test('fixed-date holidays use their own themes', () => {
  assert.equal(on('2026-10-31'), 'halloween');
  assert.equal(on('2026-12-25'), 'christmas');
  assert.equal(on('2026-07-04'), 'independence-us');
  assert.equal(on('2026-07-06'), 'summer-sky');
  assert.equal(on('2026-08-15'), 'independence-india');
  assert.equal(on('2026-08-17'), 'late-summer');
});

test('Thanksgiving is the fourth Thursday of November', () => {
  assert.equal(thanksgiving(2026), 26);
  assert.equal(thanksgiving(2027), 25);
  assert.equal(thanksgiving(2030), 28);
  assert.equal(on('2026-11-26'), 'thanksgiving');
  assert.equal(on('2026-11-23'), 'thanksgiving');
  assert.equal(on('2026-11-30'), 'gratitude');
});

test('lunar festivals follow the configured calendar', () => {
  assert.equal(on('2026-03-04'), 'holi');
  assert.equal(on('2026-09-04'), 'janmashtami');
  assert.equal(on('2026-09-14'), 'ganesh');
  assert.equal(on('2026-09-24'), 'ganesh');
  assert.equal(on('2026-10-11'), 'navratri');
  assert.equal(on('2026-10-20'), 'navratri');
  assert.equal(on('2026-11-06'), 'diwali');
  assert.equal(on('2026-11-10'), 'diwali');
  assert.equal(on('2027-10-29'), 'diwali');
  assert.equal(on('2027-10-31'), 'diwali');
  assert.equal(on('2027-11-01'), 'gratitude');
  assert.equal(on('2028-08-14'), 'janmashtami');
  assert.equal(on('2028-08-15'), 'independence-india');
  assert.equal(on('2029-02-28'), 'holi');
});

test('lunar calendar entries are valid and ordered within each year', () => {
  for (const [year, dates] of Object.entries(LUNAR_DATES)) {
    const ordered = [dates.holi, dates.janmashtami, dates.ganesh, dates.navratri[0], dates.navratri[1], dates.diwali]
      .map(value => parseDate(`${year}-${value}`)).map(({ month, day }) => month * 100 + day);
    assert.deepEqual(ordered, [...ordered].sort((a, b) => a - b), `Festival order for ${year}`);
  }
});

test('every theme is complete and every selectable theme exists', () => {
  for (const [id, theme] of Object.entries(THEMES)) {
    assert.ok(theme.emoji && theme.note, id);
    for (const value of Object.values(theme.colors)) assert.match(value, /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/, id);
  }
  for (let time = Date.UTC(2026, 0, 1); time < Date.UTC(2032, 0, 1); time += 86_400_000) {
    const date = new Date(time);
    const id = selectTheme({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
    assert.ok(THEMES[id], `${date.toISOString()} -> ${id}`);
  }
});

test('dates use the website time zone and reject invalid input', () => {
  assert.deepEqual(localDate(new Date('2026-11-01T06:00:00Z')), { year: 2026, month: 10, day: 31 });
  assert.throws(() => parseDate('2026-02-30'));
  assert.throws(() => parseDate('31-10-2026'));
});

test('themes are applied without changing identity or adding scripts', async () => {
  const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
  const themed = applyTheme(html, 'diwali', { note: true });
  assert.match(themed, /<html lang="en" data-season="diwali">/);
  assert.match(themed, /<p class="season-note"><span aria-hidden="true">🪔<\/span>Happy Diwali<\/p>/);
  assert.match(themed, /html\[data-season="diwali"\] \.start \.icon/);
  assert.match(themed, /html\[data-season="diwali"\] \.project, [^{]+\{ border-color: #ffc95c66;/);
  assert.match(themed, /html\[data-season="diwali"\] \.hero::after \{ content: "🪔";/);
  assert.equal((themed.match(/<style>/g) ?? []).length, 1);
  assert.equal((themed.match(/<script/g) ?? []).length, 1);
  assert.ok(themed.includes('<p class="intro">Principal Software Architect at Microsoft</p>'));
  const product = await readFile(new URL('../site/lekh/index.html', import.meta.url), 'utf8');
  const themedProduct = applyTheme(product, 'diwali');
  assert.match(themedProduct, /data-season="diwali"/);
  assert.doesNotMatch(themedProduct, /season-note">/);
  assert.throws(() => applyTheme(html, 'unknown'));
});
