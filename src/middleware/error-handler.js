const { AppError } = require("../errors");
const { sendJson } = require("../utils/json");

function handleError(err, req, res) {
  if (res.headersSent) return;
  if (err instanceof AppError) {
    return sendJson(res, err.status, err.toJSON());
  }
  const isProd = process.env.NODE_ENV === "production";
  const body = {
    error: {
      message: isProd ? "internal server error" : err.message || "internal server error",
      code: "internal_error",
      status: 500,
    },
  };
  sendJson(res, 500, body);
}

function wrap(handler) {
  return async function wrapped(req, res, ...rest) {
    try {
      await handler(req, res, ...rest);
    } catch (err) {
      handleError(err, req, res);
    }
  };
}

module.exports = { handleError, wrap };
