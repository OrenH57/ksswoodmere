const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const brand = document.querySelector(".brand");
const brandText = document.querySelector(".brand-text");
const brandName = document.querySelector(".brand-name");
const brandSubtitle = document.querySelector(".brand-subtitle");
const isCoarsePointer = window.matchMedia?.("(pointer: coarse)").matches || false;
const reduceFirstScrollWork = isCoarsePointer || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const brandTranslations = [
  {
    lang: "en",
    dir: "ltr",
    name: "Shaare Shalom",
    subtitle: "Kehilat Shaare Shalom",
    label: "Kehilat Shaare Shalom home",
  },
  {
    lang: "he",
    dir: "rtl",
    name: "שערי שלום",
    subtitle: "קהילת שערי שלום",
    label: "דף הבית של קהילת שערי שלום",
  },
  {
    lang: "ru",
    dir: "ltr",
    name: "Шааре Шалом",
    subtitle: "Кеилат Шааре Шалом",
    label: "Главная страница Кеилат Шааре Шалом",
  },
];

brandTranslations[1] = {
  lang: "he",
  dir: "rtl",
  name: "\u05e9\u05e2\u05e8\u05d9 \u05e9\u05dc\u05d5\u05dd",
  subtitle: "\u05e7\u05d4\u05d9\u05dc\u05ea \u05e9\u05e2\u05e8\u05d9 \u05e9\u05dc\u05d5\u05dd",
  label: "\u05d3\u05e3 \u05d4\u05d1\u05d9\u05ea \u05e9\u05dc \u05e7\u05d4\u05d9\u05dc\u05ea \u05e9\u05e2\u05e8\u05d9 \u05e9\u05dc\u05d5\u05dd",
};

brandTranslations[2] = {
  lang: "ru",
  dir: "ltr",
  name: "\u0428\u0430\u0430\u0440\u0435 \u0428\u0430\u043b\u043e\u043c",
  subtitle: "\u041a\u0435\u0438\u043b\u0430\u0442 \u0428\u0430\u0430\u0440\u0435 \u0428\u0430\u043b\u043e\u043c",
  label: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430 \u041a\u0435\u0438\u043b\u0430\u0442 \u0428\u0430\u0430\u0440\u0435 \u0428\u0430\u043b\u043e\u043c",
};

function rotateBrandLanguage() {
  if (!brand || !brandText || !brandName || !brandSubtitle) return;

  if (window.brandLanguageTimer) {
    window.clearInterval(window.brandLanguageTimer);
  }

  function applyBrandTranslation(translation) {
    brandName.textContent = translation.name;
    brandSubtitle.textContent = translation.subtitle;
    brandText.setAttribute("lang", translation.lang);
    brandText.setAttribute("dir", translation.dir);
    brand.setAttribute("aria-label", translation.label);
  }

  window.brandLanguageStartedAt = Date.now();
  let activeIndex = -1;

  function syncBrandLanguage() {
    const nextIndex = Math.floor((Date.now() - window.brandLanguageStartedAt) / 3000) % brandTranslations.length;
    if (nextIndex === activeIndex) return;

    activeIndex = nextIndex;
    const next = brandTranslations[activeIndex];
    brandText.classList.add("is-changing");
    window.setTimeout(() => {
      applyBrandTranslation(next);
      brandText.classList.remove("is-changing");
    }, 180);
  }

  applyBrandTranslation(brandTranslations[0]);

  if (reduceFirstScrollWork) return;

  window.brandLanguageTimer = window.setInterval(() => {
    syncBrandLanguage();
  }, 3000);
}

rotateBrandLanguage();

const shouldTrackScrollProgress = !isCoarsePointer;

if (shouldTrackScrollProgress) {
  const scrollProgress = document.createElement("div");
  scrollProgress.className = "scroll-progress";
  document.body.prepend(scrollProgress);

  let maxScroll = 0;
  let scrollProgressFrame = 0;

  function updateMaxScroll() {
    maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
  }

  function renderScrollProgress() {
    scrollProgressFrame = 0;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    scrollProgress.style.transform = `scaleX(${Math.min(progress, 1)})`;
  }

  function queueScrollProgress() {
    if (scrollProgressFrame) return;
    scrollProgressFrame = window.requestAnimationFrame(renderScrollProgress);
  }

  function refreshScrollProgress() {
    updateMaxScroll();
    queueScrollProgress();
  }

  window.addEventListener("scroll", queueScrollProgress, { passive: true });
  window.addEventListener("resize", refreshScrollProgress);
  window.addEventListener("load", refreshScrollProgress, { once: true });
  refreshScrollProgress();
}

navToggle?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    siteNav.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

const copyButton = document.querySelector(".copy-button");
const copyStatus = document.querySelector("#copy-status");

function fallbackCopyText(value) {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-1000px";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();

  try {
    return document.execCommand("copy");
  } finally {
    textArea.remove();
  }
}

copyButton?.addEventListener("click", async () => {
  const value = copyButton.getAttribute("data-copy") || "";
  if (copyStatus) copyStatus.textContent = "Copying...";

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else if (!fallbackCopyText(value)) {
      throw new Error("Fallback copy unavailable");
    }
    if (copyStatus) copyStatus.textContent = "Copied.";
  } catch {
    if (copyStatus) copyStatus.textContent = `Email: ${value}`;
  }
});

const zmanimList = document.querySelector("#zmanim-list");
const zmanimStatus = document.querySelector("#zmanim-status");
const isFilePreview = window.location.protocol === "file:";
const bulletinStatus = document.querySelector("#bulletin-status");
const bulletinSource = document.querySelector("#bulletin-source");
const scheduleSource = document.querySelector("#schedule-source");
const regularScheduleList = document.querySelector("#regular-schedule-list");
const shabbatScheduleGrid = document.querySelector("#shabbat-schedule-grid");
const announcementsSection = document.querySelector("#announcements");
const announcementList = document.querySelector("#announcement-list");
const weeklyParsha = document.querySelector("#weekly-parsha");
const bsdText = document.querySelector("#bsd-text");
const englishDate = document.querySelector("#english-date");
const defaultRegularSchedule = [
  { label: "Monday-Friday Shacharit", time: "6:00 AM" },
  { label: "Sunday Shacharit", time: "7:45 AM" },
  { label: "Daily Mincha & Arvit", time: "7:15 PM" },
];

const fallbackBulletin = {
  source: {
    fileName: "weekly-bulletin-bamidbar-2026-05-15.pdf",
  },
  shabbat: {
    fridayNight: [
      { label: "Candle Lighting", time: "7:45 PM" },
      { label: "Shir Hashirim", time: "7:00 PM" },
      { label: "Mincha & Kabbalat Shabbat", time: "7:15 PM" },
      { label: "Shkia (Sunset)", time: "8:05 PM" },
      { label: "Tzeit HaKochavim", time: "8:23 PM" },
    ],
    morning: [
      { label: "Ben Ish Hai Class", time: "8:00 AM" },
      { label: "Shacharit - Korbanot", time: "8:30 AM" },
      { label: "Shacharit - Hodu", time: "8:45 AM" },
      { label: "Rabbi's Morning Speech", time: "10:50 AM" },
    ],
    latestShema: [
      { label: "M\"A", time: "8:26 AM" },
      { label: "Gr\"A", time: "9:14 AM" },
    ],
    afternoon: [
      { label: "Mincha", time: "7:15 PM" },
      { label: "Arvit", time: "8:30 PM" },
      { label: "Shabbat Ends", time: "8:45 PM" },
      { label: "Rabbenu Tam", time: "9:18 PM" },
    ],
  },
  weekday: defaultRegularSchedule,
  notes: {
    parsha: "Bamidbar",
    dateText: "May 15-16",
  },
};

const apiCacheTtl = {
  bulletin: 15 * 60 * 1000,
  shabbat: 6 * 60 * 60 * 1000,
  zmanim: 12 * 60 * 60 * 1000,
};

const zmanimLabels = [
  ["alotHaShachar", "Alot"],
  ["sunrise", "Sunrise"],
  ["sofZmanShmaMGA", "Shema MGA"],
  ["sofZmanShma", "Shema Gra"],
  ["chatzot", "Chatzot"],
  ["minchaGedola", "Mincha Gedola"],
  ["sunset", "Shkiah"],
  ["tzeit7083deg", "Tzeit"],
];

function formatZman(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(date);
}

function setTextWithSwipe(element, value) {
  if (!element || value == null || element.textContent === String(value)) return;
  element.textContent = value;
  element.classList.remove("text-swipe");
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => element.classList.add("text-swipe"));
  });
}

async function fetchJsonWithCache(url, ttl = 15 * 60 * 1000) {
  const key = `kss-cache:${url}`;
  const now = Date.now();

  try {
    const cached = JSON.parse(localStorage.getItem(key) || "null");
    if (cached?.time && now - cached.time < ttl) return cached.data;
  } catch {
    // Ignore storage errors and continue with the network request.
  }

  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const data = await response.json();
    try {
      localStorage.setItem(key, JSON.stringify({ time: now, data }));
    } catch {
      // Some browsers block localStorage in restrictive modes.
    }
    return data;
  } catch (error) {
    try {
      const cached = JSON.parse(localStorage.getItem(key) || "null");
      if (cached?.data) return cached.data;
    } catch {
      // No usable stale cache.
    }
    throw error;
  }
}

async function fetchFreshJson(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function nextWeekdayDate(dayNumber) {
  const date = new Date();
  const daysUntil = (dayNumber - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + daysUntil);
  return date;
}

function formatEnglishShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(date);
}

function formatEnglishDateRange(startDate, endDate) {
  const start = formatEnglishShortDate(startDate);
  const end = formatEnglishShortDate(endDate);
  const startMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "America/New_York",
  }).format(startDate);
  const endMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "America/New_York",
  }).format(endDate);
  const endDay = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    timeZone: "America/New_York",
  }).format(endDate);

  return startMonth === endMonth ? `${start}-${endDay}` : `${start}-${end}`;
}

function setLiveDatesFallback() {
  const friday = nextWeekdayDate(5);
  const shabbat = new Date(friday);
  shabbat.setDate(friday.getDate() + 1);

  if (bsdText) {
    bsdText.removeAttribute("dir");
    setTextWithSwipe(bsdText, "\u05d1\u05e1\u05f4\u05d3");
  }

  if (englishDate) {
    setTextWithSwipe(englishDate, formatEnglishDateRange(friday, shabbat));
  }
}

async function loadWeeklyHeader() {
  setLiveDatesFallback();

  try {
    const data = await fetchJsonWithCache(
      "https://www.hebcal.com/shabbat?cfg=json&zip=11598&M=on",
      apiCacheTtl.shabbat
    );
    const parsha = data.items?.find((item) => item.category === "parashat");
    const candles = data.items?.find((item) => item.category === "candles");
    const havdalah = data.items?.find((item) => item.category === "havdalah");

    if (weeklyParsha && parsha?.title) {
      setTextWithSwipe(weeklyParsha, parsha.title.replace(/^Parashat\b/, "Parshat"));
    }

    if (englishDate && candles?.date && havdalah?.date) {
      const candleDate = new Date(candles.date);
      const havdalahDate = new Date(havdalah.date);
      setTextWithSwipe(englishDate, formatEnglishDateRange(candleDate, havdalahDate));
    }
  } catch {
    if (weeklyParsha) setTextWithSwipe(weeklyParsha, "Parsha updates weekly");
  }
}

loadWeeklyHeader();

async function loadZmanim() {
  if (!zmanimList || !zmanimStatus) return;

  if (isFilePreview) {
    zmanimList.innerHTML = zmanimLabels
      .map(([, label]) => `<div class="zmanim-item"><span>${label}</span><strong>--</strong></div>`)
      .join("");
    zmanimStatus.innerHTML =
      'Live Hebcal zmanim load when the site is hosted. <a href="https://www.hebcal.com/zmanim?cfg=json&zip=11598">Open Hebcal</a>';
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const url = `https://www.hebcal.com/zmanim?cfg=json&zip=11598&date=${today}`;

  try {
    const data = await fetchJsonWithCache(url, apiCacheTtl.zmanim);
    const items = zmanimLabels
      .map(([key, label]) => [label, formatZman(data.times?.[key])])
      .filter(([, time]) => time);

    zmanimList.innerHTML = items
      .map(([label, time]) => `<div class="zmanim-item"><span>${label}</span><strong>${time}</strong></div>`)
      .join("");

    setTextWithSwipe(zmanimStatus, `Woodmere, NY - ${new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/New_York",
    }).format(new Date())}`);
  } catch {
    setTextWithSwipe(zmanimStatus, "Live zmanim could not be loaded. Please check Hebcal or your local luach.");
  }
}

loadZmanim();

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function splitScheduleLabel(label) {
  const normalized = String(label || "").trim();
  const match = normalized.match(/^(Sunday|Monday-Friday|Mon-Fri|Daily)\s+(.+)$/i);

  if (!match) {
    return { context: "Schedule", name: normalized };
  }

  return {
    context: match[1].replace("Mon-Fri", "Monday-Friday"),
    name: match[2],
  };
}

function scheduleKeyForLabel(label) {
  const normalized = String(label || "").toLowerCase();
  if (normalized.includes("monday") || normalized.includes("mon-fri")) return "weekday-shacharit";
  if (normalized.includes("sunday")) return "sunday-shacharit";
  if (normalized.includes("mincha")) return "daily-mincha-arvit";
  return "";
}

function parseScheduleTime(timeText) {
  const match = String(timeText || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function buildMinyanSchedule(items) {
  const schedule = [];

  items.forEach((item) => {
    const time = parseScheduleTime(item.time);
    if (!time) return;
    const key = scheduleKeyForLabel(item.label);
    if (key === "weekday-shacharit") {
      schedule.push({ label: "Shacharit", detail: "Monday-Friday", day: [1, 2, 3, 4, 5], ...time });
    }
    if (key === "sunday-shacharit") {
      schedule.push({ label: "Shacharit", detail: "Sunday", day: [0], ...time });
    }
    if (key === "daily-mincha-arvit") {
      schedule.push({ label: "Mincha & Arvit", detail: "Daily", day: [0, 1, 2, 3, 4, 5, 6], ...time });
    }
  });

  return schedule.length ? schedule : [
    { label: "Shacharit", detail: "Monday-Friday", day: [1, 2, 3, 4, 5], hour: 6, minute: 0 },
    { label: "Shacharit", detail: "Sunday", day: [0], hour: 7, minute: 45 },
    { label: "Mincha & Arvit", detail: "Daily", day: [0, 1, 2, 3, 4, 5, 6], hour: 19, minute: 15 },
  ];
}

let minyanSchedule = buildMinyanSchedule(defaultRegularSchedule);

function refreshNextMinyan() {
  const nextMinyan = document.querySelector("#next-minyan");
  if (nextMinyan) nextMinyan.textContent = nextMinyanText();
}

function updateScheduleValues(items) {
  if (!Array.isArray(items) || !items.length) return;

  items.forEach((item) => {
    const key = scheduleKeyForLabel(item.label);
    if (!key) return;
    document.querySelectorAll(`[data-schedule-key="${key}"]`).forEach((value) => {
      value.textContent = item.time;
    });
  });

  minyanSchedule = buildMinyanSchedule(items);
  refreshNextMinyan();
}

function revealScheduleTimes(scope = document) {
  const times = [...scope.querySelectorAll(".schedule-list article strong")];
  if (!times.length) return;

  times.forEach((time) => time.classList.remove("is-visible"));
  window.requestAnimationFrame(() => {
    times.forEach((time, index) => {
      window.setTimeout(() => time.classList.add("is-visible"), index * 160);
    });
  });
}

function renderRegularSchedule(items) {
  if (!regularScheduleList || !Array.isArray(items) || !items.length) return;

  regularScheduleList.innerHTML = items
    .map((item) => {
      const split = splitScheduleLabel(item.label);
      const key = scheduleKeyForLabel(item.label);
      return `
        <article>
          <p>${escapeHtml(split.context)}</p>
          <h3>${escapeHtml(split.name)}</h3>
          <strong${key ? ` data-schedule-key="${escapeHtml(key)}"` : ""}>${escapeHtml(item.time)}</strong>
        </article>
      `;
    })
    .join("");

  updateScheduleValues(items);
  revealScheduleTimes(regularScheduleList);
}

function renderTimeTable(title, items) {
  if (!Array.isArray(items) || !items.length) return "";

  return `
    ${items
      .map(
        (item) => `
          <article>
            <p>${escapeHtml(title)}</p>
            <h3>${escapeHtml(item.label)}</h3>
            <strong>${escapeHtml(item.time)}</strong>
          </article>
        `
      )
      .join("")}
  `;
}

function renderShabbatSchedule(shabbat) {
  if (!shabbatScheduleGrid || !shabbat) return;

  const html = [
    renderTimeTable("Friday Night", shabbat.fridayNight),
    renderTimeTable("Shabbat Morning", [...(shabbat.morning || []), ...(shabbat.latestShema || [])]),
    renderTimeTable("Shabbat Afternoon", shabbat.afternoon),
  ]
    .filter(Boolean)
    .join("");

  if (html) {
    shabbatScheduleGrid.innerHTML = html;
    revealScheduleTimes(shabbatScheduleGrid);
  }
}

function renderAnnouncements(items) {
  if (!announcementsSection || !announcementList) return;
  const announcements = Array.isArray(items) ? items.filter((item) => item.title || item.body) : [];

  announcementsSection.hidden = announcements.length === 0;
  if (!announcements.length) {
    announcementList.innerHTML = "";
    return;
  }

  announcementList.innerHTML = announcements
    .map(
      (item) => `
        <article>
          ${item.date ? `<span>${escapeHtml(item.date)}</span>` : ""}
          ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ""}
          ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ""}
        </article>
      `
    )
    .join("");
}

function updateFastInfoFromBulletin(items) {
  updateScheduleValues(items);
}

function describeBulletinSource(data) {
  const source = data?.source?.fileName || "latest bulletin";
  const date = data?.source?.modifiedTime
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
      }).format(new Date(data.source.modifiedTime))
    : "";
  return date ? `${source} - updated ${date}` : source;
}

function setParshaText(parsha) {
  const normalized = String(parsha || "")
    .replace(/^Parashat\b/i, "")
    .replace(/^Parshat\b/i, "")
    .trim();
  if (!normalized) return;

  setTextWithSwipe(weeklyParsha, `Parshat ${normalized}`);
}

function renderBulletinData(data, statusText) {
  renderRegularSchedule(data.weekday);
  renderShabbatSchedule(data.shabbat);
  renderAnnouncements(data.announcements);
  updateFastInfoFromBulletin(data.weekday);

  const sourceText = describeBulletinSource(data);
  if (bulletinStatus) setTextWithSwipe(bulletinStatus, statusText);
  if (bulletinSource) setTextWithSwipe(bulletinSource, sourceText);
  if (scheduleSource) setTextWithSwipe(scheduleSource, sourceText);
  setParshaText(data.notes?.parsha);
}

async function applyBoardUpdates() {
  if (isFilePreview) return;

  try {
    const updates = await fetchFreshJson("/api/updates");
    const hasScheduleUpdates = Boolean(updates.updatedAt);
    const hasAnnouncements = Array.isArray(updates.announcements) && updates.announcements.length > 0;

    if (hasScheduleUpdates) {
      renderRegularSchedule(updates.weekday);
      renderShabbatSchedule(updates.shabbat);
      updateFastInfoFromBulletin(updates.weekday);
      const updatedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
      }).format(new Date(updates.updatedAt));
      if (scheduleSource) setTextWithSwipe(scheduleSource, `Board update - ${updatedDate}`);
      if (bulletinStatus) setTextWithSwipe(bulletinStatus, "Schedule includes the latest board update.");
    }

    if (hasAnnouncements) renderAnnouncements(updates.announcements);
  } catch {
    // Board updates are optional; the bulletin remains the source of truth if unavailable.
  }
}

async function loadBulletinSchedule() {
  if (isFilePreview) {
    renderBulletinData(fallbackBulletin, "Backup bulletin shown from Bamidbar.");
    return true;
  }

  try {
    const data = await fetchJsonWithCache("/api/bulletin", apiCacheTtl.bulletin);
    renderBulletinData(data, "Weekly schedule loaded from the latest bulletin.");
    await applyBoardUpdates();
    return true;
  } catch {
    renderBulletinData(fallbackBulletin, "Live bulletin unavailable. Backup Bamidbar bulletin shown.");
    await applyBoardUpdates();
    return true;
  }
}

function nextDateForDay(dayNumber) {
  const date = new Date();
  const daysUntil = (dayNumber - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + daysUntil);
  return date;
}

function formatDateForApi(date) {
  return date.toISOString().slice(0, 10);
}

function setShabbatTime(key, value) {
  document.querySelectorAll(`[data-shabbat-time="${key}"]`).forEach((item) => {
    item.textContent = value || "Check bulletin";
  });
}

async function loadWeeklyShabbatTimes() {
  const targets = document.querySelectorAll("[data-shabbat-time]");
  if (!targets.length) return;

  if (isFilePreview) {
    targets.forEach((item) => {
      item.textContent = "Updates weekly";
      item.title = "Live zmanim load when the site is hosted.";
    });
    return;
  }

  const friday = nextDateForDay(5);
  const shabbat = new Date(friday);
  shabbat.setDate(friday.getDate() + 1);

  try {
    const shabbatData = await fetchJsonWithCache(
      "https://www.hebcal.com/shabbat?cfg=json&zip=11598&M=on",
      apiCacheTtl.shabbat
    );
    const candles = shabbatData.items?.find((item) => item.category === "candles");
    const havdalah = shabbatData.items?.find((item) => item.category === "havdalah");

    const fridayZmanim = await fetchJsonWithCache(
      `https://www.hebcal.com/zmanim?cfg=json&zip=11598&date=${formatDateForApi(friday)}`,
      apiCacheTtl.zmanim
    );
    const shabbatZmanim = await fetchJsonWithCache(
      `https://www.hebcal.com/zmanim?cfg=json&zip=11598&date=${formatDateForApi(shabbat)}`,
      apiCacheTtl.zmanim
    );

    setShabbatTime("candles", formatZman(candles?.date));
    setShabbatTime("havdalah", formatZman(havdalah?.date));
    setShabbatTime("sunset", formatZman(fridayZmanim.times?.sunset));
    setShabbatTime("tzeit", formatZman(fridayZmanim.times?.tzeit7083deg));
    setShabbatTime("shemaMGA", formatZman(shabbatZmanim.times?.sofZmanShmaMGA));
    setShabbatTime("shemaGRA", formatZman(shabbatZmanim.times?.sofZmanShma));
    setShabbatTime("chatzot", formatZman(shabbatZmanim.times?.chatzot));
    setShabbatTime(
      "rabbenuTam",
      formatZman(shabbatZmanim.times?.tzeit72min || shabbatZmanim.times?.tzeit72)
    );
  } catch {
    targets.forEach((item) => {
      item.textContent = "Check bulletin";
    });
  }
}

async function initializeSchedule() {
  const bulletinLoaded = await loadBulletinSchedule();
  if (!bulletinLoaded) {
    await loadWeeklyShabbatTimes();
  }
}

initializeSchedule();

function nextMinyanText() {
  const now = new Date();
  const candidates = [];

  for (let offset = 0; offset < 8; offset += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    const day = date.getDay();

    minyanSchedule.forEach((item) => {
      if (!item.day.includes(day)) return;
      const candidate = new Date(date);
      candidate.setHours(item.hour, item.minute, 0, 0);
      if (candidate > now) candidates.push({ ...item, date: candidate, offset });
    });
  }

  candidates.sort((a, b) => a.date - b.date);
  const next = candidates[0];
  if (!next) return "See schedule below";

  const dayLabel =
    next.offset === 0
      ? "Today"
      : next.offset === 1
        ? "Tomorrow"
        : new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(next.date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(next.date);

  return `${dayLabel}: ${next.label} at ${time}`;
}

const nextMinyan = document.querySelector("#next-minyan");
if (nextMinyan) nextMinyan.textContent = nextMinyanText();

const tabButtons = [...document.querySelectorAll(".tab-button")];

function activateTab(button, shouldFocus = false) {
  const tab = button.getAttribute("data-tab");
  tabButtons.forEach((item) => {
    const isActive = item === button;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
    item.tabIndex = isActive ? 0 : -1;
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    const isActive = panel.getAttribute("data-panel") === tab;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
    if (isActive) revealScheduleTimes(panel);
  });

  if (shouldFocus) button.focus();
}

tabButtons.forEach((button, index) => {
  button.addEventListener("click", () => activateTab(button));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabButtons.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabButtons.length - 1;
    activateTab(tabButtons[nextIndex], true);
  });
});

document.querySelectorAll(".faq-question").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest("article");
    const answer = item?.querySelector(".faq-answer");
    const isOpen = item?.classList.toggle("is-open") || false;
    button.setAttribute("aria-expanded", String(isOpen));
    if (answer) answer.hidden = !isOpen;
  });
});

document.querySelectorAll(".resource-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest("article");
    const drawer = item?.querySelector(".resource-drawer");
    const isOpen = item?.classList.toggle("is-open") || false;
    button.setAttribute("aria-expanded", String(isOpen));
    if (drawer) drawer.hidden = !isOpen;
  });
});

const revealItems = document.querySelectorAll(".section, .pillars, .photo-strip, .rabbi-section, .visit-section");
revealItems.forEach((item) => item.classList.add("reveal"));

const motionItems = [
  ...document.querySelectorAll(
    [
      ".masthead-name",
      ".masthead-sub",
      ".masthead-live",
      ".hero-kicker",
      ".hero h1",
      ".hero-copy > p:not(.hero-kicker)",
      ".hero-actions",
      ".status-strip > div",
      ".section-intro",
      ".schedule-tabs",
      ".program-list article",
      ".community-grid article",
      ".sponsor-grid article",
      ".resource-grid article",
      ".resource-accordion",
      ".faq-list article",
      ".zelle-box",
      ".visit-panel > div",
      ".site-footer",
    ].join(", ")
  ),
];

motionItems.forEach((item, index) => {
  item.classList.add("motion-item");
  if (!reduceFirstScrollWork) {
    item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
  }
});

function showMotionItems(scope = document) {
  scope.querySelectorAll(".motion-item").forEach((item) => item.classList.add("is-visible"));
}

if (reduceFirstScrollWork) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
  motionItems.forEach((item) => item.classList.add("is-visible"));
} else if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        showMotionItems(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));

  const motionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        motionObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  motionItems.forEach((item) => motionObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
  motionItems.forEach((item) => item.classList.add("is-visible"));
}
/* Staggered time reveal when schedule scrolls into view */
if (reduceFirstScrollWork) {
  document.querySelectorAll(".schedule-list article strong").forEach((el) => {
    el.classList.add("is-visible");
  });
} else if ('IntersectionObserver' in window) {
  const timeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealScheduleTimes(entry.target);
      timeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.tab-panel').forEach(p => timeObserver.observe(p));
} else {
  document.querySelectorAll('.schedule-list article strong').forEach((el) => {
    el.classList.add('is-visible');
  });
}
