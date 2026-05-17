const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

const scrollProgress = document.createElement("div");
scrollProgress.className = "scroll-progress";
document.body.prepend(scrollProgress);

function updateScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  scrollProgress.style.width = `${Math.min(progress, 1) * 100}%`;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);
updateScrollProgress();

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

copyButton?.addEventListener("click", async () => {
  const value = copyButton.getAttribute("data-copy") || "";
  if (copyStatus) copyStatus.textContent = "Copying...";

  try {
    await navigator.clipboard.writeText(value);
    if (copyStatus) copyStatus.textContent = "Copied.";
  } catch {
    if (copyStatus) copyStatus.textContent = "Copy failed. Select the email above.";
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
    const response = await fetch(url);
    if (!response.ok) throw new Error("Zmanim request failed");
    const data = await response.json();
    const items = zmanimLabels
      .map(([key, label]) => [label, formatZman(data.times?.[key])])
      .filter(([, time]) => time);

    zmanimList.innerHTML = items
      .map(([label, time]) => `<div class="zmanim-item"><span>${label}</span><strong>${time}</strong></div>`)
      .join("");

    zmanimStatus.textContent = `Woodmere, NY - ${new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/New_York",
    }).format(new Date())}`;
  } catch {
    zmanimStatus.textContent = "Live zmanim could not be loaded. Please check Hebcal or your local luach.";
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
    return { context: "Regular", name: normalized };
  }

  return {
    context: match[1].replace("Mon-Fri", "Monday-Friday"),
    name: match[2],
  };
}

function renderRegularSchedule(items) {
  if (!regularScheduleList || !Array.isArray(items) || !items.length) return;

  regularScheduleList.innerHTML = items
    .map((item) => {
      const split = splitScheduleLabel(item.label);
      return `
        <article>
          <p>${escapeHtml(split.context)}</p>
          <h3>${escapeHtml(split.name)}</h3>
          <strong>${escapeHtml(item.time)}</strong>
        </article>
      `;
    })
    .join("");
}

function renderTimeTable(title, items) {
  if (!Array.isArray(items) || !items.length) return "";

  return `
    <article class="time-table">
      <h3>${escapeHtml(title)}</h3>
      <dl>
        ${items
          .map(
            (item) => `
              <div>
                <dt>${escapeHtml(item.label)}</dt>
                <dd>${escapeHtml(item.time)}</dd>
              </div>
            `
          )
          .join("")}
      </dl>
    </article>
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

  if (html) shabbatScheduleGrid.innerHTML = html;
}

function updateFastInfoFromBulletin(items) {
  if (!Array.isArray(items) || !items.length) return;

  const lookup = new Map(items.map((item) => [item.label.toLowerCase(), item.time]));
  document.querySelectorAll(".quick-times div, .fast-info-grid article:first-child dl div").forEach((row) => {
    const label = row.querySelector("span, dt")?.textContent?.toLowerCase() || "";
    const value = row.querySelector("strong, dd");
    if (!value) return;

    if (label.includes("monday") || label.includes("mon-fri")) value.textContent = lookup.get("monday-friday shacharit") || value.textContent;
    if (label.includes("sunday")) value.textContent = lookup.get("sunday shacharit") || value.textContent;
    if (label.includes("mincha")) value.textContent = lookup.get("daily mincha & arvit") || value.textContent;
  });
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

async function loadBulletinSchedule() {
  if (isFilePreview) {
    if (bulletinStatus) bulletinStatus.textContent = "Available when hosted";
    return false;
  }

  try {
    const response = await fetch("/api/bulletin", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Bulletin API unavailable");
    const data = await response.json();

    renderRegularSchedule(data.weekday);
    renderShabbatSchedule(data.shabbat);
    updateFastInfoFromBulletin(data.weekday);

    const sourceText = describeBulletinSource(data);
    if (bulletinStatus) bulletinStatus.textContent = "Updated from bulletin";
    if (bulletinSource) bulletinSource.textContent = sourceText;
    if (scheduleSource) scheduleSource.textContent = sourceText;
    return true;
  } catch {
    if (bulletinStatus) bulletinStatus.textContent = "Using regular schedule";
    if (bulletinSource) bulletinSource.textContent = "Weekly bulletin schedule will load after Vercel setup.";
    if (scheduleSource) scheduleSource.textContent = "Using regular schedule until Google Drive bulletin setup is connected.";
    return false;
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
    const shabbatResponse = await fetch("https://www.hebcal.com/shabbat?cfg=json&zip=11598&M=on");
    if (!shabbatResponse.ok) throw new Error("Shabbat times request failed");
    const shabbatData = await shabbatResponse.json();
    const candles = shabbatData.items?.find((item) => item.category === "candles");
    const havdalah = shabbatData.items?.find((item) => item.category === "havdalah");

    const fridayZmanimResponse = await fetch(
      `https://www.hebcal.com/zmanim?cfg=json&zip=11598&date=${formatDateForApi(friday)}`
    );
    const shabbatZmanimResponse = await fetch(
      `https://www.hebcal.com/zmanim?cfg=json&zip=11598&date=${formatDateForApi(shabbat)}`
    );
    if (!fridayZmanimResponse.ok || !shabbatZmanimResponse.ok) throw new Error("Zmanim request failed");

    const fridayZmanim = await fridayZmanimResponse.json();
    const shabbatZmanim = await shabbatZmanimResponse.json();

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

const minyanSchedule = [
  { label: "Shacharit", detail: "Monday-Friday", day: [1, 2, 3, 4, 5], hour: 6, minute: 0 },
  { label: "Shacharit", detail: "Sunday", day: [0], hour: 7, minute: 45 },
  { label: "Mincha & Arvit", detail: "Daily", day: [0, 1, 2, 3, 4, 5, 6], hour: 19, minute: 15 },
];

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

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.getAttribute("data-tab");
    document.querySelectorAll(".tab-button").forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.getAttribute("data-panel") === tab);
    });
  });
});

document.querySelectorAll(".faq-question").forEach((button) => {
  button.addEventListener("click", () => {
    button.closest("article")?.classList.toggle("is-open");
  });
});

document.querySelectorAll(".resource-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest("article");
    const isOpen = item?.classList.toggle("is-open") || false;
    button.setAttribute("aria-expanded", String(isOpen));
  });
});

const revealItems = document.querySelectorAll(".section, .pillars, .photo-strip, .rabbi-section, .visit-section");
revealItems.forEach((item) => item.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
