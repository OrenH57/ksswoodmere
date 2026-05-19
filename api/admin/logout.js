const { adminApiHandler } = require("../../lib/admin-api");

module.exports = function adminLogoutHandler(request, response) {
  return adminApiHandler(request, response, "/api/admin/logout");
};
