const { loadPreferredBulletin } = require("../lib/bulletin-loader");

const CACHE_HEADER = "no-store";

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

module.exports = async function bulletinHandler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const { bulletin } = await loadPreferredBulletin();
    response.setHeader("Cache-Control", CACHE_HEADER);
    sendJson(response, 200, bulletin);
  } catch (error) {
    response.setHeader("Cache-Control", "no-store");
    sendJson(response, error.statusCode || 500, {
      error: "Could not load the uploaded weekly bulletin.",
      detail: error instanceof Error ? error.message : String(error),
      vercelEnv: process.env.VERCEL_ENV || null,
    });
  }
};
