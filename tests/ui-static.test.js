const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const adminHtml = fs.readFileSync("admin.html", "utf8");
const script = fs.readFileSync("script.js", "utf8");
const adminScript = fs.readFileSync("admin.js", "utf8");
const server = fs.readFileSync("dev-server.js", "utf8");

assert.match(html, /id="schedule"/, "Schedule section should be present");
assert.match(html, /id="announcements"[^>]*hidden/, "Announcements section should start hidden");
assert.match(html, /id="announcement-list"/, "Announcement list should be present");

["weekday-shacharit", "sunday-shacharit", "daily-mincha-arvit"].forEach((key) => {
  assert.match(html, new RegExp(`data-schedule-key="${key}"`), `${key} should be rendered in markup`);
  assert.match(script, new RegExp(key), `${key} should be handled by script`);
});

["regular", "shabbat", "zmanim"].forEach((tab) => {
  assert.match(html, new RegExp(`data-tab="${tab}"`), `${tab} tab should be present`);
  assert.match(html, new RegExp(`data-panel="${tab}"`), `${tab} panel should be present`);
});

assert.match(script, /\/api\/updates/, "Public page should fetch board updates");
assert.match(script, /function renderAnnouncements/, "Public page should render announcements");
assert.match(script, /function applyBoardUpdates/, "Public page should merge board updates");

assert.match(adminHtml, /Board Admin/, "Admin page should be present");
assert.match(adminHtml, /id="admin-login-form"/, "Admin login form should be present");
assert.match(adminHtml, /id="admin-bulletin-form"/, "Admin bulletin upload form should be present");
assert.match(adminHtml, /type="file"/, "Admin upload should use a file input");
assert.match(adminHtml, /accept="application\/pdf,\.pdf"/, "Admin upload should accept PDF files");
assert.match(adminHtml, /id="admin-content-form"/, "Admin editor form should be present");
assert.match(adminScript, /\/api\/admin\/login/, "Admin page should log in through backend");
assert.match(adminScript, /\/api\/admin\/bulletin/, "Admin page should upload bulletins through backend");
assert.match(adminScript, /\/api\/admin\/content/, "Admin page should save content through backend");

assert.match(server, /adminApiHandler/, "Dev server should route admin API requests");
assert.match(server, /\/api\/updates/, "Dev server should expose public updates");
assert.match(server, /publicFiles/, "Dev server should restrict static serving to public files");
assert.match(server, /startsWith\("\/assets\/"\)/, "Dev server should only expose the assets directory publicly");
assert.match(server, /redirectHome\(response\)/, "Dev server should redirect private source and data paths");

console.log("UI static test passed.");
