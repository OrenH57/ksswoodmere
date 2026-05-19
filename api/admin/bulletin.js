const { adminApiHandler } = require("../../lib/admin-api");

module.exports = function adminBulletinHandler(request, response) {
  return adminApiHandler(request, response, "/api/admin/bulletin");
};
