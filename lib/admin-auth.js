const crypto = require("node:crypto");

const loginAttempts = new Map();
const sessionTtlMs = 8 * 60 * 60 * 1000;
const maxLoginAttempts = 8;
const loginWindowMs = 15 * 60 * 1000;

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

function parseCookies(header = "") {
  return Object.fromEntries(
    String(header)
      .split(";")
      .map((part) => part.trim().split("="))
      .filter((parts) => parts.length === 2 && parts[0])
      .map(([key, value]) => [key, decodeURIComponent(value)])
  );
}

function cookieHeader(name, value, request) {
  const secure = request.headers["x-forwarded-proto"] === "https";
  return `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(
    sessionTtlMs / 1000
  )}${secure ? "; Secure" : ""}`;
}

function clearCookieHeader(name) {
  return `${name}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(value) {
  return crypto.createHmac("sha256", getAdminPassword()).update(value).digest("base64url");
}

function createSignedToken() {
  const payload = JSON.stringify({
    nonce: crypto.randomBytes(16).toString("base64url"),
    exp: Date.now() + sessionTtlMs,
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function verifySignedToken(token) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature || !getAdminPassword()) return false;
  if (!safeEqual(signature, sign(encodedPayload))) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    return Number(payload.exp) > Date.now();
  } catch {
    return false;
  }
}

function clientKey(request) {
  return String(request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "local").split(",")[0].trim();
}

function tooManyAttempts(request) {
  const key = clientKey(request);
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, startedAt: now };

  if (now - record.startedAt > loginWindowMs) {
    loginAttempts.set(key, { count: 0, startedAt: now });
    return false;
  }

  return record.count >= maxLoginAttempts;
}

function recordFailedAttempt(request) {
  const key = clientKey(request);
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, startedAt: now };
  loginAttempts.set(key, { count: record.count + 1, startedAt: record.startedAt });
}

function createSession(response, request) {
  response.setHeader("Set-Cookie", cookieHeader("kss_admin_session", createSignedToken(), request));
}

function destroySession(request, response) {
  response.setHeader("Set-Cookie", clearCookieHeader("kss_admin_session"));
}

function isAuthenticated(request) {
  const token = parseCookies(request.headers.cookie).kss_admin_session;
  return verifySignedToken(token);
}

function validatePassword(password) {
  const adminPassword = getAdminPassword();
  return Boolean(adminPassword) && safeEqual(password, adminPassword);
}

module.exports = {
  createSession,
  destroySession,
  getAdminPassword,
  isAuthenticated,
  recordFailedAttempt,
  tooManyAttempts,
  validatePassword,
};
