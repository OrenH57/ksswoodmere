const blobPrefix = process.env.KSS_BLOB_PREFIX || "ksswoodmere";

function blobPath(name) {
  return `${blobPrefix}/${name}`;
}

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function getBlobSdk() {
  return import("@vercel/blob");
}

async function findBlob(pathname) {
  if (!hasBlobStorage()) return null;
  const { list } = await getBlobSdk();
  const result = await list({ prefix: pathname, limit: 20 });
  return result.blobs.find((blob) => blob.pathname === pathname) || null;
}

async function readBlobText(name) {
  const blob = await findBlob(blobPath(name));
  if (!blob?.url) return null;

  const response = await fetch(blob.url);
  if (!response.ok) return null;
  return response.text();
}

async function readBlobJson(name) {
  const text = await readBlobText(name);
  if (!text) return null;
  return JSON.parse(text);
}

async function writeBlobText(name, value, contentType = "text/plain; charset=utf-8") {
  if (!hasBlobStorage()) return null;
  const { put } = await getBlobSdk();
  return put(blobPath(name), value, {
    access: "public",
    addRandomSuffix: false,
    contentType,
  });
}

async function writeBlobJson(name, value) {
  return writeBlobText(name, `${JSON.stringify(value, null, 2)}\n`, "application/json; charset=utf-8");
}

async function readBlobBuffer(name) {
  const blob = await findBlob(blobPath(name));
  if (!blob?.url) return null;

  const response = await fetch(blob.url);
  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
}

async function writeBlobBuffer(name, value, contentType = "application/octet-stream") {
  if (!hasBlobStorage()) return null;
  const { put } = await getBlobSdk();
  return put(blobPath(name), value, {
    access: "public",
    addRandomSuffix: false,
    contentType,
  });
}

module.exports = {
  hasBlobStorage,
  readBlobBuffer,
  readBlobJson,
  writeBlobBuffer,
  writeBlobJson,
};
