# Dennis Padia

Personal website: **https://dennispadia.github.io/**

A dark, minimalist portfolio with self-hosted Montserrat Light typography,
a professional introduction and two open-source projects:
SAP Testing Automation Framework and Markdown Studio, plus a blog card linking
to Dennis's Microsoft Tech Community profile. Plain HTML and CSS;
no build dependencies, analytics, cookies, or external font/image requests.

## Editing and publishing

- [Homepage](site/index.html): content, metadata, structured data, and responsive styles.
- [Markdown Studio page](site/MarkdownStudio/index.html): features, application
  screenshots, installation and safety notes, and links to the latest release.
- [Public assets](site/assets): font and license, icons, text-only social card, and app screenshot.
- [Sitemap](site/sitemap.xml) and [crawler policy](site/robots.txt).
- [Validation](tests/site.test.mjs): links, metadata, identity, project order, privacy, and asset checks.

Run `node --test tests/site.test.mjs` with Node.js 22.15 or newer. No installation
or build step is needed. Serve `site` with a local static HTTP server to preview.
Check desktop and mobile layouts, including equal project-card dimensions.
The desktop portfolio has three square cards: two under Projects and one under
Blog. On tablets, Blog moves below Projects; on phones, all cards stack and use
a 320px minimum height so text can grow without clipping. Icons are 44px:
a systems cube, the existing quill, and an open book, all sharing emerald
backgrounds, ivory artwork, and gold accents.
Card descriptions use bottom-aligned metadata without screenshot thumbnails.
The four hero quick links use matching 32px emerald badges with fine gold artwork,
coordinated with Markdown Studio's emerald-and-gold icon.
The background is charcoal with a faint, desaturated slate glow and a subtle warm
counterbalance. The capsule navigation uses a restrained slate-emerald tint,
a gold home badge, and direct Projects, Blog, About, and GitHub links.
Mobile navigation uses larger, title-case labels on one line, 44px-high touch
targets, and a dedicated gap after the home badge. Check the GitHub arrow and
badge spacing at 320px as well as typical phone widths.

Push to `main`. [Publish website](.github/workflows/pages.yml) validates and deploys
**only `site`** to GitHub Pages. Repository **Settings > Pages > Source** must be
**GitHub Actions**. The deployment environment is `github-pages`; deployment runs
only from `main`. Hosting uses the free public GitHub Pages address.

Keep SAP Testing Automation Framework first and Markdown Studio second. The
SAP card links to its repository; Markdown Studio links to
`https://dennispadia.github.io/MarkdownStudio/` (case-sensitive), with its own
GitHub and latest-release links. Do not hard-code application
versions or version-specific downloads: releases are managed by each project.
The product page links to GitHub's `/releases/latest`, not a versioned MSI
filename. Publishing a new standard release updates that destination without a
website edit, build dependency, or runtime API request. Drafts and prereleases
are not the latest standard release. Screenshots describe the demonstrated
features rather than claiming to show the newest build.
When adding projects, update the cards and count. The About me section remains
below the projects and blog card. Keep the blog card linked to the full
Microsoft Tech Community profile so readers can find all posts without maintaining
individual article links here. The approved design has no footer or entrance animation.

This is a personal portfolio, not an official Microsoft website. A project
listing does not imply sole authorship or transfer ownership. Do not invent
biography, credentials, ratings, reviews, or project claims.

## Google Search Console

1. Sign in to https://search.google.com/search-console/.
2. Add the URL-prefix property `https://dennispadia.github.io/`.
3. The supplied [HTML verification file](site/google9f96fa2206ac2708.html) is
   published at `https://dennispadia.github.io/google9f96fa2206ac2708.html`.
   Select **Verify** for the HTML-file method in Search Console. Keep this file
   published after verification so Google can recheck ownership.
4. Submit `https://dennispadia.github.io/sitemap.xml`.
5. Inspect the homepage and request indexing once.

The sitemap lists both the portfolio homepage and `/MarkdownStudio/`. The
product page is a static HTML page in this repository, not a separate project
Pages deployment. When first published, inspect that URL in Search Console
and optionally request indexing; no separate sitemap submission is needed.

Verification and sitemap submission require access to the owner's Google account.
Metadata and verification do not guarantee indexing or search rankings.

## License and privacy

Website source is MIT licensed; see [LICENSE](LICENSE).
Use of names and trademarks does not imply endorsement. The site and social
preview do not include a personal portrait.

- Montserrat is distributed under the [SIL Open Font License](site/assets/fonts/Montserrat-OFL.txt).
- The GitHub outline icon is from [Feather](https://github.com/feathericons/feather)
  under its [MIT license](site/assets/Feather-LICENSE.txt).
- The [systems cube](site/assets/sap-framework.svg) and
  [open book](site/assets/tech-community.svg) are custom website artwork,
  not official SAP or Microsoft logos.
- The app icon and screenshot are from
  [Markdown Studio](https://github.com/dennispadia/MarkdownStudio), MIT licensed.
  Its [license](https://github.com/dennispadia/MarkdownStudio/blob/main/LICENSE)
  and [support policy](https://github.com/dennispadia/MarkdownStudio/blob/main/SUPPORT.md)
  remain unchanged. The site does not embed or execute the desktop application.
- SAP Testing Automation Framework remains maintained in its
  [Microsoft-owned repository](https://github.com/Azure/sap-automation-qa).

The site adds no analytics, ads, cookies, or third-party scripts. Assets are
hosted locally rather than embedded from LinkedIn or Google Fonts. GitHub hosts
the site under its [Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).
