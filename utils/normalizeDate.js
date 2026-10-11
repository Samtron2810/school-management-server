import ApiError from "./ApiError.js";

// Collapse any date input to 00:00:00.000 UTC of its calendar day so
// "2023-10-10T08:00:00Z" and "2023-10-10T11:00:00Z" become the same value.
export const startOfDayUTC = (input) => {
  const value =
    typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)
      ? input.slice(0, 10)
      : input;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "Invalid date.");
  }

  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
    ),
  );
};

export const dayRangeUTC = (input) => {
  const start = startOfDayUTC(input);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};
