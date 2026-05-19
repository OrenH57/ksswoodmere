const fs = require("node:fs");
const path = require("node:path");
const { parseBulletinText } = require("./bulletin-parser");

const dataDir = path.join(__dirname, "..", "data");
const pdfPath = path.join(dataDir, "uploaded-bulletin.pdf");
const metaPath = path.join(dataDir, "uploaded-bulletin.json");
const maxPdfBytes = 8 * 1024 * 1024;

function cleanFileName(name) {
  return String(name || "weekly-bulletin.pdf")
    .replace(/[^\w .()-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "weekly-bulletin.pdf";
}

function isPdf(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length > 4 && buffer.subarray(0, 4).toString("utf8") === "%PDF";
}

function readUploadedBulletinMeta() {
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    return {
      fileName: cleanFileName(meta.fileName),
      modifiedTime: meta.modifiedTime || null,
      size: Number(meta.size) || 0,
    };
  } catch {
    return null;
  }
}

function hasUploadedBulletin() {
  return fs.existsSync(pdfPath) && Boolean(readUploadedBulletinMeta());
}

async function parsePdfBuffer(pdfBuffer, source) {
  const pdfParse = require("pdf-parse");
  const parsedPdf = await pdfParse(pdfBuffer);
  const bulletin = parseBulletinText(parsedPdf.text);
  bulletin.source = source;
  return { bulletin, text: parsedPdf.text };
}

async function loadUploadedBulletin() {
  const meta = readUploadedBulletinMeta();
  if (!meta || !fs.existsSync(pdfPath)) {
    const error = new Error("No uploaded bulletin found.");
    error.statusCode = 404;
    throw error;
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  return parsePdfBuffer(pdfBuffer, {
    fileName: meta.fileName,
    modifiedTime: meta.modifiedTime,
    sourceType: "upload",
  });
}

async function saveUploadedBulletin({ fileName, base64 }) {
  const pdfBuffer = Buffer.from(String(base64 || ""), "base64");
  if (!isPdf(pdfBuffer)) {
    const error = new Error("Upload must be a PDF file.");
    error.statusCode = 400;
    throw error;
  }

  if (pdfBuffer.length > maxPdfBytes) {
    const error = new Error("Bulletin PDF is too large. Please upload a file smaller than 8 MB.");
    error.statusCode = 413;
    throw error;
  }

  const savedAt = new Date().toISOString();
  const source = {
    fileName: cleanFileName(fileName),
    modifiedTime: savedAt,
    sourceType: "upload",
  };
  const parsed = await parsePdfBuffer(pdfBuffer, source);

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(pdfPath, pdfBuffer);
  fs.writeFileSync(
    metaPath,
    `${JSON.stringify({ fileName: source.fileName, modifiedTime: savedAt, size: pdfBuffer.length }, null, 2)}\n`
  );

  return {
    ...parsed,
    meta: readUploadedBulletinMeta(),
  };
}

module.exports = {
  hasUploadedBulletin,
  loadUploadedBulletin,
  readUploadedBulletinMeta,
  saveUploadedBulletin,
};
