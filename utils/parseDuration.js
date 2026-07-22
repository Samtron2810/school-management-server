const parseDuration = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value * 1000;
  }

  const input = String(value).trim();

  if (/^\d+$/.test(input)) {
    return Number(input) * 1000;
  }

  const match = input.match(/^(\d+)(ms|s|m|h|d|w)$/i);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

export default parseDuration;
