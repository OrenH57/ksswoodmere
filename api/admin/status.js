const { adminApiHandler } = require("../../lib/admin-api");

module.exports = function adminStatusHandler(request, response) {
  return adminApiHandler(request, response, "/api/admin/status");
};
