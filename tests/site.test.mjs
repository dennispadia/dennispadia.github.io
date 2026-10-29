import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = new URL('../site/', import.meta.url);
const origin = 'https://dennispadia.github.io/';
const pages = ['index.html', 'projects/markdown-studio/index.html'];
const documents = new Map(await Promise.all(pages.map(async file => [
  file.replace(/index\.html$/, ''),
  await readFile(new URL(file, root), 'utf8'),
])));

test('every page and local resource resolves, including cross-page anchors', async () => {
  for (const [pathname, html] of documents) {
    const url = new URL(pathname, origin);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `Duplicate id in ${pathname}`);
    for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = new URL(value, url);
      if (target.origin !== origin.slice(0, -1)) continue;
      const relative = target.pathname.slice(1);
      const file = relative === '' || relative.endsWith('/') ? `${relative}index.html` : relative;
      assert.ok((await stat(new URL(file, root))).isFile(), `Missing file: ${target}`);
      if (target.hash) {
        const document = documents.get(relative.endsWith('/') ? relative : relative.replace(/index\.html$/, ''));
        assert.ok(document, `Anchor target is not a tested page: ${target}`);
        assert.ok(document.includes(`id="${target.hash.slice(1)}"`), `Missing anchor: ${target}`);
      }
    }
    for (const [, value] of html.matchAll(/<meta[^>]+(?:property|name)="(?:og:image|twitter:image)" content="([^"]+)"/g)) {
      const target = new URL(value);
      assert.equal(target.origin, origin.slice(0, -1));
      assert.ok((await stat(new URL(target.pathname.slice(1), root))).isFile());
    }
  }
});

test('each page has canonical, descriptive metadata and accessible markup', () => {
  for (const [pathname, html] of documents) {
    const url = new URL(pathname, origin).href;
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<meta name="viewport"/);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`));
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, /href="#main">Skip to content/);
    assert.doesNotMatch(html, /noindex|googletagmanager|<script[^>]+src=/);
    for (const [image] of html.matchAll(/<img\b[^>]+>/g)) {
      assert.match(image, /alt="[^"]*"/);
      assert.match(image, /width="\d+"/);
      assert.match(image, /height="\d+"/);
    }
  }
});

test('personal identity and software metadata remain separate and truthful', () => {
  const home = documents.get('');
  assert.match(home, /<h1[^>]*>Dennis Padia/);
  const personData = JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const person = personData['@graph'].find(item => item['@type'] === 'Person');
  assert.equal(person.name, 'Dennis Padia');
  assert.equal(person.url, origin);
  assert.deepEqual(person.sameAs, ['https://github.com/dennispadia']);
  const project = documents.get('projects/markdown-studio/');
  const app = JSON.parse(project.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(app.name, 'Markdown Studio');
  assert.equal(app.url, `${origin}projects/markdown-studio/`);
  assert.equal(app.author.name, person.name);
  assert.equal(app.offers.price, '0');
  assert.equal(app.isAccessibleForFree, true);
  assert.equal(app.aggregateRating, undefined);
  assert.equal(app.review, undefined);
  assert.equal(app.operatingSystem, 'Windows 10 or Windows 11 (x64)');
  assert.ok(app.downloadUrl.includes(`/v${app.softwareVersion}/`));
  assert.ok(project.includes(`href="${app.downloadUrl}"`));
  assert.ok(home.includes(`href="${app.downloadUrl}"`));
  for (const html of [home, project]) {
    assert.match(html, /[Uu]nsigned installer|installer is unsigned/);
    assert.match(html, /without support[^.]*promised maintenance/);
    for (const [, version] of html.matchAll(/releases\/(?:download|tag)\/v([0-9.]+)\//g)) {
      assert.equal(version, app.softwareVersion);
    }
  }
  assert.match(project, /Do not disable security protections/);
});

test('sitemap lists both pages and workflow publishes only static public files', async () => {
  const sitemap = await readFile(new URL('sitemap.xml', root), 'utf8');
  for (const pathname of documents.keys()) {
    assert.ok(sitemap.includes(`<loc>${new URL(pathname, origin).href}</loc>`));
  }
  const robots = await readFile(new URL('robots.txt', root), 'utf8');
  assert.ok(robots.includes(`Sitemap: ${origin}sitemap.xml`));
  const workflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  assert.match(workflow, /path: site\b/);
  assert.match(workflow, /if: github\.ref == 'refs\/heads\/main'/);
  const files = await readdir(root, { recursive: true, withFileTypes: true });
  const allowed = new Set(['.html', '.css', '.svg', '.png', '.xml', '.txt']);
  for (const entry of files.filter(item => item.isFile())) {
    assert.ok(allowed.has(path.extname(entry.name)), `Unexpected public file: ${entry.name}`);
    assert.ok(!entry.name.startsWith('.'), `Hidden public file: ${entry.name}`);
    assert.ok(path.resolve(entry.parentPath).startsWith(path.resolve(fileURLToPath(root))));
  }
});

test('dark theme uses local artwork and honors reduced motion', async () => {
  const css = await readFile(new URL('style.css', root), 'utf8');
  assert.match(css, /color-scheme: dark/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /@import|https?:\/\//);
  for (const [, resource] of css.matchAll(/url\("([^"]+)"\)/g)) {
    assert.ok((await stat(new URL(resource, root))).isFile());
  }
  const social = await readFile(new URL('assets/social-card.png', root));
  assert.equal(social.subarray(1, 4).toString(), 'PNG');
  assert.equal(social.readUInt32BE(16), 1200);
  assert.equal(social.readUInt32BE(20), 630);
});
