const http = require("node:http");
const { router } = require("./routes/index");
const { logger } = require("./middleware/logger");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  logger(req);
  router(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { server };
