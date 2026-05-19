const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { loadBundledBulletin } = require("./lib/bundled-bulletin");
const { loadLatestBulletinFromDrive } = require("./lib/bulletin-loader");

const root = __dirname;
const host = "127.0.0.1";
const port = Number(process.env.PORT || 5173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
};

function send(response, statusCode, headers, body) {
  response.writeHead(statusCode, headers);
  response.end(body);
}

function safePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
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

    if (process.env.GOOGLE_DRIVE_FOLDER_ID && process.env.GOOGLE_DRIVE_API_KEY) {
      try {
        const { bulletin } = await loadLatestBulletinFromDrive();
        send(
          response,
          200,
          { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
          JSON.stringify(bulletin)
        );
      } catch (error) {
        send(
          response,
          error.statusCode || 500,
          { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
          JSON.stringify({
            error: "Could not load the live weekly bulletin.",
            detail: error instanceof Error ? error.message : String(error),
          })
        );
      }
      return;
    }

    send(
      response,
      200,
      { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      JSON.stringify(loadBundledBulletin())
    );
    return;
  }

  const filePath = safePath(request.url || "/");
  if (!filePath) {
    send(response, 403, { "Content-Type": "text/plain; charset=utf-8" }, "Forbidden");
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
