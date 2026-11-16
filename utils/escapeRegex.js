// Makes user text safe to use inside a RegExp (so "a.b" or "(" can't break
// or widen a search).
const escapeRegex = (value) =>
  String(value ?? "")
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default escapeRegex;
