# SEO & AI Search

The site targets people looking for a shul, synagogue, or minyan in Woodmere and the Five Towns. This follows the same setup as the Campus Connect waitlist site.

## What's in place

- **Titles and descriptions** on every public page name the shul type (Sephardic shul, synagogue, minyan) and the place (Woodmere, Five Towns). Titles stay under 60 characters and descriptions under 160.
- **Canonical URLs** use `https://ksswoodmere.org`. The `www` host redirects to it, so a `www` canonical would send search engines to a redirect.
- **Open Graph and Twitter cards** on every public page. They use `assets/og-share-card.jpg` (1200×630).
- **JSON-LD `@graph`** on every public page: `Synagogue` (address, zip, email, map, and the Five Towns as `areaServed`), `WebSite`, and `WebPage`. Subpages also get a `BreadcrumbList`.
- **`FAQPage` schema** on `/community-info`, built from the visible FAQ. The UI test fails if the schema and the page text differ.
- **`robots.txt`, `sitemap.xml`, `llms.txt`** are static files at the root. The staff page stays out of the sitemap and keeps its `noindex` tag. `robots.txt` doesn't block it, so crawlers can see that tag.

`tests/ui-static.test.js` checks all of the above.

## When you change the site

- If you edit a public page's `<head>`, also edit its copy in the route folder (`schedule.html` and `minyanim/index.html`, and so on). The tests require the two files to match.
- If you add a public page, add it to `sitemap.xml`, `llms.txt`, and `publicPages` in the UI test.
- If you edit the community FAQ, update the matching `FAQPage` entry in the same commit.

## Manual steps (not code, highest impact)

1. **Google Business Profile.** Claim or create the listing for Kehilat Shaare Shalom at 22 Andover Lane, Woodmere. Set the category to "Synagogue" and link the website. Searches like "shul near me" and "synagogue in Woodmere" mostly show map results, and the map results come from this profile.
2. **Google Search Console.** Verify `ksswoodmere.org` and submit `/sitemap.xml`.
3. **Bing Webmaster Tools.** Import the site from Search Console and submit the sitemap. ChatGPT search and Copilot use Bing's index.
4. **Directory listings.** Get listed on Five Towns and Jewish community sites, such as local shul directories and the Five Towns Jewish Times, and use the same name, address, and website everywhere. Consistent third-party mentions help AI answers cite the shul.
