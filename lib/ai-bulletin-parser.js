const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4o-mini";

const scheduleItemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["label", "time"],
  properties: {
    label: { type: "string" },
    time: { type: "string" },
  },
};

const bulletinSchema = {
  type: "object",
  additionalProperties: false,
  required: ["shabbat", "weekday", "notes"],
  properties: {
    shabbat: {
      type: "object",
      additionalProperties: false,
      required: ["thursdayNight", "fridayNight", "morning", "latestShema", "afternoon"],
      properties: {
        thursdayNight: { type: "array", items: scheduleItemSchema },
        fridayNight: { type: "array", items: scheduleItemSchema },
        morning: { type: "array", items: scheduleItemSchema },
        latestShema: { type: "array", items: scheduleItemSchema },
        afternoon: { type: "array", items: scheduleItemSchema },
      },
    },
    weekday: { type: "array", items: scheduleItemSchema },
    notes: {
      type: "object",
      additionalProperties: false,
      required: ["parsha", "dateText", "holidayName"],
      properties: {
        parsha: { type: "string" },
        dateText: { type: "string" },
        holidayName: { type: "string" },
      },
    },
  },
};

function canUseAiBulletinParser() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function extractOutputText(responseJson) {
  if (typeof responseJson.output_text === "string") return responseJson.output_text;

  const content = (responseJson.output || []).flatMap((item) => item.content || []);
  const textItem = content.find((item) => item.type === "output_text" && typeof item.text === "string");
  return textItem?.text || "";
}

function cleanLabel(label) {
  return String(label || "")
    .replace(/\.{2,}/g, " ")
    .replace(/\s*·\s*/g, " - ")
    .replace(/\s+-\s*/g, " - ")
    .replace(/\bShaharit\b/gi, "Shacharit")
    .replace(/\bKabalat\b/gi, "Kabbalat")
    .replace(/\bMinha\b/gi, "Mincha")
    .replace(/\bArvit\s*\/\s*Maariv\b/gi, "Arvit")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalLabel(label) {
  const cleaned = cleanLabel(label);
  const normalized = cleaned.toLowerCase();

  if (/^candle lighting\b/.test(normalized)) return "Candle Lighting";
  if (/^shir hashirim\b/.test(normalized)) return "Shir Hashirim";
  if (/^mincha\b.*kab+alat\b.*shabbat/.test(normalized)) return "Mincha & Kabbalat Shabbat";
  if (/^mincha\s*&\s*arvit\b/.test(normalized)) return "Mincha & Arvit";
  if (/^tikun leil/.test(normalized)) return "Tikun Leil Shavuot";
  if (/^ben ish hai/.test(normalized)) return "Ben Ish Hai Class";
  if (/^shacharit\b.*korbanot/.test(normalized)) return "Shacharit - Korbanot";
  if (/^shacharit\b.*hodu/.test(normalized)) return "Shacharit - Hodu";
  if (/^shacharit\b.*amida/.test(normalized)) return "Shacharit - Amida";
  if (/^shacharit\b/.test(normalized)) return "Shacharit";
  if (/^kids program\b/.test(normalized)) return cleaned.includes("-") ? cleaned : "Kids Program";
  if (/^ladies tehillim\b/.test(normalized)) return "Ladies Tehillim & Brachot";
  if (/halacha.*shiur/.test(normalized)) return "Halacha Shiur";
  if (/parsha.*shiur/.test(normalized)) return "Parsha Shiur";
  if (/men.*ladies.*shiur/.test(normalized)) return "Men's & Ladies' Shiur";
  if (/^mincha\b/.test(normalized)) return "Mincha";
  if (/^(arvit|maariv)\b/.test(normalized)) return "Arvit";
  return cleaned;
}

function cleanTime(time, defaultPeriod = "") {
  const match = String(time || "").match(/\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i);
  if (!match) {
    const fallback = String(time || "").match(/\b(\d{1,2})(?::(\d{2}))?\b/);
    if (!fallback || !defaultPeriod) return String(time || "").trim();
    return `${Number(fallback[1])}:${fallback[2] || "00"} ${defaultPeriod}`;
  }
  return `${Number(match[1])}:${match[2] || "00"} ${match[3].toUpperCase()}`;
}

function isNoiseLabel(label) {
  return /shema|chazot|shkia|sunset|tzeit|ends|rabbenu tam|morning speech|sponsorship|balance|announcement|hilchot|lechem|bishul/i.test(label);
}

function minutesFromTime(time) {
  const match = String(time || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(match[2]);
}

function itemKey(item) {
  return `${item.label} ${item.time}`.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cleanItems(items = [], defaultPeriod = "") {
  const cleaned = [];
  (Array.isArray(items) ? items : []).forEach((item) => {
    const label = canonicalLabel(item?.label);
    const time = cleanTime(item?.time, defaultPeriod);
    if (!label || !time || isNoiseLabel(label)) return;
    const next = { label, time };
    if (!cleaned.some((existing) => itemKey(existing) === itemKey(next))) cleaned.push(next);
  });
  return cleaned.sort((left, right) => minutesFromTime(left.time) - minutesFromTime(right.time));
}

function hasThursdayNightSource(text) {
  const key = String(text || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ["THURSDAYNIGHT", "THURSDAY", "EREVYOMTOV", "YOMTOVNIGHT", "FIRSTNIGHT", "SECONDNIGHT", "EREVSHAVUOT"].some((value) =>
    key.includes(value)
  );
}

function cleanBulletin(bulletin, sourceText = "") {
  return {
    shabbat: {
      thursdayNight: hasThursdayNightSource(sourceText) ? cleanItems(bulletin?.shabbat?.thursdayNight, "PM") : [],
      fridayNight: cleanItems(bulletin?.shabbat?.fridayNight, "PM"),
      morning: cleanItems(bulletin?.shabbat?.morning, "AM"),
      latestShema: [],
      afternoon: cleanItems(bulletin?.shabbat?.afternoon, "PM"),
    },
    weekday: cleanItems(bulletin?.weekday),
    notes: {
      parsha: String(bulletin?.notes?.parsha || "").replace(/^Par(?:ash|sh)at\s+/i, "").trim(),
      dateText: String(bulletin?.notes?.dateText || "").trim(),
      holidayName: String(bulletin?.notes?.holidayName || "").trim(),
    },
  };
}

async function parseBulletinPdfWithAi(pdfBuffer, fileName = "weekly-bulletin.pdf", extractedText = "") {
  if (!canUseAiBulletinParser()) {
    const error = new Error("OPENAI_API_KEY is not configured.");
    error.code = "AI_PARSER_NOT_CONFIGURED";
    throw error;
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      input: [
        {
          role: "system",
          content:
            "Read this synagogue bulletin PDF visually and return the final website schedule JSON. Use the PDF layout, not just raw text order. Map holiday flyers into the existing fields: Erev Yom Tov/Thursday Night/First Night/Second Night/Yom Tov Night goes in thursdayNight; Friday Night/Erev Shabbat goes in fridayNight; Shabbat Morning/Yom Tov Morning/First Day/Second Day goes in morning; Shabbat Afternoon/Yom Tov Afternoon/Motzaei goes in afternoon; regular weekday minyanim go in weekday. If a Friday/First Day section contains morning Shacharit rows, place those rows in morning, not fridayNight. Always set latestShema to an empty array. Do not include Shema times. Exclude Chazot, Shkia, Sunset, Tzeit, Shabbat ends, Chag ends, Rabbenu Tam, speeches, sponsorships, balances, dedications, prose, announcements, and individual all-night learning topic rows such as Hilchot Lechem Mishneh or Hilchot Bishul. Include only clean minyan, candle lighting, main class/shiur, kids program, Tehillim, Tikun Leil Shavuot start time, and relevant holiday schedule rows. Remove duplicates and order each group by time. Do not invent times.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_file",
              filename: fileName,
              file_data: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
            },
            {
              type: "input_text",
              text: `Raw extracted text for reference only. Trust the PDF layout over this text if they conflict:\n\n${extractedText}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "bulletin_schedule",
          strict: true,
          schema: bulletinSchema,
        },
      },
    }),
  });

  const responseJson = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = responseJson.error?.message || response.statusText || "OpenAI request failed.";
    throw new Error(`AI bulletin parser failed: ${detail}`);
  }

  return cleanBulletin(JSON.parse(extractOutputText(responseJson)), extractedText);
}

module.exports = {
  canUseAiBulletinParser,
  parseBulletinPdfWithAi,
};
