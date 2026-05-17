const { loadLatestBulletinFromDrive } = require("../lib/bulletin-loader");
const { normalizeText } = require("../lib/bulletin-parser");

const CACHE_HEADER = "no-store";
const MAX_QUESTION_LENGTH = 500;
const MAX_BULLETIN_CHARS = 15000;

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function sourceLabel(source) {
  if (!source?.fileName) return "weekly bulletin";
  return source.modifiedTime ? `${source.fileName}, updated ${source.modifiedTime}` : source.fileName;
}

function scoreLine(line, words) {
  const lower = line.toLowerCase();
  return words.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0);
}

function fallbackAnswer(question, bulletin, text) {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const lines = normalizeText(text);
  const matches = lines
    .map((line) => ({ line, score: scoreLine(line, words) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.line);

  if (matches.length) {
    return {
      answer: `I found this in the ${sourceLabel(bulletin.source)}:\n\n${matches.map((line) => `- ${line}`).join("\n")}`,
      mode: "bulletin-search",
    };
  }

  const schedule = [
    ...(bulletin.shabbat?.fridayNight || []),
    ...(bulletin.shabbat?.morning || []),
    ...(bulletin.shabbat?.latestShema || []),
    ...(bulletin.shabbat?.afternoon || []),
    ...(bulletin.weekday || []),
  ];
  const scheduleText = schedule.map((item) => `- ${item.label}: ${item.time}`).join("\n");

  return {
    answer:
      `I could not find a direct match in the ${sourceLabel(bulletin.source)}. ` +
      `Here are the main bulletin times I can read:\n\n${scheduleText || "- No schedule items found."}`,
    mode: "bulletin-search",
  };
}

function getOpenAiText(data) {
  if (typeof data.output_text === "string") return data.output_text.trim();

  const parts = [];
  data.output?.forEach((item) => {
    item.content?.forEach((content) => {
      if (content.type === "output_text" && content.text) parts.push(content.text);
    });
  });
  return parts.join("\n").trim();
}

async function answerWithOpenAi(question, bulletin, text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-5-nano";
  const bulletinText = normalizeText(text).join("\n").slice(0, MAX_BULLETIN_CHARS);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You answer questions for Kehilat Shaare Shalom using only the weekly bulletin text supplied by the server. " +
            "If the bulletin does not contain the answer, say that clearly and suggest emailing ksswoodmere@gmail.com. " +
            "Keep answers concise and practical.",
        },
        {
          role: "user",
          content: `Bulletin source: ${sourceLabel(bulletin.source)}\n\nBulletin text:\n${bulletinText}\n\nQuestion: ${question}`,
        },
      ],
      max_output_tokens: 350,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);

  const data = await response.json();
  const answer = getOpenAiText(data);
  if (!answer) throw new Error("OpenAI returned an empty answer.");

  return {
    answer,
    mode: "ai",
    model,
  };
}

module.exports = async function askAiHandler(request, response) {
  response.setHeader("Cache-Control", CACHE_HEADER);

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    const question = String(body.question || "").trim().slice(0, MAX_QUESTION_LENGTH);

    if (!question) {
      sendJson(response, 400, { error: "Question is required." });
      return;
    }

    const { bulletin, text } = await loadLatestBulletinFromDrive();
    const aiAnswer = await answerWithOpenAi(question, bulletin, text);
    const result = aiAnswer || fallbackAnswer(question, bulletin, text);

    sendJson(response, 200, {
      ...result,
      source: bulletin.source,
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: "Could not answer from the weekly bulletin.",
      detail: error instanceof Error ? error.message : String(error),
      requiredEnv: error.requiredEnv,
    });
  }
};
