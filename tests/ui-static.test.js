const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const script = fs.readFileSync("script.js", "utf8");

assert.match(html, /class="this-week"/, "This Week panel should be present");
assert.match(html, /href="assets\/weekly-bulletin-bamidbar-2026-05-15\.pdf"/, "Weekly bulletin should be linked");
assert.match(html, /id="this-week-parsha"/, "This Week panel should expose parasha");
assert.match(html, /id="this-week-updated"/, "This Week panel should expose update status");
assert.match(html, /id="ask-ai"/, "Ask AI section should be present");
assert.match(html, /id="ask-ai-form"/, "Ask AI form should be present");
assert.match(html, /id="ask-ai-answer"/, "Ask AI answer region should be present");
assert.match(script, /\/api\/ask-ai/, "Ask AI should submit to the backend endpoint");
assert.match(script, /setAskAiAnswer/, "Ask AI should render answer state");

["weekday-shacharit", "sunday-shacharit", "daily-mincha-arvit"].forEach((key) => {
  assert.match(html, new RegExp(`data-schedule-key="${key}"`), `${key} should be rendered in markup`);
  assert.match(script, new RegExp(key), `${key} should be handled by script`);
});

["panel-regular", "panel-shabbat", "panel-zmanim"].forEach((id) => {
  assert.match(html, new RegExp(`aria-controls="${id}"`), `${id} should be controlled by a tab`);
});

["faq-entrance", "faq-parking", "faq-accessibility", "mikvah-drawer"].forEach((id) => {
  assert.match(html, new RegExp(`aria-controls="${id}"`), `${id} should have an accessible trigger`);
  assert.match(html, new RegExp(`id="${id}"[^>]*hidden`), `${id} content should start hidden`);
});

["shul-learning.png", "shul-dancing.png"].forEach((asset) => {
  assert.match(html, new RegExp(asset), `${asset} should be used on the page`);
});

assert.match(script, /function activateTab/, "Tabs should use a shared activation handler");
assert.match(script, /answer\.hidden = !isOpen/, "FAQ answers should update hidden state");
assert.match(script, /drawer\.hidden = !isOpen/, "Resource drawer should update hidden state");

console.log("UI static test passed.");
