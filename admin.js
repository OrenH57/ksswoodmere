const loginPanel = document.querySelector("#admin-login-panel");
const editorPanel = document.querySelector("#admin-editor-panel");
const loginForm = document.querySelector("#admin-login-form");
const contentForm = document.querySelector("#admin-content-form");
const bulletinForm = document.querySelector("#admin-bulletin-form");
const bulletinFile = document.querySelector("#admin-bulletin-file");
const bulletinMeta = document.querySelector("#admin-bulletin-meta");
const statusText = document.querySelector("#admin-status");
const updatedText = document.querySelector("#admin-updated");
const logoutButton = document.querySelector("#admin-logout");

const groups = ["weekday", "fridayNight", "morning", "afternoon"];
let content = null;

function setStatus(message, type = "") {
  if (!statusText) return;
  statusText.textContent = message;
  statusText.dataset.type = type;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
  return data;
}

function formatUploadedMeta(meta) {
  if (!meta) return "No bulletin uploaded yet.";
  const date = meta.modifiedTime
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(meta.modifiedTime))
    : "unknown date";
  const size = meta.size ? `${Math.round(meta.size / 1024)} KB` : "PDF";
  return `${meta.fileName} - uploaded ${date} (${size})`;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    });
    reader.addEventListener("error", () => reject(new Error("Could not read the selected file.")));
    reader.readAsDataURL(file);
  });
}

function itemRow(group, item = {}, index = 0) {
  const wrapper = document.createElement("div");
  wrapper.className = "admin-row";
  wrapper.dataset.group = group;
  wrapper.innerHTML = `
    <label>
      <span>Label</span>
      <input data-field="label" value="${escapeAttribute(item.label || "")}" maxlength="80" required>
    </label>
    <label>
      <span>Time</span>
      <input data-field="time" value="${escapeAttribute(item.time || "")}" placeholder="7:15 PM" pattern="^\\d{1,2}:\\d{2}\\s?(AM|PM|am|pm)$" required>
    </label>
    <button class="admin-remove" type="button" aria-label="Remove row ${index + 1}">Remove</button>
  `;
  wrapper.querySelector(".admin-remove").addEventListener("click", () => wrapper.remove());
  return wrapper;
}

function announcementRow(item = {}, index = 0) {
  const wrapper = document.createElement("div");
  wrapper.className = "admin-row admin-announcement-row";
  wrapper.innerHTML = `
    <label>
      <span>Title</span>
      <input data-field="title" value="${escapeAttribute(item.title || "")}" maxlength="100">
    </label>
    <label>
      <span>Date or Tag</span>
      <input data-field="date" value="${escapeAttribute(item.date || "")}" maxlength="80" placeholder="This Shabbat">
    </label>
    <label class="admin-wide">
      <span>Message</span>
      <textarea data-field="body" maxlength="500" rows="3">${escapeHtml(item.body || "")}</textarea>
    </label>
    <button class="admin-remove" type="button" aria-label="Remove announcement ${index + 1}">Remove</button>
  `;
  wrapper.querySelector(".admin-remove").addEventListener("click", () => wrapper.remove());
  return wrapper;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function groupItems(group) {
  if (group === "weekday") return content?.weekday || [];
  return content?.shabbat?.[group] || [];
}

function renderEditor(data) {
  content = data;
  groups.forEach((group) => {
    const target = document.querySelector(`#admin-${group}`);
    if (!target) return;

    target.innerHTML = "";
    groupItems(group).forEach((item, index) => target.append(itemRow(group, item, index)));

    const addButton = document.createElement("button");
    addButton.className = "button secondary admin-add";
    addButton.type = "button";
    addButton.textContent = "Add Time";
    addButton.addEventListener("click", () => target.insertBefore(itemRow(group), addButton));
    target.append(addButton);
  });

  const announcementsTarget = document.querySelector("#admin-announcements");
  if (announcementsTarget) {
    announcementsTarget.innerHTML = "";
    (data.announcements || []).forEach((item, index) => announcementsTarget.append(announcementRow(item, index)));
  }

  if (updatedText) {
    updatedText.textContent = data.updatedAt
      ? `Last saved ${new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(data.updatedAt))}`
      : "No saved updates yet.";
  }
}

async function loadBulletinMeta() {
  const data = await apiRequest("/api/admin/bulletin");
  if (bulletinMeta) bulletinMeta.textContent = formatUploadedMeta(data.uploaded);
}

function collectSchedule(group) {
  return [...document.querySelectorAll(`.admin-row[data-group="${group}"]`)]
    .map((row) => ({
      label: row.querySelector('[data-field="label"]')?.value.trim() || "",
      time: row.querySelector('[data-field="time"]')?.value.trim() || "",
    }))
    .filter((item) => item.label && item.time);
}

function collectAnnouncements() {
  return [...document.querySelectorAll(".admin-announcement-row")]
    .map((row) => ({
      title: row.querySelector('[data-field="title"]')?.value.trim() || "",
      date: row.querySelector('[data-field="date"]')?.value.trim() || "",
      body: row.querySelector('[data-field="body"]')?.value.trim() || "",
    }))
    .filter((item) => item.title || item.body);
}

function collectContent() {
  return {
    weekday: collectSchedule("weekday"),
    shabbat: {
      fridayNight: collectSchedule("fridayNight"),
      morning: collectSchedule("morning"),
      afternoon: collectSchedule("afternoon"),
    },
    announcements: collectAnnouncements(),
  };
}

async function loadEditor() {
  const data = await apiRequest("/api/admin/content");
  renderEditor(data);
  await loadBulletinMeta();
  loginPanel.hidden = true;
  editorPanel.hidden = false;
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Signing in...");
  const password = new FormData(loginForm).get("password");

  try {
    await apiRequest("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    loginForm.reset();
    await loadEditor();
    setStatus("Signed in.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

contentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!contentForm.reportValidity()) return;
  setStatus("Saving updates...");

  try {
    const saved = await apiRequest("/api/admin/content", {
      method: "PUT",
      body: JSON.stringify(collectContent()),
    });
    renderEditor(saved);
    localStorage.removeItem("kss-cache:/api/updates");
    localStorage.removeItem("kss-cache:/api/bulletin");
    setStatus("Updates saved and ready on the public site.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

bulletinForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = bulletinFile?.files?.[0];
  if (!file) return;
  if (file.type && file.type !== "application/pdf") {
    setStatus("Please choose a PDF bulletin.", "error");
    return;
  }

  setStatus("Uploading and parsing bulletin...");

  try {
    const uploaded = await apiRequest("/api/admin/bulletin", {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        base64: await readFileAsBase64(file),
      }),
    });
    if (bulletinMeta) bulletinMeta.textContent = formatUploadedMeta(uploaded.uploaded);
    bulletinForm.reset();
    localStorage.removeItem("kss-cache:/api/bulletin");
    setStatus("Bulletin uploaded. Times were parsed and are ready on the public site.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

logoutButton?.addEventListener("click", async () => {
  await apiRequest("/api/admin/logout", { method: "POST" }).catch(() => {});
  editorPanel.hidden = true;
  loginPanel.hidden = false;
  setStatus("Signed out.", "success");
});

document.querySelector("[data-add-announcement]")?.addEventListener("click", () => {
  document.querySelector("#admin-announcements")?.append(announcementRow());
});

async function initializeAdmin() {
  try {
    const status = await apiRequest("/api/admin/status");

    if (status.authenticated) {
      await loadEditor();
      setStatus("Session restored.", "success");
    }
  } catch (error) {
    setStatus(error.message, "error");
  }
}

initializeAdmin();
