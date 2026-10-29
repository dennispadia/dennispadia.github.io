# Dennis Padia

Personal website: **https://dennispadia.github.io/**

A lightweight, responsive portfolio with a Dennis Padia homepage and a dedicated
[Markdown Studio project page](https://dennispadia.github.io/projects/markdown-studio/).
Plain HTML and CSS; no external fonts, analytics, dependencies, or application runtime.

## Editing and publishing

- [Homepage](site/index.html): personal introduction and featured projects.
- [Project page](site/projects/markdown-studio/index.html): features, screenshots, downloads, installation guidance, and FAQs.
- [Shared styles](site/style.css): dark cinematic layouts, system typography, project cards, responsive layouts, and reduced-motion support.
- [Public assets](site/assets): personal identity, app icon, social card, and actual app screenshots.
- [Sitemap](site/sitemap.xml) and [crawler policy](site/robots.txt).

The moonlit landscape is original SVG artwork in [nightfall.svg](site/assets/nightfall.svg).
It uses no franchise imagery, logos, characters, or external image services.

Run `node --test tests/site.test.mjs` with Node.js 22.15 or newer. No installation
or build step is needed. Serve `site` with a local static HTTP server and check
desktop and mobile layouts before publishing.

Push to `main`. [Publish website](.github/workflows/pages.yml) validates and deploys
**only `site`** to GitHub Pages. Repository **Settings > Pages > Source** must be
**GitHub Actions**. The protected deployment environment is `github-pages`;
deployment runs only from `main`. Hosting uses the free public GitHub Pages
address, with no paid custom domain or service.

When adding projects, update the homepage and sitemap. Do not invent biography,
credentials, ratings, reviews, or project claims.

For Markdown Studio updates, verify the public release first, then update visible
versions, download/release/checksum links, screenshots, and SoftwareApplication
data together. Preserve unsigned warnings until the specific linked installer is
actually signed. Its MIT/as-is/no-support policy remains in effect.

Screenshot and application-icon sources:
[dennispadia/MarkdownStudio](https://github.com/dennispadia/MarkdownStudio),
MIT licensed. The site does not embed or execute the desktop application.

## Google Search Console

1. Sign in to https://search.google.com/search-console/.
2. Add the URL-prefix property `https://dennispadia.github.io/`.
3. Add Google's HTML verification tag to the homepage `head`, or place its HTML
   verification file in `site`. Publish, then verify ownership.
4. Submit `https://dennispadia.github.io/sitemap.xml`.
5. Inspect the homepage and project page and request indexing once.

Verification requires access to the owner's Google account. No verification
token is currently configured. Metadata and structured data do not guarantee
Google indexing, ranking, or rich results; never fabricate app reviews or ratings.

## License and privacy

Website source is MIT licensed; see [LICENSE](LICENSE). Markdown Studio has its
[own license](https://github.com/dennispadia/MarkdownStudio/blob/main/LICENSE)
and [support policy](https://github.com/dennispadia/MarkdownStudio/blob/main/SUPPORT.md).
The site adds no analytics, ads, cookies, or third-party scripts. GitHub hosts it
under its [Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).
