import SchoolSetting from "../models/SchoolSetting.js";
import ApiError from "../utils/ApiError.js";
import { cacheGet, cacheSet, cacheDel } from "../config/redis.js";

const CACHE_KEY = "school:settings";
const CACHE_TTL = 300; // 5 minutes

const getSettings = async () => {
  const cached = await cacheGet(CACHE_KEY);
  if (cached) return cached;

  let settings = await SchoolSetting.findOne();
  if (!settings) settings = await SchoolSetting.create({});

  await cacheSet(CACHE_KEY, settings.toObject(), CACHE_TTL);

  return settings;
};

const updateSettings = async (data) => {
  // Always fetch live doc for mutation
  let settings = await SchoolSetting.findOne();
  if (!settings) settings = await SchoolSetting.create({});

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

  // Bust cache so next read is fresh
  await cacheDel(CACHE_KEY);

  return settings;
};

const generateId = async (kind) => {
  const settings = await getSettings();

  const updated = await SchoolSetting.findByIdAndUpdate(
    settings._id,
    { $inc: { [`idFormats.${kind}.counter`]: 1 } },
    { new: true },
  );

  // Bust cache since counter changed
  await cacheDel(CACHE_KEY);

  const format = updated.idFormats[kind];
  const number = String(format.counter).padStart(format.padding, "0");

  return `${format.prefix}${number}`;
};

export default {
  getSettings,
  updateSettings,
  generateId,
};
