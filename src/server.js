const http = require("node:http");

function createServer(router) {
  if (typeof router !== "function") {
    throw new TypeError("router must be a function (req, res)");
  }
  const server = http.createServer((req, res) => {
    router(req, res);
  });
  return server;
}

function listen(server, port, host) {
  return new Promise((resolve) => {
    server.listen(port, host, () => resolve(server));
  });
}

module.exports = { createServer, listen };
