const { getUsers, createUser } = require("./users");
const { healthCheck } = require("./health");

function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/health" && req.method === "GET") {
    return healthCheck(req, res);
  }

  if (url.pathname === "/api/users" && req.method === "GET") {
    return getUsers(req, res);
  }

  if (url.pathname === "/api/users" && req.method === "POST") {
    return createUser(req, res);
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
}

module.exports = { router };
