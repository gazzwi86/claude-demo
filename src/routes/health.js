function healthCheck(req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
}

module.exports = { healthCheck };
