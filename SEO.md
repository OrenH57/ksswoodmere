# SEO & AI Search

The site targets people looking for a shul, synagogue, or minyan in Woodmere and the Five Towns. This follows the same setup as the Campus Connect waitlist site.

## What's in place

- **Titles and descriptions** on every public page name the shul type (Sephardic shul, synagogue, minyan) and the place (Woodmere, Five Towns). Titles stay under 60 characters and descriptions under 160.
- **Canonical URLs** use `https://ksswoodmere.org`. The `www` host redirects to it, so a `www` canonical would send search engines to a redirect.
- **Open Graph and Twitter cards** on every public page. They use `assets/og-share-card.jpg` (1200×630).
- **JSON-LD `@graph`** on every public page: `Synagogue` (address, zip, email, map, and the Five Towns as `areaServed`), `WebSite`, and `WebPage`. Subpages also get a `BreadcrumbList`.
- **`FAQPage` schema** on `/community-info`, built from the visible FAQ. The UI test fails if the schema and the page text differ.
- **`robots.txt`, `sitemap.xml`, `llms.txt`** are static files at the root. The staff page stays out of the sitemap and keeps its `noindex` tag. `robots.txt` doesn't block it, so crawlers can see that tag.

- **Minyan times as structured data.** `/` and `/minyanim` carry a second JSON-LD block (`#minyan-schedule-schema`) with one `Event` per regular minyan, each with the days it runs and its start time in `America/New_York`. `script.js` rewrites that block whenever the bulletin or a board update loads, so the published times are the real ones rather than the defaults in the HTML.
- **A minyan FAQ on `/minyanim`**, written around what people actually search ("is there a minyan near me in Woodmere today"), with matching `FAQPage` schema.

`tests/ui-static.test.js` checks all of the above.

## Target searches

Google Autocomplete data for this area (September 2026) ranks these highest:

1. `minyan near me` and its variants (`minyan near me now`, `minyan near me open now`, `daily minyan near me`, `mincha minyan near me`, `sephardic minyan near me`), plus `shul near me` and `shul near me open now`. These return map results, so the Google Business Profile decides whether the shul appears, not the site.
2. `shuls in woodmere ny`, `five towns shuls`, `sephardic shul woodmere`, `synagogue in woodmere`. Note the plural "shuls" — that's what people type. `/minyanim` and `/` target these.
3. `candle lighting woodmere ny`, `shabbat times woodmere`, `when does shabbat end woodmere`, `five towns eruv map`, `five towns mikvah`. High-frequency repeat searches. The site already computes zmanim and lists the eruv and mikvah info, but nothing targets these queries yet — a dedicated Woodmere Shabbat times page is the next win.
4. People also search by street or nickname (`edward ave shul woodmere`, `irving place minyan woodmere`), so keep "22 Andover Lane" in visible text, not only in the schema.

## When you change the site

- If you edit a public page's `<head>`, also edit its copy in the route folder (`schedule.html` and `minyanim/index.html`, and so on). The tests require the two files to match.
- If you add a public page, add it to `sitemap.xml`, `llms.txt`, and `publicPages` in the UI test.
- If you edit the community FAQ, update the matching `FAQPage` entry in the same commit.

## Manual steps (not code, highest impact)

1. **Google Business Profile.** Claim or create the listing for Kehilat Shaare Shalom at 22 Andover Lane, Woodmere. Set the category to "Synagogue", link the website, and enter the minyan times as opening hours. "Minyan near me" and "shul near me" are the most searched queries here by a wide margin, and they show map results, which come from this profile and nowhere else.
2. **Minyan directories.** Kehilat Shaare Shalom is missing from [GoDaven](https://www.godaven.com/list-shuls/Woodmere/NY), [ShulMap](https://shulmap.com/neighborhoods/five-towns/), [5 Towns Central](https://5townscentral.com/minyan/), and TotallyJewishTravel, which hold the top results for "shuls in woodmere" and "five towns minyanim". None of them lists a Sephardic minyan in Woodmere, so the listing would stand out. People search GoDaven by name ("godaven near me"), so it matters on its own.
3. **Google Search Console.** Verify `ksswoodmere.org` and submit `/sitemap.xml`.
4. **Bing Webmaster Tools.** Import the site from Search Console and submit the sitemap. ChatGPT search and Copilot use Bing's index.
5. **Local mentions.** Get listed on Five Towns and Jewish community sites, such as the Five Towns Jewish Times, and use the same name, address, and website everywhere. Consistent third-party mentions help AI answers cite the shul.
