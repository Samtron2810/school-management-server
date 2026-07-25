import xss from "xss";
import mongoSanitize from "express-mongo-sanitize";

// NOTE: we intentionally use mongoSanitize.sanitize() (mutates in place) and
// NOT mongoSanitize() as app-level middleware. The middleware form does
// `req.query = target`, and Express 5 makes req.query a getter-only
// property — that reassignment throws on every request with a query string.
// Calling sanitize() ourselves on each object avoids ever reassigning req.query.
const stripMongoOperators = (obj) => {
  if (!obj || typeof obj !== "object") return;
  mongoSanitize.sanitize(obj);
};

const shouldSkipKey = (keyPath = "") => {
  return /(password|token|secret)$/i.test(keyPath);
};

const sanitizeValue = (value, keyPath = "") => {
  if (typeof value === "string") {
    if (shouldSkipKey(keyPath)) {
      return value;
    }

    return xss(value, {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ["script", "style"],
    });
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizeValue(item, `${keyPath}[${index}]`),
    );
  }

  if (value && typeof value === "object") {
    return Object.keys(value).reduce((accumulator, key) => {
      const nextKeyPath = keyPath ? `${keyPath}.${key}` : key;
      accumulator[key] = sanitizeValue(value[key], nextKeyPath);
      return accumulator;
    }, {});
  }

  return value;
};

const sanitizeObjectInPlace = (obj) => {
  if (!obj || typeof obj !== "object") return;
  const sanitized = sanitizeValue(obj);
  // Clear existing keys
  Object.keys(obj).forEach((key) => delete obj[key]);
  // Copy sanitized values back in-place
  Object.assign(obj, sanitized);
};

const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    stripMongoOperators(req.body);
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === "object") {
    stripMongoOperators(req.query);
    sanitizeObjectInPlace(req.query);
  }

  if (req.params && typeof req.params === "object") {
    stripMongoOperators(req.params);
    sanitizeObjectInPlace(req.params);
  }

  next();
};

export default sanitizeRequest;
