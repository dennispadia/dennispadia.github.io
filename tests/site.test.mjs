import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../site/', import.meta.url);
const origin = 'https://dennispadia.github.io/';
const html = await readFile(new URL('index.html', root), 'utf8');
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const productOrigin = new URL('MarkdownStudio/', origin).href;
const productHtml = await readFile(new URL('MarkdownStudio/index.html', root), 'utf8');

test('local links, images, fonts, and anchors resolve', async () => {
  for (const [pageUrl, markup] of [[origin, html], [productOrigin, productHtml]]) {
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `Duplicate page id: ${pageUrl}`);
    for (const [, value] of markup.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = new URL(value, pageUrl);
      if (target.origin !== new URL(origin).origin) continue;
      const file = target.pathname.slice(1) + (target.pathname.endsWith('/') ? 'index.html' : '');
      const localFile = new URL(file, root);
      assert.ok((await stat(localFile)).isFile(), `Missing file: ${target}`);
      if (target.hash) {
        const destination = await readFile(localFile, 'utf8');
        const destinationIds = [...destination.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
        assert.ok(destinationIds.includes(target.hash.slice(1)), `Missing anchor: ${target}`);
      }
    }
    const styles = markup.match(/<style>([\s\S]*?)<\/style>/)[1];
    for (const [, resource] of styles.matchAll(/url\("([^"]+)"\)/g)) {
      const target = new URL(resource, pageUrl);
      assert.equal(target.origin, new URL(origin).origin, `External CSS resource: ${resource}`);
      assert.ok((await stat(new URL(target.pathname.slice(1), root))).isFile(), `Missing CSS resource: ${resource}`);
    }
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
  const social = await readFile(new URL('assets/social-preview.png', root));
  assert.equal(social.subarray(1, 4).toString(), 'PNG');
  assert.equal(social.readUInt32BE(16), 1200);
  assert.equal(social.readUInt32BE(20), 630);
});

test('identity and approved About me text remain accurate without a portrait', async () => {
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
  assert.equal(person.image, undefined);
  assert.doesNotMatch(html, /portrait|dennis-padia\.jpg|social-card\.png/);
  await assert.rejects(stat(new URL('assets/dennis-padia.jpg', root)), { code: 'ENOENT' });
  await assert.rejects(stat(new URL('assets/social-card.png', root)), { code: 'ENOENT' });
  assert.match(html, /<h1>Dennis<br>Padia/);
  assert.match(html, /<p class="intro">Principal Software Architect at Microsoft<\/p>/);
  assert.match(html, /<h2 class="label" id="about-heading">About me<\/h2>/);
  assert.match(html, /designing and validating distributed systems for mission-critical workloads like SAP/);
  assert.match(html, /specialized compute, storage, networking, and operating systems, with a strong focus on performance and resiliency/);
  assert.ok(html.indexOf('id="about"') > html.indexOf('id="projects"'));
});

test('project cards and quick links follow the approved order without release maintenance', () => {
  assert.match(html, /<h2>Projects<\/h2>/);
  const projectSection = html.match(/<section class="projects" id="projects">([\s\S]*?)<\/section>/)[1];
  const projects = [...projectSection.matchAll(/<a class="project(?: project--text)?" href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(projects, [
    'https://github.com/Azure/sap-automation-qa',
    '/MarkdownStudio/',
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

test('blog card links to the full Microsoft Tech Community profile after projects', () => {
  const blog = html.match(/<section class="blog" id="blog" aria-labelledby="blog-heading">([\s\S]*?)<\/section>/)[1];
  assert.match(blog, /<h2 id="blog-heading">Blog<\/h2>/);
  assert.match(blog, /<a class="project" href="https:\/\/techcommunity\.microsoft\.com\/users\/dennispadia\/763911">/);
  assert.match(blog, /<h3>Microsoft Tech Community <span/);
  assert.doesNotMatch(blog, /My blog on Microsoft Tech Community/);
  assert.ok(html.indexOf('id="blog"') > html.indexOf('id="projects"'));
  assert.ok(html.indexOf('id="blog"') < html.indexOf('id="about"'));
});

test('portfolio uses square desktop cards, matching local icons, and a mobile stack', () => {
  assert.match(css, /\.portfolio \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.project \{[^}]*aspect-ratio: 1/);
  assert.match(css, /\.project-name img \{[^}]*width: 44px; height: 44px/);
  const icons = [...html.matchAll(/<img src="assets\/([^"]+)" width="44" height="44" alt="">/g)].map(match => match[1]);
  assert.deepEqual(icons, ['sap-framework.svg', 'markdown-studio.svg', 'tech-community.svg']);
  const mobile = css.slice(css.indexOf('@media (max-width: 700px)'));
  assert.match(mobile, /\.project-list \{ grid-template-columns: 1fr; \}/);
  assert.match(mobile, /\.blog \.project \{ width: 100%; \}/);
  assert.doesNotMatch(html, /project-shot|project--text/);
});

test('all card icons share the approved emerald, ivory, and gold palette', async () => {
  for (const name of ['sap-framework.svg', 'markdown-studio.svg', 'tech-community.svg']) {
    const svg = await readFile(new URL(`assets/${name}`, root), 'utf8');
    assert.match(svg, /<stop stop-color="#194c44"/);
    assert.match(svg, /<stop offset="1" stop-color="#092b2b"/);
    assert.match(svg, /fill="#e4eee1"/);
    assert.match(svg, /stroke="#dcbc7d"/);
    assert.doesNotMatch(svg, /<script|https?:\/\/(?!www\.w3\.org\/2000\/svg)/);
  }
});

test('quick-link icons use matching decorative emerald-and-gold badges', () => {
  const quickLinks = html.match(/<div class="start">([\s\S]*?)<\/div>/)[1];
  const icons = [...quickLinks.matchAll(/<span class="icon icon--([^"]+)" aria-hidden="true">/g)].map(match => match[1]);
  assert.deepEqual(icons, ['about', 'projects', 'github', 'linkedin']);
  assert.match(css, /\.start \.icon \{[^}]*width: 32px; height: 32px; flex-shrink: 0/);
  assert.match(css, /\.start \.icon \{[^}]*background: linear-gradient\(135deg, #194c44, #092b2b\); color: #dcbc7d/);
  assert.match(css, /\.start \.icon svg rect, \.start \.icon svg circle \{ fill: none; stroke: currentColor; stroke-width: 1\.3; \}/);
  assert.doesNotMatch(css, /\.icon--(?:about|projects|github|linkedin) \{[^}]*background:/);
});

test('refined navigation includes Blog and uses the approved charcoal-slate finish', () => {
  const nav = html.match(/<nav aria-label="Main navigation">([\s\S]*?)<\/nav>/)[1];
  assert.deepEqual([...nav.matchAll(/<a href="([^"]+)"/g)].map(match => match[1]), [
    '#projects', '#blog', '#about', 'https://github.com/dennispadia',
  ]);
  assert.match(html, /<meta name="theme-color" content="#111416">/);
  assert.match(css, /body \{ display: flow-root;[^}]*background: radial-gradient\(/);
  assert.match(css, /header \{[^}]*height: 58px;[^}]*background: linear-gradient\(110deg, #1b2728, #191f22 48%, #191c1e\)/);
  assert.match(css, /\.home svg \{[^}]*width: 30px; height: 30px/);
});

test('mobile navigation separates the home badge and keeps readable links on one line', () => {
  const mobile = css.slice(css.indexOf('@media (max-width: 700px)'));
  assert.match(mobile, /header \{[^}]*gap: 10px/);
  assert.match(mobile, /\.home \{ flex-shrink: 0; min-width: 40px; min-height: 44px/);
  assert.match(mobile, /nav \{ flex: 1; min-width: 0; justify-content: space-between; gap: 8px/);
  assert.match(mobile, /nav a \{[^}]*min-height: 44px;[^}]*font-size: 11px; letter-spacing: 0; text-transform: none; white-space: nowrap/);
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

test('product navigation matches the homepage capsule on desktop and mobile', () => {
  const productCss = productHtml.match(/<style>([\s\S]*?)<\/style>/)[1];
  const declarations = (styles, selector) => {
    const result = {};
    for (const [, selectors, body] of styles.matchAll(/(?:^|\n)\s*([^{}\n]+)\{([^{}]*)\}/g)) {
      if (!selectors.split(',').map(value => value.trim()).includes(selector)) continue;
      for (const declaration of body.split(';').filter(value => value.trim())) {
        const colon = declaration.indexOf(':');
        result[declaration.slice(0, colon).trim()] = declaration.slice(colon + 1).trim();
      }
    }
    return result;
  };
  for (const selector of ['.wrap', 'header', '.home', '.home svg', 'nav', 'nav a']) {
    const expected = declarations(css.split('@media')[0], selector);
    const actual = declarations(productCss.split('@media')[0], selector);
    if (selector === 'header') {
      assert.equal(actual['line-height'], '1.65');
      delete actual['line-height'];
    }
    assert.deepEqual(actual, expected, `Desktop ${selector}`);
    const marker = '@media (max-width: 700px)';
    assert.ok(productCss.includes(marker));
    assert.deepEqual(
      declarations(productCss.slice(productCss.indexOf(marker)), selector),
      declarations(css.slice(css.indexOf(marker)), selector),
      `Mobile ${selector}`,
    );
  }
  assert.match(productHtml, /href="#features">Features/);
  assert.match(productHtml, /href="#download">Download/);
});

test('Markdown Studio page has its own canonical URL, screenshots, and software metadata', async () => {
  assert.match(productHtml, /<html lang="en">/);
  assert.match(productHtml, /<meta name="viewport"/);
  assert.equal((productHtml.match(/<h1\b/g) ?? []).length, 1);
  assert.ok(productHtml.includes(`<link rel="canonical" href="${productOrigin}">`));
  assert.ok(productHtml.includes(`<meta property="og:url" content="${productOrigin}">`));
  assert.match(productHtml, /href="#main">Skip to content/);
  assert.doesNotMatch(productHtml, /noindex|<footer\b|<iframe\b|<script(?! type="application\/ld\+json")/);
  const data = JSON.parse(productHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data['@type'], 'SoftwareApplication');
  assert.equal(data.name, 'Markdown Studio');
  assert.equal(data.url, productOrigin);
  assert.equal(data.operatingSystem, 'Windows 10/11 x64');
  assert.equal(data.isAccessibleForFree, true);
  assert.equal(data.aggregateRating, undefined);
  const screenshots = [...productHtml.matchAll(/<img class="screenshot"[^>]+>/g)].map(match => match[0]);
  assert.equal(screenshots.length, 3);
  for (const image of screenshots) {
    assert.match(image, /alt="[^"]+"/);
    assert.match(image, /width="1440" height="1000"/);
    const source = image.match(/src="([^"]+)"/)[1];
    const target = new URL(source, productOrigin);
    assert.equal(target.origin, new URL(origin).origin);
    const bytes = await readFile(new URL(target.pathname.slice(1), root));
    assert.equal(bytes.readUInt32BE(16), 1440);
    assert.equal(bytes.readUInt32BE(20), 1000);
  }
  for (const [, value] of productHtml.matchAll(/<meta[^>]+(?:property|name)="(?:og:image|twitter:image)" content="([^"]+)"/g)) {
    const target = new URL(value);
    assert.equal(target.origin, new URL(origin).origin);
    assert.ok((await stat(new URL(target.pathname.slice(1), root))).isFile());
  }
  assert.doesNotMatch(productHtml, /googletagmanager|goatcounter|@import/);
});

test('product download links stay version-independent and preserve safety and support policies', () => {
  const links = [...productHtml.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  const releases = links.filter(value => value.includes('/releases/'));
  assert.equal(releases.length, 2);
  assert.ok(releases.every(value => value === 'https://github.com/dennispadia/MarkdownStudio/releases/latest'));
  assert.doesNotMatch(productHtml, /v?\d+\.\d+\.\d+|releases\/(?:download|tag)\//);
  assert.match(productHtml, /source ZIP and SHA-256 checksums/);
  assert.match(productHtml, /installer is unsigned/);
  assert.match(productHtml, /application and MSI are not code-signed/);
  assert.match(productHtml, /Do not disable security protections/);
  assert.match(productHtml, /shared as-is, without support or promised maintenance/);
  assert.match(productHtml, /Independent forks are welcome, including AI-assisted changes/);
  for (const document of ['LICENSE', 'SUPPORT.md', 'CONTRIBUTING.md', 'docs/USER_GUIDE.md', 'docs/BUILDING.md']) {
    assert.ok(links.includes(`https://github.com/dennispadia/MarkdownStudio/blob/main/${document}`));
  }
});

test('sitemap and deployment include only the approved static site', async () => {
  const sitemap = await readFile(new URL('sitemap.xml', root), 'utf8');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(locations, [origin, productOrigin]);
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
    if (path.extname(entry.name) === '.html') {
      pages.push(path.relative(fileURLToPath(root), path.join(entry.parentPath, entry.name)).split(path.sep).join('/'));
    }
  }
  assert.deepEqual(pages.sort(), ['MarkdownStudio/index.html', 'google9f96fa2206ac2708.html', 'index.html'], 'Only the approved portfolio, product page, and Google verification file may be published');
});

test('Google Search Console verification file retains its required content', async () => {
  const verification = await readFile(new URL('google9f96fa2206ac2708.html', root), 'utf8');
  assert.equal(verification.trimEnd(), 'google-site-verification: google9f96fa2206ac2708.html');
});
