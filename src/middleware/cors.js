const { config } = require("../config");

function applyCors(req, res, options = {}) {
  const origin = options.origin || config.cors.origin;
  const methods = options.methods || config.cors.methods;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

module.exports = { applyCors };
