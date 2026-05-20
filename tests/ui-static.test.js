const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const giveHtml = fs.readFileSync("give.html", "utf8");
const scheduleHtml = fs.readFileSync("schedule.html", "utf8");
const resourcesHtml = fs.readFileSync("resources.html", "utf8");
const adminHtml = fs.readFileSync("admin.html", "utf8");
const minyanimRouteHtml = fs.readFileSync("minyanim/index.html", "utf8");
const communityRouteHtml = fs.readFileSync("community-info/index.html", "utf8");
const supportRouteHtml = fs.readFileSync("support-us/index.html", "utf8");
const staffRouteHtml = fs.readFileSync("staff/index.html", "utf8");
const script = fs.readFileSync("script.js", "utf8");
const adminScript = fs.readFileSync("admin.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const server = fs.readFileSync("dev-server.js", "utf8");
const vercelConfig = fs.readFileSync("vercel.json", "utf8");

function footerHtml(pageHtml) {
  return pageHtml.match(/<footer[\s\S]*?<\/footer>/)?.[0] || "";
}

assert.match(html, /id="schedule"/, "Home page should contain minyan times");
assert.match(html, /id="zmanim-list"/, "Home page should contain zmanim");
assert.match(html, /Five Towns Eruv/, "Home page should contain eruv information");
assert.match(html, /Open Five Towns Eruv Map/, "Home eruv link should clearly read as clickable");
assert.match(html, /id="give"/, "Home page should contain donation information");
assert.match(html, /<span>Support &amp; Dedications<\/span>\s*<strong>Zelle, Kiddush, and Torah learning<\/strong>/, "Home practical links should make the support action specific");
assert.doesNotMatch(html, /<span>Email<\/span>\s*<strong>ksswoodmere@gmail\.com<\/strong>/, "Home page should not duplicate the same support email as a separate box");
assert.match(html, /href="\/community-info"/, "Home page should link to community info page with a clean URL");
assert.doesNotMatch(resourcesHtml, /id="give"/, "Resources page should not duplicate donation information");
assert.doesNotMatch(resourcesHtml, /Five Towns Eruv Map/, "Resources page should not duplicate eruv information");
assert.ok(html.indexOf('class="hero"') < html.indexOf('class="status-strip"'), "Home page should match the bulletin-style hero before practical info");
assert.ok(html.indexOf('class="status-strip"') < html.indexOf('id="schedule"'), "Home page should show minyan schedule under next minyan");
assert.ok(html.indexOf('id="schedule"') < html.indexOf('class="home-link-strip"'), "Home page should show support and eruv after the schedule");
assert.ok(html.indexOf("<span>Next Minyan</span>") < html.indexOf("<span>Address</span>"), "Home page should show next minyan above address");
assert.match(html, /<header class="site-header">/, "Home page should include the site header");
assert.equal(minyanimRouteHtml, scheduleHtml, "Static /minyanim route should mirror schedule page");
assert.equal(communityRouteHtml, resourcesHtml, "Static /community-info route should mirror resources page");
assert.equal(supportRouteHtml, giveHtml, "Static /support-us route should mirror give page");
assert.equal(staffRouteHtml, adminHtml, "Static /staff route should mirror admin page");
assert.match(html, /<a href="\/minyanim">Minyanim<\/a>\s*<a href="\/community-info">Learning \/ Community<\/a>\s*<a class="nav-support" href="\/support-us">Support Us<\/a>/, "Home header should use the shared compact nav");
assert.match(resourcesHtml, /<a href="\/minyanim">Minyanim<\/a>\s*<a href="\/community-info" aria-current="page">Learning \/ Community<\/a>\s*<a class="nav-support" href="\/support-us">Support Us<\/a>/, "Resources header should use the shared compact nav");
assert.match(scheduleHtml, /<a href="\/minyanim" aria-current="page">Minyanim<\/a>\s*<a href="\/community-info">Learning \/ Community<\/a>\s*<a class="nav-support" href="\/support-us">Support Us<\/a>/, "Schedule header should use the shared compact nav");
assert.match(giveHtml, /<a href="\/minyanim">Minyanim<\/a>\s*<a href="\/community-info">Learning \/ Community<\/a>\s*<a class="nav-support" href="\/support-us" aria-current="page">Support Us<\/a>/, "Give header should use the shared compact nav");
assert.doesNotMatch(html, /resources\.html#learning/, "Home header should not expose every resource section as a separate link");
assert.doesNotMatch(html, /resources\.html#visit/, "Home header should not expose visit as a separate link");
assert.doesNotMatch(html, />Donate<\/a>/, "Home header should say Support Us, not Donate");
assert.doesNotMatch(html, />More<\/a>/, "Home header should not use More as a vague link");
assert.doesNotMatch(html, /class="thumb-nav"/, "Home page should not include bottom navigation");
assert.doesNotMatch(resourcesHtml, /class="thumb-nav"/, "Resources page should not include bottom navigation buttons");
assert.doesNotMatch(scheduleHtml, /class="thumb-nav"/, "Schedule page should not include bottom navigation buttons");
assert.doesNotMatch(html, /class="hero-actions"/, "Home hero should not include extra CTA buttons");
assert.doesNotMatch(html, />Minyan Times</, "Home hero should not duplicate the schedule with a button");
assert.match(scheduleHtml, /id="schedule"/, "Schedule page should contain the schedule section");
assert.match(scheduleHtml, /class="status-strip schedule-status-strip"/, "Schedule page should center a single next-minyan status box");
assert.doesNotMatch(scheduleHtml, /<span>Address<\/span>/, "Schedule page should not repeat the address status box");
assert.match(styles, /\.schedule-status-strip[\s\S]*grid-template-columns: minmax\(260px, 1fr\)/, "Schedule next-minyan box should not keep an empty desktop column");
assert.match(styles, /\.schedule-section \.section-intro > \.eyebrow[\s\S]*border-top: 0/, "Schedule section should not add an extra standalone top line");
assert.match(styles, /\.home-page \.status-strip[\s\S]*border-top: 1px solid var\(--line\)/, "Home status strip should keep an even outer border on mobile");
assert.match(styles, /\.status-strip div[\s\S]*border-right: 0[\s\S]*border-bottom: 1px solid var\(--line\)/, "Stacked status boxes should not show a one-sided inner border");
assert.match(styles, /@media \(min-width: 560px\)[\s\S]*\.status-strip div:last-child[\s\S]*border-right: 0/, "Desktop status boxes should rely on the parent outline instead of a duplicate right edge");
assert.match(giveHtml, /id="give"/, "Give page should contain Zelle support section");
assert.match(giveHtml, /body class="give-page"/, "Give page should use give-specific layout tuning");
assert.match(giveHtml, /Sponsor &amp; Dedicate/, "Give page should contain sponsor and dedication content");
assert.match(giveHtml, /class="copy-button"[^>]*data-copy="ksswoodmere@gmail\.com"/, "Give page should include a Zelle copy button");
assert.doesNotMatch(resourcesHtml, /Sponsor &amp; Dedicate/, "Resources page should not duplicate give content");
assert.match(resourcesHtml, /id="resources"/, "Resources page should contain local resources");
assert.match(resourcesHtml, /id="learning"/, "Resources page should contain learning content");
assert.match(resourcesHtml, /<p class="eyebrow">Torah<\/p>\s*<h2>Learning<\/h2>/, "Learning section should use Torah as the gold label and restore the heading");
assert.match(resourcesHtml, /<div class="masthead-name" id="masthead-title">Community Info<\/div>/, "Community info masthead should stay compact on mobile");
assert.match(styles, /#learning \.section-intro > \.eyebrow[\s\S]*border-top: 0/, "Learning section should not add an extra top bar");
assert.match(styles, /#learning \.section-intro[\s\S]*margin-bottom: 0\.95rem/, "Learning section spacing should account for the restored heading");
assert.match(styles, /\.home-page \.hero-copy > p:not\(\.hero-kicker\)[\s\S]*border-bottom: 0/, "Home hero body text should not add an underline");
assert.match(html, /id="announcements"[^>]*hidden/, "Announcements section should start hidden");
assert.match(html, /class="announcement-banner"/, "Announcements should render as a top banner");
assert.match(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}`, />Announcement<\/span>/, "Announcement bar should use simple public copy");
assert.doesNotMatch(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}`, /Board Announcement/, "Announcement bar should not mention board");
assert.match(styles, /\.announcement-banner[\s\S]*text-align: center/, "Announcement banner should center its text");
assert.match(styles, /\.announcement-banner \.announcement-list article[\s\S]*text-align: center/, "Announcement message text should be centered");
assert.match(styles, /\.announcement-banner[\s\S]*gap: 0\.35rem/, "Announcement banner should avoid a large label/title gap");
assert.match(html, /id="announcement-list"/, "Announcement list should be present");
assert.match(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}\n${adminHtml}`, /class="site-loader"/, "Pages should include the delayed loader");
assert.match(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}\n${adminHtml}`, /document\.readyState === "loading"/, "Loader should only appear while the page is not rendering");
assert.match(styles, /\.is-rendering-slow \.site-loader[\s\S]*display: grid/, "Loader should only show after the delayed slow-render class");
assert.match(html, /class="site-footer"/, "Public page should include a footer");
assert.match(html, /aria-label="Footer navigation"/, "Footer should include quick navigation");
assert.match(html, /href="\/staff">Staff<\/a>/, "Footer should link to the clean staff URL with staff copy");
assert.match(html, /class="footer-email" href="mailto:ksswoodmere@gmail\.com">ksswoodmere@gmail\.com<\/a>/, "Footer should include the public email link");
assert.match(html, /<nav aria-label="Footer navigation">\s*<a href="\/">Home<\/a>\s*<a href="\/minyanim">Minyanim<\/a>\s*<a href="\/community-info">Learning \/ Community<\/a>\s*<a href="\/support-us">Support Us<\/a>\s*<a href="\/staff">Staff<\/a>\s*<\/nav>/, "Footer links should align with the header navigation order");
assert.match(html, /href="\/minyanim">Minyanim<\/a>/, "Home footer should include minyanim");
assert.match(html, /href="\/community-info">Learning \/ Community<\/a>/, "Home footer should include learning and community");
assert.match(html, /href="\/support-us">Support Us<\/a>/, "Home footer should link to the support page");
assert.match(resourcesHtml, /href="\/minyanim">Minyanim<\/a>/, "Resources footer should include minyanim");
assert.match(resourcesHtml, /href="\/community-info">Learning \/ Community<\/a>/, "Resources footer should match the shared footer links");
assert.match(scheduleHtml, /href="\/community-info">Learning \/ Community<\/a>/, "Schedule footer should match the shared footer links");
assert.match(giveHtml, /href="\/minyanim">Minyanim<\/a>/, "Give footer should include minyanim");
assert.match(giveHtml, /href="\/community-info">Learning \/ Community<\/a>/, "Give footer should match the shared footer links");
assert.match(html, /class="footer-bottom compact-footer"/, "Home footer should use the compact footer");
assert.match(giveHtml, /class="footer-bottom compact-footer"/, "Give footer should use the compact footer");
assert.match(resourcesHtml, /class="footer-bottom compact-footer"/, "Resources footer should use the compact footer");
assert.match(scheduleHtml, /class="footer-bottom compact-footer"/, "Schedule footer should use the compact footer");
for (const pageFooter of [html, giveHtml, resourcesHtml, scheduleHtml].map(footerHtml)) {
  assert.match(pageFooter, /Minyanim/, "Public footers should include Minyanim");
}
assert.doesNotMatch(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}`, /<div class="footer-grid">/, "Public footers should not duplicate address and contact info");
assert.doesNotMatch(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}`, /<div class="footer-bottom compact-footer">(?:(?!<\/div>)[\s\S])*<strong>ksswoodmere@gmail\.com<\/strong>/, "Public footer email should not be styled as duplicate primary info");
assert.doesNotMatch(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}`, />Staff Sign In<\/a>/, "Public footer should shorten staff link copy");
assert.doesNotMatch(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}`, /href="(?:index|resources|schedule|give)\.html/, "Public links should use clean URLs instead of .html files");
assert.doesNotMatch(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}`, /href="\/(?:give|resources|schedule|admin)"/, "Public links should match button names");
assert.doesNotMatch(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}`, /href="[^"]*#/, "Public links should avoid hash URLs");
assert.doesNotMatch(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}\n${adminHtml}`, /(href|src)="(?:styles|script|admin|assets)\//, "Pages should use absolute asset paths so static route folders work");
assert.match(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}`, /href="\/styles\.css/, "Public pages should use absolute stylesheet URLs");
assert.match(`${html}\n${giveHtml}\n${resourcesHtml}\n${scheduleHtml}`, /src="\/script\.js/, "Public pages should use absolute script URLs");

["weekday-shacharit", "sunday-shacharit", "daily-mincha-arvit"].forEach((key) => {
  assert.match(`${html}\n${scheduleHtml}`, new RegExp(`data-schedule-key="${key}"`), `${key} should be rendered in markup`);
  assert.match(script, new RegExp(key), `${key} should be handled by script`);
});

["regular", "shabbat", "zmanim"].forEach((tab) => {
  assert.match(scheduleHtml, new RegExp(`data-tab="${tab}"`), `${tab} tab should be present`);
  assert.match(scheduleHtml, new RegExp(`data-panel="${tab}"`), `${tab} panel should be present`);
});

assert.match(script, /\/api\/updates/, "Public page should fetch board updates");
assert.match(script, /function renderAnnouncements/, "Public page should render announcements");
assert.match(script, /function applyBoardUpdates/, "Public page should merge board updates");
assert.match(script, /function fallbackCopyText/, "Copy button should have a clipboard fallback");
assert.doesNotMatch(script, /Copy failed/, "Copy button should not show scary failure text");
assert.match(styles, /\.zmanim-item strong[\s\S]*font-family: var\(--font-display\)[\s\S]*font-size: clamp\(1\.4rem, 7vw, 1\.85rem\)/, "Zmanim times should match the regular time typography");

assert.match(adminHtml, /Staff Sign In/, "Admin page should present staff sign-in copy");
assert.doesNotMatch(adminHtml, /Board Admin/, "Admin landing page should not use board admin copy");
assert.doesNotMatch(adminHtml, /Update Times and Announcements/, "Admin landing page should keep the sign-in copy minimal");
assert.doesNotMatch(adminHtml, /admin-config-message/, "Admin login should not show helper config copy");
assert.doesNotMatch(adminScript, /shared board password/, "Admin script should not inject shared-password helper copy");
assert.match(adminHtml, /id="admin-login-form"/, "Admin login form should be present");
assert.match(adminHtml, /id="admin-bulletin-form"/, "Admin bulletin upload form should be present");
assert.match(adminHtml, /type="file"/, "Admin upload should use a file input");
assert.match(adminHtml, /accept="application\/pdf,\.pdf"/, "Admin upload should accept PDF files");
assert.match(adminHtml, /id="admin-content-form"/, "Admin editor form should be present");
assert.match(adminHtml, /<legend>Announcement<\/legend>/, "Mobile admin should prioritize announcement editing");
assert.match(adminHtml, /<details class="admin-times-panel" open>/, "Admin times should live in a collapsible panel");
assert.match(adminHtml, /<summary>Edit regular times<\/summary>/, "Admin times panel should use simple mobile copy");
assert.ok(
  adminHtml.indexOf("Save Updates") < adminHtml.indexOf("Upload and Parse") &&
    adminHtml.indexOf("Upload and Parse") < adminHtml.indexOf("View Site") &&
    adminHtml.indexOf("View Site") < adminHtml.indexOf("Log Out"),
  "Mobile admin buttons should flow from save to upload to utility actions"
);
assert.match(adminHtml, /class="admin-secondary-actions"/, "Admin utility buttons should be grouped separately");
assert.match(styles, /\.admin-secondary-actions \.button[\s\S]*width: 100%/, "Admin utility buttons should be full-width on phone");
assert.doesNotMatch(adminHtml, /Latest Shema/, "Admin editor should not expose Latest Shema as a manual board field");
assert.match(adminScript, /\/api\/admin\/login/, "Admin page should log in through backend");
assert.match(adminScript, /\/api\/admin\/bulletin/, "Admin page should upload bulletins through backend");
assert.match(adminScript, /\/api\/admin\/content/, "Admin page should save content through backend");
assert.match(adminScript, /function syncAdminMobileLayout/, "Admin page should collapse detailed times on phones");
assert.doesNotMatch(adminScript, /collectSchedule\("latestShema"\)/, "Admin saves should not add manual Latest Shema times");

assert.match(server, /adminApiHandler/, "Dev server should route admin API requests");
assert.match(server, /\/api\/updates/, "Dev server should expose public updates");
assert.match(server, /cleanPageRoutes/, "Dev server should serve clean page routes");
assert.match(server, /legacyPageRoutes/, "Dev server should redirect legacy html page URLs");
assert.match(server, /\["\/index\.html", "\/"\]/, "Dev server should redirect legacy index.html URL");
assert.match(server, /\["\/support-us", "\/give\.html"\]/, "Dev server should serve clean support route");
assert.match(server, /\["\/community-info", "\/resources\.html"\]/, "Dev server should serve clean community route");
assert.match(server, /\["\/minyanim", "\/schedule\.html"\]/, "Dev server should serve clean minyanim route");
assert.match(server, /\["\/staff", "\/admin\.html"\]/, "Dev server should serve clean staff route");
assert.match(server, /\["\/give\.html", "\/support-us"\]/, "Dev server should redirect legacy give.html URL");
assert.match(server, /publicFiles/, "Dev server should restrict static serving to public files");
assert.match(server, /startsWith\("\/assets\/"\)/, "Dev server should only expose the assets directory publicly");
assert.match(server, /sourceRedirectPrefixes/, "Dev server should redirect source-like paths");
assert.match(server, /"\/page-source"/, "Dev server should redirect page source routes");
assert.match(server, /redirectHome\(response\)/, "Dev server should redirect private source and data paths");
assert.match(vercelConfig, /"cleanUrls": true/, "Vercel should serve clean extensionless URLs");
assert.match(vercelConfig, /"source": "\/source"/, "Vercel should redirect source-like URLs");
assert.match(vercelConfig, /"source": "\/data\/:path\*"/, "Vercel should redirect private data URLs");
assert.match(vercelConfig, /"source": "\/index\.html"/, "Vercel should redirect legacy index.html URL");
assert.match(vercelConfig, /"destination": "\/"/, "Vercel should use / as the home URL");
assert.match(vercelConfig, /"source": "\/admin\.html"/, "Vercel should redirect legacy admin.html URL");
assert.match(vercelConfig, /"destination": "\/staff"/, "Vercel should use /staff as the staff URL");
assert.match(vercelConfig, /"source": "\/give\.html"/, "Vercel should redirect legacy give.html URL");
assert.match(vercelConfig, /"destination": "\/support-us"/, "Vercel should use /support-us as the support URL");
assert.match(vercelConfig, /"source": "\/schedule\.html"/, "Vercel should redirect legacy schedule.html URL");
assert.match(vercelConfig, /"destination": "\/minyanim"/, "Vercel should use /minyanim as the schedule URL");
assert.match(vercelConfig, /"source": "\/resources\.html"/, "Vercel should redirect legacy resources.html URL");
assert.match(vercelConfig, /"destination": "\/community-info"/, "Vercel should use /community-info as the community URL");

console.log("UI static test passed.");
