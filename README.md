# Dennis Padia

Personal website: **https://dennispadia.github.io/**

A dark, minimalist portfolio with self-hosted Montserrat Light typography,
a professional introduction and two open-source projects:
SAP Testing Automation Framework and Markdown Studio, plus a blog card linking
to Dennis's Microsoft Tech Community profile. Plain HTML and CSS;
no build dependencies, analytics, cookies, or external font/image requests.

## Editing and publishing

- [Homepage](site/index.html): content, metadata, structured data, and responsive styles.
- [Public assets](site/assets): font and license, icons, text-only social card, and app screenshot.
- [Sitemap](site/sitemap.xml) and [crawler policy](site/robots.txt).
- [Validation](tests/site.test.mjs): links, metadata, identity, project order, privacy, and asset checks.

Run `node --test tests/site.test.mjs` with Node.js 22.15 or newer. No installation
or build step is needed. Serve `site` with a local static HTTP server to preview.
Check desktop and mobile layouts, including equal project-card dimensions.

Push to `main`. [Publish website](.github/workflows/pages.yml) validates and deploys
**only `site`** to GitHub Pages. Repository **Settings > Pages > Source** must be
**GitHub Actions**. The deployment environment is `github-pages`; deployment runs
only from `main`. Hosting uses the free public GitHub Pages address.

Keep SAP Testing Automation Framework first and Markdown Studio second. The
cards link to their respective repositories. Do not hard-code application
versions or version-specific downloads: releases are managed by each project.
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

Verification and sitemap submission require access to the owner's Google account.
Metadata and verification do not guarantee indexing or search rankings.

## License and privacy

Website source is MIT licensed; see [LICENSE](LICENSE).
Use of names and trademarks does not imply endorsement. The site and social
preview do not include a personal portrait.

- Montserrat is distributed under the [SIL Open Font License](site/assets/fonts/Montserrat-OFL.txt).
- The GitHub outline icon is from [Feather](https://github.com/feathericons/feather)
  under its [MIT license](site/assets/Feather-LICENSE.txt).
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
