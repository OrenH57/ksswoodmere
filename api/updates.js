const { adminApiHandler } = require("../lib/admin-api");

module.exports = function updatesHandler(request, response) {
  return adminApiHandler(request, response, "/api/updates");
};
