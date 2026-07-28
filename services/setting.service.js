import SchoolSetting from "../models/SchoolSetting.js";
import ApiError from "../utils/ApiError.js";

// Returns the singleton settings document, creating it on first use.
const getSettings = async () => {
  let settings = await SchoolSetting.findOne();

  if (!settings) {
    settings = await SchoolSetting.create({});
  }

  return settings;
};

const updateSettings = async (data) => {
  const settings = await getSettings();

  if (data.schoolName !== undefined) settings.schoolName = data.schoolName;
  if (data.address !== undefined) settings.address = data.address;
  if (data.email !== undefined) settings.email = data.email;
  if (data.phoneNumber !== undefined) settings.phoneNumber = data.phoneNumber;
  if (data.logoUrl !== undefined) settings.logo.url = data.logoUrl;

  if (Array.isArray(data.gradeBands) && data.gradeBands.length > 0) {
    settings.gradeBands = data.gradeBands.map((band) => ({
      grade: String(band.grade).toUpperCase(),
      minScore: Number(band.minScore),
      gradePoint: Number(band.gradePoint ?? 0),
      remark: band.remark ?? "",
    }));
  }

  // Global mark-entry columns (CA 1, CA 2, Test, Exam, etc). Shared by
  // every class and subject school-wide — see models/SchoolSetting.js.
  if (Array.isArray(data.scoreComponents) && data.scoreComponents.length > 0) {
    const seenKeys = new Set();
    for (const component of data.scoreComponents) {
      if (!component.key || !component.label) {
        throw new ApiError(400, "Each score component needs a key and label.");
      }
      const key = String(component.key).trim().toLowerCase();
      if (seenKeys.has(key)) {
        throw new ApiError(400, `Duplicate score component key: ${key}`);
      }
      seenKeys.add(key);
      if (component.maxMarks === undefined || Number(component.maxMarks) < 0) {
        throw new ApiError(400, `Invalid max marks for "${component.label}".`);
      }
    }

    settings.scoreComponents = data.scoreComponents.map((component) => ({
      key: String(component.key).trim().toLowerCase(),
      label: String(component.label).trim(),
      maxMarks: Number(component.maxMarks),
      isActive: component.isActive !== false,
    }));
  }

  if (data.passingScore !== undefined) {
    settings.passingScore = Number(data.passingScore);
  }

  // Only prefix/padding are configurable — the counter is server-owned.
  for (const kind of ["teacher", "student", "parent"]) {
    const incoming = data.idFormats?.[kind];
    if (!incoming) continue;
    if (incoming.prefix !== undefined) {
      settings.idFormats[kind].prefix = String(incoming.prefix)
        .toUpperCase()
        .trim();
    }
    if (incoming.padding !== undefined) {
      settings.idFormats[kind].padding = Number(incoming.padding);
    }
  }

  await settings.save();

  return settings;
};

// Atomically issues the next ID for a kind ("teacher" | "student" | "parent"),
// e.g. "TCH-0001". Safe under concurrency (single $inc on the singleton).
const generateId = async (kind) => {
  const settings = await getSettings();

  const updated = await SchoolSetting.findByIdAndUpdate(
    settings._id,
    { $inc: { [`idFormats.${kind}.counter`]: 1 } },
    { new: true },
  );

  const format = updated.idFormats[kind];
  const number = String(format.counter).padStart(format.padding, "0");

  return `${format.prefix}${number}`;
};

export default {
  getSettings,
  updateSettings,
  generateId,
};
