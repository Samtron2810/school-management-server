import xss from "xss";
import mongoSanitize from "express-mongo-sanitize";

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

// Strips Mongo/NoSQL-operator keys (`$gt`, `$where`, dotted paths, etc.)
// before the value ever reaches a query, then runs the XSS pass above.
const sanitizeAgainstInjection = (value) => {
  if (!value || typeof value !== "object") {
    return value;
  }

  return mongoSanitize.sanitize(sanitizeValue(value));
};

// req.body/req.params are plain, writable objects on both Express 4 and 5,
// so mutating them in place is safe and preserves the reference other
// middleware may have captured.
const sanitizeInPlace = (obj) => {
  if (!obj || typeof obj !== "object") return;

  const sanitized = sanitizeAgainstInjection(obj);

  Object.keys(obj).forEach((key) => delete obj[key]);
  Object.assign(obj, sanitized);
};

const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeAgainstInjection(req.body);
  }

  // IMPORTANT: in Express 5, `req.query` is a getter with no setter — it is
  // re-parsed from `req.url` on every access, so mutating the object
  // in place (as with body/params) silently has no effect and the
  // "sanitized" value is discarded. Redefine the property instead so the
  // sanitized object is what every downstream handler actually reads.
  if (req.query && typeof req.query === "object") {
    Object.defineProperty(req, "query", {
      value: sanitizeAgainstInjection(req.query),
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  sanitizeInPlace(req.params);

  next();
};

export default sanitizeRequest;
