const { readAdminContent, writeAdminContent } = require("./admin-content");
const { readUploadedBulletinMeta, saveUploadedBulletin } = require("./uploaded-bulletin");
const {
  createSession,
  destroySession,
  getAdminPassword,
  isAuthenticated,
  recordFailedAttempt,
  tooManyAttempts,
  validatePassword,
} = require("./admin-auth");

const maxBodyBytes = 12 * 1024 * 1024;

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBodyBytes) {
        reject(Object.assign(new Error("Request body is too large."), { statusCode: 413 }));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error("Invalid JSON."), { statusCode: 400 }));
      }
    });

    request.on("error", reject);
  });
}

async function adminApiHandler(request, response, routePath) {
  const method = request.method || "GET";
  const urlPath = routePath || (request.url || "").split("?")[0];

  if (urlPath === "/api/updates" && method === "GET") {
    sendJson(response, 200, await readAdminContent());
    return;
  }

  if (urlPath === "/api/admin/status" && method === "GET") {
    sendJson(response, 200, {
      configured: Boolean(getAdminPassword()),
      authenticated: isAuthenticated(request),
    });
    return;
  }

  if (urlPath === "/api/admin/login" && method === "POST") {
    if (!getAdminPassword()) {
      sendJson(response, 503, { error: "Admin password is not configured. Set ADMIN_PASSWORD before using admin." });
      return;
    }

    if (tooManyAttempts(request)) {
      sendJson(response, 429, { error: "Too many login attempts. Try again later." });
      return;
    }

    try {
      const body = await readJsonBody(request);
      if (!validatePassword(String(body.password || ""))) {
        recordFailedAttempt(request);
        sendJson(response, 401, { error: "Invalid password." });
        return;
      }

      createSession(response, request);
      sendJson(response, 200, { ok: true });
    } catch (error) {
      sendJson(response, error.statusCode || 500, { error: error.message || "Login failed." });
    }
    return;
  }

  if (urlPath === "/api/admin/logout" && method === "POST") {
    destroySession(request, response);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath === "/api/admin/content" && method === "GET") {
    if (!isAuthenticated(request)) {
      sendJson(response, 401, { error: "Authentication required." });
      return;
    }

    sendJson(response, 200, await readAdminContent());
    return;
  }

  if (urlPath === "/api/admin/content" && method === "PUT") {
    if (!isAuthenticated(request)) {
      sendJson(response, 401, { error: "Authentication required." });
      return;
    }

    try {
      const body = await readJsonBody(request);
      sendJson(response, 200, await writeAdminContent(body, "board"));
    } catch (error) {
      sendJson(response, error.statusCode || 500, { error: error.message || "Could not save updates." });
    }
    return;
  }

  if (urlPath === "/api/admin/bulletin" && method === "GET") {
    if (!isAuthenticated(request)) {
      sendJson(response, 401, { error: "Authentication required." });
      return;
    }

    sendJson(response, 200, { uploaded: await readUploadedBulletinMeta() });
    return;
  }

  if (urlPath === "/api/admin/bulletin" && method === "POST") {
    if (!isAuthenticated(request)) {
      sendJson(response, 401, { error: "Authentication required." });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const result = await saveUploadedBulletin({
        fileName: body.fileName,
        base64: body.base64,
      });
      sendJson(response, 200, {
        ok: true,
        uploaded: result.meta,
        bulletin: result.bulletin,
      });
    } catch (error) {
      sendJson(response, error.statusCode || 500, { error: error.message || "Could not upload bulletin." });
    }
    return;
  }

  sendJson(response, 404, { error: "Not found." });
}

module.exports = {
  adminApiHandler,
};
