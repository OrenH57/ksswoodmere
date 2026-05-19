const { parseBulletinText } = require("./bulletin-parser");

const DRIVE_FIELDS = "files(id,name,modifiedTime,mimeType)";

async function driveErrorMessage(response, action) {
  let detail = "";

  try {
    const data = await response.json();
    detail = data.error?.message ? ` - ${data.error.message}` : "";
  } catch {
    // Google Drive error bodies are usually JSON, but the status still gives a useful signal.
  }

  return `Drive ${action} failed: ${response.status}${detail}`;
}

async function loadLatestBulletinFromDrive() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const missingEnv = [
    ["GOOGLE_DRIVE_FOLDER_ID", folderId],
    ["GOOGLE_DRIVE_API_KEY", apiKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingEnv.length) {
    const error = new Error("Bulletin source is not configured.");
    error.statusCode = 503;
    error.requiredEnv = ["GOOGLE_DRIVE_FOLDER_ID", "GOOGLE_DRIVE_API_KEY"];
    error.missingEnv = missingEnv;
    error.envPresence = {
      GOOGLE_DRIVE_FOLDER_ID: Boolean(folderId),
      GOOGLE_DRIVE_API_KEY: Boolean(apiKey),
    };
    throw error;
  }

  const query = encodeURIComponent(`'${folderId}' in parents and mimeType='application/pdf' and trashed=false`);
  const listUrl =
    `https://www.googleapis.com/drive/v3/files?q=${query}` +
    `&orderBy=modifiedTime desc&pageSize=1&fields=${encodeURIComponent(DRIVE_FIELDS)}` +
    `&includeItemsFromAllDrives=true&supportsAllDrives=true&key=${apiKey}`;

  const listResponse = await fetch(listUrl);
  if (!listResponse.ok) throw new Error(await driveErrorMessage(listResponse, "list"));

  const listData = await listResponse.json();
  const latestFile = listData.files?.[0];
  if (!latestFile) {
    const error = new Error("No PDF bulletin found in the configured Drive folder.");
    error.statusCode = 404;
    throw error;
  }

  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${latestFile.id}?alt=media&key=${apiKey}`;
  const pdfResponse = await fetch(downloadUrl);
  if (!pdfResponse.ok) throw new Error(await driveErrorMessage(pdfResponse, "download"));

  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
  const pdfParse = require("pdf-parse");
  const parsedPdf = await pdfParse(pdfBuffer);
  const bulletin = parseBulletinText(parsedPdf.text);

  bulletin.source = {
    fileName: latestFile.name,
    modifiedTime: latestFile.modifiedTime,
  };

  return {
    bulletin,
    text: parsedPdf.text,
  };
}

module.exports = {
  loadLatestBulletinFromDrive,
};
