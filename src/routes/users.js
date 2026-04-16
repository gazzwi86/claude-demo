const { UserStore } = require("../models/user");

const store = new UserStore();

// Seed some demo data
store.add({ name: "Alice", email: "alice@example.com", role: "admin" });
store.add({ name: "Bob", email: "bob@example.com", role: "user" });

function getUsers(req, res) {
  const users = store.list();
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ users }));
}

function createUser(req, res) {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const data = JSON.parse(body);

      if (!data.name || !data.email) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "name and email are required" }));
      }

      const user = store.add(data);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ user }));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
    }
  });
}

module.exports = { getUsers, createUser };
