const blobPrefix = process.env.KSS_BLOB_PREFIX || "ksswoodmere";
const jsonCacheControlMaxAge = 60;

function blobPath(name) {
  return `${blobPrefix}/${name}`;
}

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function getBlobSdk() {
  return import("@vercel/blob");
}

async function streamToBuffer(stream) {
  const reader = stream.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks);
}

async function readBlobText(name) {
  const buffer = await readBlobBuffer(name);
  return buffer ? buffer.toString("utf8") : null;
}

async function readBlobBuffer(name) {
  if (!hasBlobStorage()) return null;
  const { get } = await getBlobSdk();
  for (const access of ["private", "public"]) {
    let result = null;
    try {
      result = await get(blobPath(name), {
        access,
        useCache: false,
      });
    } catch {
      // Existing blobs may have the opposite access level while production rolls over.
      continue;
    }

    if (result?.stream) return streamToBuffer(result.stream);
  }

  return null;
}

function blobWriteOptions(contentType) {
  const options = {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  };

  if (contentType.includes("json")) {
    options.cacheControlMaxAge = jsonCacheControlMaxAge;
  }

  return options;
}

async function readBlobJson(name) {
  const text = await readBlobText(name);
  if (!text) return null;
  return JSON.parse(text);
}

async function writeBlobText(name, value, contentType = "text/plain; charset=utf-8") {
  if (!hasBlobStorage()) return null;
  const { put } = await getBlobSdk();
  return put(blobPath(name), value, blobWriteOptions(contentType));
}

async function writeBlobBuffer(name, value, contentType = "application/octet-stream") {
  if (!hasBlobStorage()) return null;
  const { put } = await getBlobSdk();
  return put(blobPath(name), value, blobWriteOptions(contentType));
}

async function writeBlobJson(name, value) {
  return writeBlobText(name, `${JSON.stringify(value, null, 2)}\n`, "application/json; charset=utf-8");
}

function requirePersistentStorage(error) {
  if (!process.env.VERCEL) return;
  const message = hasBlobStorage()
    ? "Persistent Blob storage failed. The update was not published."
    : "Persistent Blob storage is not configured. Set BLOB_READ_WRITE_TOKEN before using admin updates.";
  const storageError = new Error(message);
  storageError.statusCode = 503;
  storageError.cause = error;
  throw storageError;
}

function storageMode() {
  if (hasBlobStorage()) return "blob";
  if (process.env.VERCEL) return "temporary";
  return "local";
}

module.exports = {
  hasBlobStorage,
  requirePersistentStorage,
  readBlobBuffer,
  readBlobJson,
  storageMode,
  writeBlobBuffer,
  writeBlobJson,
};
