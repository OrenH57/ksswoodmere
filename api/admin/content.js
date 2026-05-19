const { adminApiHandler } = require("../../lib/admin-api");

module.exports = function adminContentHandler(request, response) {
  return adminApiHandler(request, response, "/api/admin/content");
};
