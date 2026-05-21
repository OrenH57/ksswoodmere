const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repoDataDir = path.join(__dirname, "..", "data");

function canWriteDirectory(directory) {
  try {
    fs.mkdirSync(directory, { recursive: true });
    fs.accessSync(directory, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function getRuntimeDataDir() {
  const configuredDir = process.env.KSS_DATA_DIR;
  if (configuredDir && canWriteDirectory(configuredDir)) return configuredDir;
  if (process.env.VERCEL || !canWriteDirectory(repoDataDir)) return path.join(os.tmpdir(), "ksswoodmere-data");
  return repoDataDir;
}

function getBundledDataDir() {
  return repoDataDir;
}

module.exports = {
  getBundledDataDir,
  getRuntimeDataDir,
};
