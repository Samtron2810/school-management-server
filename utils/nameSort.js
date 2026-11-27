// Names everywhere follow "Surname Firstname Othername".
// One place for the display format and the A→Z (surname-first) sort.

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

const part = (value) => String(value ?? "").trim();

// "Obi Ada Grace" from { lastName, firstName, otherName }.
export const formatFullName = (user) =>
  [user?.lastName, user?.firstName, user?.otherName]
    .map(part)
    .filter(Boolean)
    .join(" ");

// Surname → first name → other name, case-insensitive. Rows without a
// populated user sink to the bottom.
export const compareUsersByName = (a, b) => {
  const hasA = a && typeof a === "object";
  const hasB = b && typeof b === "object";
  if (!hasA || !hasB) return hasA === hasB ? 0 : hasA ? -1 : 1;

  return (
    collator.compare(part(a.lastName), part(b.lastName)) ||
    collator.compare(part(a.firstName), part(b.firstName)) ||
    collator.compare(part(a.otherName), part(b.otherName))
  );
};

// Returns a new array sorted by the user that `getUser(row)` points at.
export const sortByName = (rows, getUser = (row) => row) =>
  [...rows].sort((x, y) => compareUsersByName(getUser(x), getUser(y)));

// Common shapes.
export const studentUser = (row) => row?.student?.user;
