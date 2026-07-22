import xss from "xss";

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

const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeValue(req.query);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params);
  }

  next();
};

export default sanitizeRequest;
