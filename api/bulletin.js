const { parseBulletinText } = require("../lib/bulletin-parser");

const DRIVE_FIELDS = "files(id,name,modifiedTime,mimeType)";
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

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!folderId || !apiKey) {
    sendJson(response, 503, {
      error: "Bulletin source is not configured.",
      requiredEnv: ["GOOGLE_DRIVE_FOLDER_ID", "GOOGLE_DRIVE_API_KEY"],
    });
    return;
  }

  try {
    const query = encodeURIComponent(`'${folderId}' in parents and mimeType='application/pdf' and trashed=false`);
    const listUrl =
      `https://www.googleapis.com/drive/v3/files?q=${query}` +
      `&orderBy=modifiedTime desc&pageSize=1&fields=${encodeURIComponent(DRIVE_FIELDS)}&key=${apiKey}`;

    const listResponse = await fetch(listUrl);
    if (!listResponse.ok) throw new Error(`Drive list failed: ${listResponse.status}`);

    const listData = await listResponse.json();
    const latestFile = listData.files?.[0];
    if (!latestFile) {
      sendJson(response, 404, { error: "No PDF bulletin found in the configured Drive folder." });
      return;
    }

    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${latestFile.id}?alt=media&key=${apiKey}`;
    const pdfResponse = await fetch(downloadUrl);
    if (!pdfResponse.ok) throw new Error(`Drive download failed: ${pdfResponse.status}`);

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    const pdfParse = require("pdf-parse");
    const parsedPdf = await pdfParse(pdfBuffer);
    const bulletin = parseBulletinText(parsedPdf.text);

    bulletin.source = {
      fileName: latestFile.name,
      modifiedTime: latestFile.modifiedTime,
    };

    response.setHeader("Cache-Control", CACHE_HEADER);
    sendJson(response, 200, bulletin);
  } catch (error) {
    sendJson(response, 500, {
      error: "Could not load the weekly bulletin.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
};
