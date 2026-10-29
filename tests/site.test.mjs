import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = new URL('../site/', import.meta.url);
const origin = 'https://dennispadia.github.io/';
const html = await readFile(new URL('index.html', root), 'utf8');
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];

test('local links, images, fonts, and anchors resolve', async () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate page id');
  for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = new URL(value, origin);
    if (target.origin !== new URL(origin).origin) continue;
    const file = target.pathname === '/' ? 'index.html' : target.pathname.slice(1);
    assert.ok((await stat(new URL(file, root))).isFile(), `Missing file: ${target}`);
    if (target.hash) assert.ok(ids.includes(target.hash.slice(1)), `Missing anchor: ${target}`);
  }
  for (const [, resource] of css.matchAll(/url\("([^"]+)"\)/g)) {
    assert.ok((await stat(new URL(resource, root))).isFile(), `Missing CSS resource: ${resource}`);
  }
});

test('homepage has descriptive metadata, social images, and accessible content', async () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="viewport"/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.ok(html.includes(`<link rel="canonical" href="${origin}">`));
  assert.ok(html.includes(`<meta property="og:url" content="${origin}">`));
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /href="#main">Skip to content/);
  assert.doesNotMatch(html, /noindex/);
  for (const [image] of html.matchAll(/<img\b[^>]+>/g)) {
    assert.match(image, /alt="[^"]*"/);
    assert.match(image, /width="\d+"/);
    assert.match(image, /height="\d+"/);
  }
  for (const [, value] of html.matchAll(/<meta[^>]+(?:property|name)="(?:og:image|twitter:image)" content="([^"]+)"/g)) {
    const target = new URL(value);
    assert.equal(target.origin, new URL(origin).origin);
    assert.ok((await stat(new URL(target.pathname.slice(1), root))).isFile());
  }
  const social = await readFile(new URL('assets/social-card.png', root));
  assert.equal(social.subarray(1, 4).toString(), 'PNG');
  assert.equal(social.readUInt32BE(16), 1200);
  assert.equal(social.readUInt32BE(20), 630);
});

test('identity, portrait, and approved About me text are accurate', async () => {
  const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const person = data['@graph'].find(item => item['@type'] === 'Person');
  assert.equal(person.name, 'Dennis Padia');
  assert.equal(person.jobTitle, 'Principal Software Architect');
  assert.equal(person.worksFor.name, 'Microsoft');
  assert.equal(person.url, origin);
  assert.deepEqual(person.sameAs, [
    'https://github.com/dennispadia',
    'https://www.linkedin.com/in/dennispadia/',
  ]);
  assert.equal(person.image, `${origin}assets/dennis-padia.jpg`);
  assert.ok((await stat(new URL('assets/dennis-padia.jpg', root))).size > 0);
  const about = html.match(/<section class="about"[\s\S]*?<\/section>/)[0];
  assert.match(about, /<img class="portrait"/);
  assert.doesNotMatch(html.match(/<section class="hero"[\s\S]*?<\/section>/)[0], /class="portrait"/);
  assert.match(html, /<h1>Dennis<br>Padia/);
  assert.match(html, /<p class="intro">Principal Software Architect at Microsoft<\/p>/);
  assert.match(html, /<h2 class="label" id="about-heading">About me<\/h2>/);
  assert.match(html, /designing and validating distributed systems for mission-critical workloads like SAP/);
  assert.match(html, /specialized compute, storage, networking, and operating systems, with a strong focus on performance and resiliency/);
  assert.ok(html.indexOf('id="about"') > html.indexOf('id="projects"'));
});

test('project cards and quick links follow the approved order without release maintenance', () => {
  assert.match(html, /<h2>Projects<\/h2>/);
  const projects = [...html.matchAll(/<a class="project(?: project--text)?" href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(projects, [
    'https://github.com/Azure/sap-automation-qa',
    'https://github.com/dennispadia/MarkdownStudio',
  ]);
  assert.match(html, /Microsoft project &nbsp; \/ &nbsp; SAP on Azure/);
  const quickLinks = html.match(/<div class="start">([\s\S]*?)<\/div>/)[1];
  const destinations = [...quickLinks.matchAll(/<a href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(destinations, [
    '#about', '#projects', 'https://github.com/dennispadia', 'https://www.linkedin.com/in/dennispadia/',
  ]);
  assert.match(css, /\.project-list \{[^}]*grid-auto-rows: 1fr/);
  assert.doesNotMatch(html, /Selected projects|A little about me|A good place to start|<footer\b|Version \d|v\d+\.\d+\.\d+|releases\/(?:download|tag)\//);
});

test('approved styling uses self-hosted assets and no tracking or executable scripts', async () => {
  assert.match(css, /color-scheme: dark/);
  assert.match(css, /font-family: Montserrat/);
  assert.match(css, /@font-face \{[^}]*font-weight: 300/);
  assert.doesNotMatch(css, /@import|https?:\/\//);
  assert.doesNotMatch(html, /<script(?! type="application\/ld\+json")|<iframe\b|googletagmanager|goatcounter|nightfall/i);
  for (const [, source] of html.matchAll(/<img[^>]*src="([^"]+)"/g)) {
    assert.equal(new URL(source, origin).origin, new URL(origin).origin);
  }
  const fontLicense = await readFile(new URL('assets/fonts/Montserrat-OFL.txt', root), 'utf8');
  assert.match(fontLicense, /SIL OPEN FONT LICENSE Version 1\.1/);
  const iconLicense = await readFile(new URL('assets/Feather-LICENSE.txt', root), 'utf8');
  assert.match(iconLicense, /MIT License/);
});

test('sitemap and deployment include only the approved static site', async () => {
  const sitemap = await readFile(new URL('sitemap.xml', root), 'utf8');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(locations, [origin]);
  const robots = await readFile(new URL('robots.txt', root), 'utf8');
  assert.ok(robots.includes(`Sitemap: ${origin}sitemap.xml`));
  const workflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  assert.match(workflow, /path: site\b/);
  assert.match(workflow, /if: github\.ref == 'refs\/heads\/main'/);
  const files = await readdir(root, { recursive: true, withFileTypes: true });
  const allowed = new Set(['.html', '.svg', '.png', '.jpg', '.ttf', '.xml', '.txt']);
  const pages = [];
  for (const entry of files.filter(item => item.isFile())) {
    assert.ok(allowed.has(path.extname(entry.name)), `Unexpected public file: ${entry.name}`);
    assert.ok(!entry.name.startsWith('.'), `Hidden public file: ${entry.name}`);
    if (path.extname(entry.name) === '.html') pages.push(entry.name);
  }
  assert.deepEqual(pages, ['index.html'], 'Do not publish earlier unapproved pages');
});
