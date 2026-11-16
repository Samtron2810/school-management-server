import User from "../models/User.js";
import escapeRegex from "./escapeRegex.js";

export const MIN_SEARCH_LENGTH = 2;
export const SEARCH_RESULT_LIMIT = 50;

// Case-insensitive "contains" regex, or null when the text is too short to
// be worth searching (the UI waits for 2+ letters).
export const searchRegex = (text) => {
  const clean = String(text ?? "").trim();
  return clean.length >= MIN_SEARCH_LENGTH
    ? new RegExp(escapeRegex(clean), "i")
    : null;
};

// Matches a person (student/teacher/parent/user) by their account fields.
// `role` narrows it to one kind of account.
export const findUserIdsBySearch = async (text, role = null) => {
  const regex = searchRegex(text);
  if (!regex) return null;

  const users = await User.find({
    ...(role ? { role } : {}),
    $or: [
      { firstName: regex },
      { lastName: regex },
      { otherName: regex },
      { username: regex },
      { email: regex },
    ],
  })
    .select("_id")
    .limit(500);

  return users.map((u) => u._id);
};
