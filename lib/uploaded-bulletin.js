const fs = require("node:fs");
const path = require("node:path");
const { readBlobBuffer, readBlobJson, requirePersistentStorage, writeBlobBuffer, writeBlobJson } = require("./blob-storage");
const { parseBulletinText } = require("./bulletin-parser");
const { canUseAiBulletinParser, parseBulletinPdfWithAi } = require("./ai-bulletin-parser");
const { getRuntimeDataDir } = require("./runtime-storage");

const dataDir = getRuntimeDataDir();
const pdfPath = path.join(dataDir, "uploaded-bulletin.pdf");
const metaPath = path.join(dataDir, "uploaded-bulletin.json");
const parsedPath = path.join(dataDir, "uploaded-bulletin-parsed.json");
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

function normalizeUploadedBulletinMeta(meta) {
  if (!meta) return null;
  return {
    fileName: cleanFileName(meta.fileName),
    modifiedTime: meta.modifiedTime || null,
    size: Number(meta.size) || 0,
  };
}

function readLocalUploadedBulletinMeta() {
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    return normalizeUploadedBulletinMeta(meta);
  } catch {
    return null;
  }
}

async function readUploadedBulletinMeta() {
  try {
    const meta = await readBlobJson("uploaded-bulletin.json");
    if (meta) return normalizeUploadedBulletinMeta(meta);
  } catch {
    // Fall back to local runtime metadata.
  }

  return readLocalUploadedBulletinMeta();
}

async function hasUploadedBulletin() {
  if (await readUploadedBulletinMeta()) return true;
  return fs.existsSync(pdfPath) && Boolean(readLocalUploadedBulletinMeta());
}

async function parsePdfBuffer(pdfBuffer, source) {
  const pdfParse = require("pdf-parse");
  const parsedPdf = await pdfParse(pdfBuffer);
  let bulletin = null;
  const parserSource = { ...source, parser: "local" };
  if (canUseAiBulletinParser()) {
    try {
      bulletin = await parseBulletinPdfWithAi(pdfBuffer, source.fileName, parsedPdf.text);
      parserSource.parser = "ai";
    } catch {
      parserSource.parserWarning = "AI parser failed; used local parser fallback.";
      bulletin = null;
    }
  }
  if (!bulletin) bulletin = parseBulletinText(parsedPdf.text);
  bulletin.source = parserSource;
  return { bulletin, text: parsedPdf.text };
}

function parsedMatchesMeta(parsed, meta) {
  const source = parsed?.bulletin?.source;
  return Boolean(
    source &&
      source.fileName === meta.fileName &&
      source.modifiedTime === meta.modifiedTime &&
      source.sourceType === "upload"
  );
}

function readLocalParsedBulletin(meta) {
  try {
    const parsed = JSON.parse(fs.readFileSync(parsedPath, "utf8"));
    return parsedMatchesMeta(parsed, meta) ? parsed : null;
  } catch {
    return null;
  }
}

async function readParsedBulletin(meta) {
  try {
    const parsed = await readBlobJson("uploaded-bulletin-parsed.json");
    if (parsedMatchesMeta(parsed, meta)) return parsed;
  } catch {
    // Fall back to local runtime parsed data.
  }

  return readLocalParsedBulletin(meta);
}

async function cacheParsedBulletin(parsed) {
  try {
    if (await writeBlobJson("uploaded-bulletin-parsed.json", parsed)) return;
  } catch {
    // Parsed bulletin caching should never block public schedule reads.
  }

  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(parsedPath, `${JSON.stringify(parsed, null, 2)}\n`);
  } catch {
    // Read-only runtimes can still serve the parsed response for this request.
  }
}

async function loadUploadedBulletin() {
  const meta = await readUploadedBulletinMeta();
  if (!meta) {
    const error = new Error("No uploaded bulletin found.");
    error.statusCode = 404;
    throw error;
  }

  const parsed = await readParsedBulletin(meta);
  if (parsed) return parsed;

  const pdfBuffer = (await readBlobBuffer("uploaded-bulletin.pdf")) || (fs.existsSync(pdfPath) ? fs.readFileSync(pdfPath) : null);
  if (!pdfBuffer) {
    const error = new Error("No uploaded bulletin found.");
    error.statusCode = 404;
    throw error;
  }

  const reparsed = await parsePdfBuffer(pdfBuffer, {
    fileName: meta.fileName,
    modifiedTime: meta.modifiedTime,
    sourceType: "upload",
  });
  await cacheParsedBulletin(reparsed);
  return reparsed;
}

async function saveUploadedBulletin({ fileName, base64, buffer }) {
  const pdfBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(String(base64 || ""), "base64");
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
  const meta = { fileName: source.fileName, modifiedTime: savedAt, size: pdfBuffer.length };

  try {
    const savedPdf = await writeBlobBuffer("uploaded-bulletin.pdf", pdfBuffer, "application/pdf");
    const savedMeta = await writeBlobJson("uploaded-bulletin.json", meta);
    const savedParsed = await writeBlobJson("uploaded-bulletin-parsed.json", parsed);
    if (savedPdf && savedMeta && savedParsed) {
      return {
        ...parsed,
        meta,
      };
    }
    requirePersistentStorage();
  } catch (error) {
    requirePersistentStorage(error);
  }

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(pdfPath, pdfBuffer);
  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  fs.writeFileSync(parsedPath, `${JSON.stringify(parsed, null, 2)}\n`);

  return {
    ...parsed,
    meta: readLocalUploadedBulletinMeta(),
  };
}

module.exports = {
  hasUploadedBulletin,
  loadUploadedBulletin,
  readUploadedBulletinMeta,
  saveUploadedBulletin,
};
