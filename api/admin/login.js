const { adminApiHandler } = require("../../lib/admin-api");

module.exports = function adminLoginHandler(request, response) {
  return adminApiHandler(request, response, "/api/admin/login");
};
