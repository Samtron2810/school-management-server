const errorHandler = (err, req, res, next) => {
  // A streamed response (e.g. a zip download) may already be partly sent.
  // Headers can't be rewritten then, so hand over to Express, which closes
  // the connection instead of throwing "headers already sent".
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
