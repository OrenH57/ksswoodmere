const { loadLatestBulletinFromDrive } = require("../lib/bulletin-loader");

const CACHE_HEADER = "s-maxage=900, stale-while-revalidate=3600";

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
    const { bulletin } = await loadLatestBulletinFromDrive();
    response.setHeader("Cache-Control", CACHE_HEADER);
    sendJson(response, 200, bulletin);
  } catch (error) {
    response.setHeader("Cache-Control", "no-store");
    sendJson(response, error.statusCode || 500, {
      error: "Could not load the weekly bulletin.",
      detail: error instanceof Error ? error.message : String(error),
      requiredEnv: error.requiredEnv,
      missingEnv: error.missingEnv,
      envPresence: error.envPresence,
      vercelEnv: process.env.VERCEL_ENV || null,
    });
  }
};
