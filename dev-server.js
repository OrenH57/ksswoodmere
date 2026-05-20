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

const cleanPageRoutes = new Map([
  ["/admin", "/admin.html"],
  ["/staff", "/admin.html"],
  ["/give", "/give.html"],
  ["/support-us", "/give.html"],
  ["/resources", "/resources.html"],
  ["/community-info", "/resources.html"],
  ["/schedule", "/schedule.html"],
  ["/minyanim", "/schedule.html"],
]);
const legacyPageRoutes = new Map([
  ["/index.html", "/"],
  ["/admin.html", "/staff"],
  ["/give.html", "/support-us"],
  ["/resources.html", "/community-info"],
  ["/schedule.html", "/minyanim"],
  ["/give", "/support-us"],
  ["/resources", "/community-info"],
  ["/schedule", "/minyanim"],
]);
const publicFiles = new Set([
  "/admin",
  "/staff",
  "/give",
  "/support-us",
  "/resources",
  "/community-info",
  "/schedule",
  "/minyanim",
  "/admin.js",
  "/index.html",
  "/script.js",
  "/styles.css",
]);
const sourceRedirectPrefixes = [
  "/.git",
  "/data",
  "/lib",
  "/node_modules",
  "/source",
  "/page-source",
  "/tests",
  "/view-source",
];

function send(response, statusCode, headers, body) {
  response.writeHead(statusCode, headers);
  response.end(body);
}

function redirectHome(response) {
  send(response, 302, { Location: "/", "Content-Type": "text/plain; charset=utf-8" }, "Redirecting");
}

function safePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const requestedPath = decodedPath === "/" ? "/index.html" : cleanPageRoutes.get(decodedPath) || decodedPath;
  const normalizedPath = requestedPath.replace(/\\/g, "/");
  const publicPath = decodedPath === "/" ? "/index.html" : decodedPath;

  if (normalizedPath.split("/").some((part) => part.startsWith("."))) return null;
  if (!publicFiles.has(publicPath) && !normalizedPath.startsWith("/assets/")) return null;

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

  if (sourceRedirectPrefixes.some((prefix) => urlPath === prefix || urlPath.startsWith(`${prefix}/`))) {
    redirectHome(response);
    return;
  }

  if (legacyPageRoutes.has(urlPath)) {
    send(response, 301, { Location: legacyPageRoutes.get(urlPath), "Content-Type": "text/plain; charset=utf-8" }, "Moved");
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
