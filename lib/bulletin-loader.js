const { loadBundledBulletin } = require("./bundled-bulletin");
const { hasUploadedBulletin, loadUploadedBulletin } = require("./uploaded-bulletin");

async function loadPreferredBulletin() {
  if (hasUploadedBulletin()) {
    return loadUploadedBulletin();
  }

  const bulletin = loadBundledBulletin();
  return {
    bulletin: {
      ...bulletin,
      source: {
        ...bulletin.source,
        sourceType: "bundled",
      },
    },
    text: "",
  };
}

module.exports = {
  loadPreferredBulletin,
};
