const SECTION_KEYS = {
  "FRIDAY NIGHT": "fridayNight",
  "SHABBAT MORNING": "morning",
  "LATEST SHEMA": "latestShema",
  "SHABBAT AFTERNOON": "afternoon",
};

const SECTION_ORDER = [
  "FRIDAY NIGHT",
  "SHABBAT MORNING",
  "LATEST SHEMA",
  "SHABBAT AFTERNOON",
  "WEEKDAY MINYANIM",
  "THIS WEEK'S SPONSORS",
  "BALANCES",
];

function cleanLine(line) {
  return line
    .replace(/[•◆]/g, " ")
    .replace(/\?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactHeading(line) {
  return cleanLine(line).replace(/\s+/g, "").toUpperCase();
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);
}

function findHeadingIndex(lines, heading) {
  const target = heading.replace(/\s+/g, "").toUpperCase();
  return lines.findIndex((line) => compactHeading(line).replace(/[^A-Z]/g, "") === target.replace(/[^A-Z]/g, ""));
}

function sliceSection(lines, heading) {
  const start = findHeadingIndex(lines, heading);
  if (start === -1) return [];

  const nextIndexes = SECTION_ORDER
    .filter((item) => item !== heading)
    .map((item) => findHeadingIndex(lines, item))
    .filter((index) => index > start);
  const end = nextIndexes.length ? Math.min(...nextIndexes) : lines.length;

  return lines.slice(start + 1, end);
}

function normalizeLabel(label) {
  return label
    .replace(/\s*·\s*/g, " - ")
    .replace(/\s*\?\s*/g, " - ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\bNEW\b/gi, "")
    .replace(/\s+-\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferPeriod(label, sectionKey, hour) {
  const normalized = label.toLowerCase();

  if (sectionKey === "fridayNight" || sectionKey === "afternoon") return "PM";
  if (sectionKey === "morning" || sectionKey === "latestShema") return "AM";
  if (normalized.includes("mincha") || normalized.includes("arvit")) return "PM";
  if (normalized.includes("shacharit")) return "AM";
  if (hour === 12) return "PM";
  return hour >= 6 && hour <= 11 ? "AM" : "PM";
}

function formatTime(hourText, minuteText, period) {
  const hour = Number(hourText);
  const minute = String(minuteText).padStart(2, "0");
  return `${hour}:${minute} ${period.toUpperCase()}`;
}

function parseScheduleLine(line, sectionKey) {
  const matches = [...line.matchAll(/(.+?)\s*(\d{1,2}):(\d{2})(?:\s*(AM|PM))?(?=\s*[A-Za-z"']|\s*$)/gi)];
  if (!matches.length) return [];

  return matches.map((match) => {
    const label = normalizeLabel(match[1]);
    const period = match[4] || inferPeriod(label, sectionKey, Number(match[2]));
    return {
      label,
      time: formatTime(match[2], match[3], period),
    };
  });
}

function parseSection(lines, heading) {
  const sectionKey = SECTION_KEYS[heading];
  return sliceSection(lines, heading).flatMap((line) => parseScheduleLine(line, sectionKey));
}

function parseLatestShema(lines) {
  return parseSection(lines, "LATEST SHEMA").filter((item) => /^(M"?A|Gr"?A)$/i.test(item.label));
}

function parseMorningExtrasFromShemaSection(lines) {
  return parseSection(lines, "LATEST SHEMA").filter((item) => !/^(M"?A|Gr"?A)$/i.test(item.label));
}

function parseWeekday(lines) {
  const sectionLines = sliceSection(lines, "WEEKDAY MINYANIM");
  const scopedLines = sectionLines.length ? sectionLines : lines;

  function parseDirect(sourceLines) {
    const directItems = [];

    sourceLines.forEach((line, index) => {
      const heading = compactHeading(line).replace(/[^A-Z]/g, "");
      const nextLine = sourceLines[index + 1] || "";

      if (heading === "SUNDAY") {
        parseScheduleLine(nextLine, "morning").forEach((item) => {
          directItems.push({ label: `Sunday ${item.label}`, time: item.time });
        });
      }

      if (heading === "MONFRI") {
        parseScheduleLine(nextLine, "morning").forEach((item) => {
          directItems.push({ label: `Monday-Friday ${item.label}`, time: item.time });
        });
      }

      if (heading === "DAILY") {
        parseScheduleLine(nextLine, "afternoon").forEach((item) => {
          directItems.push({ label: `Daily ${item.label}`, time: item.time });
        });
      }
    });

    return directItems;
  }

  const directItems = parseDirect(scopedLines);
  if (!directItems.length && sectionLines.length) directItems.push(...parseDirect(lines));

  if (directItems.length) return directItems;

  const text = scopedLines.join(" ");
  const items = [];

  const sunday = text.match(/SUNDAY\s+Shacharit\s*[·-]?\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (sunday) {
    items.push({
      label: "Sunday Shacharit",
      time: formatTime(sunday[1], sunday[2], sunday[3] || "AM"),
    });
  }

  const weekday = text.match(/MON\s*[–-]\s*FRI\s+Shacharit\s*[·-]?\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (weekday) {
    items.push({
      label: "Monday-Friday Shacharit",
      time: formatTime(weekday[1], weekday[2], weekday[3] || "AM"),
    });
  }

  const daily = text.match(/DAILY\s+Mincha\s*&\s*Arvit\s*[·-]?\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (daily) {
    items.push({
      label: "Daily Mincha & Arvit",
      time: formatTime(daily[1], daily[2], daily[3] || "PM"),
    });
  }

  return items;
}

function parseBulletinText(text) {
  const lines = normalizeText(text);
  const firstDateLine =
    lines.find((line) => /\b\d{1,2}\s+\w+\s+\d{4}\b/.test(line)) ||
    lines.find((line) => /\b\w+\s+\d{1,2}\s*[–-]\s*\d{1,2},?\s+\d{4}\b/.test(line)) ||
    "";
  const parshaLine = lines.find((line) => /^Par(?:ash|sh)at\s+/i.test(line)) || "";

  return {
    source: {},
    shabbat: {
      fridayNight: parseSection(lines, "FRIDAY NIGHT"),
      morning: [...parseSection(lines, "SHABBAT MORNING"), ...parseMorningExtrasFromShemaSection(lines)],
      latestShema: parseLatestShema(lines),
      afternoon: parseSection(lines, "SHABBAT AFTERNOON"),
    },
    weekday: parseWeekday(lines),
    notes: {
      parsha: parshaLine.replace(/^Par(?:ash|sh)at\s+/i, "").trim(),
      dateText: firstDateLine,
    },
  };
}

module.exports = {
  parseBulletinText,
  normalizeText,
};
