const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { loadPreferredBulletin } = require("./lib/bulletin-loader");
const { adminApiHandler } = require("./lib/admin-api");

const root = __dirname;
const host = "127.0.0.1";
const port = Number(process.env.PORT || 5173);

function loadLocalEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) return;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] == null) process.env[key] = value;
    });
}

loadLocalEnv();

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
};

const publicFiles = new Set(["/admin.html", "/admin.js", "/index.html", "/script.js", "/styles.css"]);

function send(response, statusCode, headers, body) {
  response.writeHead(statusCode, headers);
  response.end(body);
}

function redirectHome(response) {
  send(response, 302, { Location: "/", "Content-Type": "text/plain; charset=utf-8" }, "Redirecting");
}

function safePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const normalizedPath = requestedPath.replace(/\\/g, "/");

  if (normalizedPath.split("/").some((part) => part.startsWith("."))) return null;
  if (!publicFiles.has(normalizedPath) && !normalizedPath.startsWith("/assets/")) return null;

  const resolved = path.resolve(root, `.${requestedPath}`);
  return resolved.startsWith(root) ? resolved : null;
}

const server = http.createServer(async (request, response) => {
  const urlPath = (request.url || "/").split("?")[0];

  if (urlPath === "/api/bulletin") {
    if (request.method !== "GET") {
      send(response, 405, { "Content-Type": "application/json; charset=utf-8", Allow: "GET" }, JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    try {
      const { bulletin } = await loadPreferredBulletin();
      send(
        response,
        200,
        { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
        JSON.stringify(bulletin)
      );
      return;
    } catch (error) {
      send(
        response,
        error.statusCode || 500,
        { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
        JSON.stringify({
          error: "Could not load the uploaded weekly bulletin.",
          detail: error instanceof Error ? error.message : String(error),
        })
      );
      return;
    }
  }

  if (urlPath === "/api/updates" || urlPath.startsWith("/api/admin/")) {
    await adminApiHandler(request, response, urlPath);
    return;
  }

  const filePath = safePath(request.url || "/");
  if (!filePath) {
    redirectHome(response);
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(response, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
      return;
    }

    send(response, 200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" }, content);
  });
});

server.listen(port, host, () => {
  // Keep background preview quiet; callers can verify with http://127.0.0.1:5173/.
});
