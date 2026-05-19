const fs = require("node:fs");
const path = require("node:path");

const contentPath = path.join(__dirname, "..", "data", "admin-content.json");
const maxTextLength = 500;
const scheduleGroups = ["fridayNight", "morning", "latestShema", "afternoon"];

const defaultContent = {
  updatedAt: null,
  updatedBy: "",
  weekday: [
    { label: "Monday-Friday Shacharit", time: "6:00 AM" },
    { label: "Sunday Shacharit", time: "7:45 AM" },
    { label: "Daily Mincha & Arvit", time: "7:15 PM" },
  ],
  shabbat: {
    fridayNight: [],
    morning: [],
    latestShema: [],
    afternoon: [],
  },
  announcements: [],
};

function cleanText(value, maxLength = maxTextLength) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanTime(value) {
  const time = cleanText(value, 20).toUpperCase();
  if (!time) return "";
  return /^\d{1,2}:\d{2}\s?(AM|PM)$/.test(time) ? time.replace(/\s?(AM|PM)$/, " $1") : "";
}

function normalizeScheduleItems(items, limit = 16) {
  if (!Array.isArray(items)) return [];

  return items
    .slice(0, limit)
    .map((item) => ({
      label: cleanText(item?.label, 80),
      time: cleanTime(item?.time),
    }))
    .filter((item) => item.label && item.time);
}

function normalizeAnnouncements(items) {
  if (!Array.isArray(items)) return [];

  return items
    .slice(0, 8)
    .map((item) => ({
      title: cleanText(item?.title, 100),
      body: cleanText(item?.body, 500),
      date: cleanText(item?.date, 80),
    }))
    .filter((item) => item.title || item.body);
}

function normalizeContent(input, previous = defaultContent) {
  const shabbat = {};
  scheduleGroups.forEach((group) => {
    shabbat[group] = normalizeScheduleItems(input?.shabbat?.[group] || previous.shabbat?.[group]);
  });

  return {
    updatedAt: input?.updatedAt || previous.updatedAt || null,
    updatedBy: cleanText(input?.updatedBy || previous.updatedBy, 80),
    weekday: normalizeScheduleItems(input?.weekday || previous.weekday, 8),
    shabbat,
    announcements: normalizeAnnouncements(input?.announcements || previous.announcements),
  };
}

function readAdminContent() {
  try {
    const parsed = JSON.parse(fs.readFileSync(contentPath, "utf8"));
    return normalizeContent(parsed);
  } catch {
    return normalizeContent(defaultContent);
  }
}

function writeAdminContent(input, updatedBy = "board") {
  const current = readAdminContent();
  const content = normalizeContent(
    {
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy,
    },
    current
  );

  fs.mkdirSync(path.dirname(contentPath), { recursive: true });
  const temporaryPath = `${contentPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(content, null, 2)}\n`);
  fs.renameSync(temporaryPath, contentPath);
  return content;
}

module.exports = {
  readAdminContent,
  writeAdminContent,
  normalizeContent,
};
