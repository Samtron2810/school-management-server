import crypto from "node:crypto";
import User from "../models/User.js";
import Student from "../models/Student.js";
import SchoolClass from "../models/SchoolClass.js";
import Enrollment from "../models/Enrollment.js";

import ApiError from "../utils/ApiError.js";
import withTransaction from "../utils/withTransaction.js";
import settingService from "./setting.service.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";
import { bustDashboardCache as bustDashboard } from "./dashboard.service.js";

const createStudent = async (data) => {
  const email = data.email?.trim().toLowerCase();
  const username = data.username?.trim().toLowerCase();

  if (!email || !username) {
    throw new ApiError(400, "Email and username are required.");
  }

  // Auto-generate the admission number when not supplied.
  const admissionNumber = data.admissionNumber?.trim()
    ? data.admissionNumber.toUpperCase()
    : await settingService.generateId("student");

  return await withTransaction(async (session) => {
    const existingUser = await User.findOne({
      $or: [
        { email },
        { username },
      ],
    }).session(session);

    if (existingUser) {
      throw new ApiError(400, "Email or username already exists.");
    }

    const existingStudent = await Student.findOne({ admissionNumber }).session(
      session,
    );

    if (existingStudent) {
      throw new ApiError(400, "Admission number already exists.");
    }

    const [user] = await User.create(
      [
        {
          firstName: data.firstName,
          lastName: data.lastName,
          otherName: data.otherName,
          username,
          email,
          password: data.password,
          phoneNumber: data.phoneNumber,
          role: "student",
        },
      ],
      { session },
    );

    const [student] = await Student.create(
      [
        {
          user: user._id,
          admissionNumber,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          admissionDate: data.admissionDate,
          address: data.address,
          bloodGroup: data.bloodGroup,
          genotype: data.genotype,
          nationality: data.nationality,
          stateOfOrigin: data.stateOfOrigin,
          localGovernment: data.localGovernment,
          religion: data.religion,
        },
      ],
      { session },
    );

    await bustDashboard();
    return student;
  });
};

const getStudents = async () => {
  return await Student.find()
    .populate("user", "-password -refreshToken -__v")
    .sort({ createdAt: -1 });
};

const getStudent = async (studentId) => {
  const student = await Student.findById(studentId).populate(
    "user",
    "-password -refreshToken -__v",
  );

  if (!student) {
    throw new ApiError(404, "Student not found.");
  }

  return student;
};

// Update a student's bio-data AND their linked user account in one
// transaction, with uniqueness checks on admissionNumber/email/username.
const updateStudent = async (studentDocId, data) => {
  return await withTransaction(async (session) => {
    const student = await Student.findById(studentDocId).session(session);

    if (!student) {
      throw new ApiError(404, "Student not found.");
    }

    const user = await User.findById(student.user).session(session);

    if (!user) {
      throw new ApiError(404, "Linked user account not found.");
    }

    if (
      data.admissionNumber &&
      data.admissionNumber.toUpperCase() !== student.admissionNumber
    ) {
      const conflict = await Student.findOne({
        admissionNumber: data.admissionNumber.toUpperCase(),
      }).session(session);

      if (conflict) {
        throw new ApiError(400, "Admission number already exists.");
      }

      student.admissionNumber = data.admissionNumber.toUpperCase();
    }

    const nextEmail = data.email ? data.email.toLowerCase() : user.email;
    const nextUsername = data.username
      ? data.username.toLowerCase()
      : user.username;

    if (nextEmail !== user.email || nextUsername !== user.username) {
      const conflict = await User.findOne({
        _id: { $ne: user._id },
        $or: [{ email: nextEmail }, { username: nextUsername }],
      }).session(session);

      if (conflict) {
        throw new ApiError(400, "Email or username already exists.");
      }

      user.email = nextEmail;
      user.username = nextUsername;
    }

    for (const field of ["firstName", "lastName", "otherName"]) {
      if (data[field] !== undefined) user[field] = data[field];
    }

    if (data.phoneNumber !== undefined) {
      user.phoneNumber = data.phoneNumber;
    }

    for (const field of [
      "gender",
      "dateOfBirth",
      "admissionDate",
      "address",
      "bloodGroup",
      "genotype",
      "nationality",
      "stateOfOrigin",
      "localGovernment",
      "religion",
      "isActive",
    ]) {
      if (data[field] !== undefined) student[field] = data[field];
    }

    await user.save({ session });
    await student.save({ session });

    const updated = await Student.findById(student._id)
      .populate("user", "-password -refreshToken -__v")
      .session(session);
    await bustDashboard();
    return updated;
  });
};


/*
|--------------------------------------------------------------------------
| Bulk create
|--------------------------------------------------------------------------
*/

// Creating a student hashes a password (bcrypt, cost 12), which is slow and
// CPU-bound, so real runs are small; dry runs only validate and can be big.
export const BULK_CREATE_MAX = 25;
export const BULK_DRY_RUN_MAX = 300;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// No look-alike characters (0/O, 1/l/I) so printed logins are readable.
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generatePassword = (length = 8) =>
  Array.from(
    { length },
    () => PASSWORD_ALPHABET[crypto.randomInt(PASSWORD_ALPHABET.length)],
  ).join("");

const text = (value) =>
  value === undefined || value === null ? "" : String(value).trim();

// "JSS 1 A", "jss1a" and "JSS-1A" all match the same class.
const classKey = (value) => text(value).toLowerCase().replace(/[^a-z0-9]/g, "");

const parseGender = (value) => {
  const g = text(value).toLowerCase();
  if (["m", "male", "boy"].includes(g)) return "Male";
  if (["f", "female", "girl"].includes(g)) return "Female";
  return null;
};

const parseDate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizeBulkRow = (raw, classByKey) => {
  const errors = [];
  const row = {
    firstName: text(raw.firstName),
    lastName: text(raw.lastName),
    otherName: text(raw.otherName),
    gender: parseGender(raw.gender),
    admissionNumber: text(raw.admissionNumber).toUpperCase(),
    username: text(raw.username).toLowerCase(),
    email: text(raw.email).toLowerCase(),
    password: text(raw.password),
    phoneNumber: text(raw.phoneNumber),
    address: text(raw.address),
    className: text(raw.class),
    classId: null,
  };

  if (!row.firstName) errors.push("First name is required");
  if (!row.lastName) errors.push("Last name is required");
  if (!row.gender) errors.push("Gender must be Male or Female");

  const dob = parseDate(raw.dateOfBirth);
  const now = new Date();
  if (!dob) errors.push("Date of birth is required or invalid");
  else if (dob > now || dob.getFullYear() < 1950)
    errors.push("Date of birth looks wrong");
  row.dateOfBirth = dob || null;

  const admitted = parseDate(raw.admissionDate);
  if (admitted === undefined) errors.push("Admission date is invalid");
  row.admissionDate = admitted || now;

  if (row.username && (row.username.length < 3 || row.username.length > 30))
    errors.push("Username must be 3-30 characters");
  if (row.email && !EMAIL_RE.test(row.email)) errors.push("Email is invalid");
  if (row.password && row.password.length < 8)
    errors.push("Password must be at least 8 characters");

  if (row.className) {
    const found = classByKey.get(classKey(row.className));
    if (!found) errors.push(`Class "${row.className}" not found`);
    else row.classId = found._id;
  }

  return { row, errors };
};

// POST /students/bulk
// body: { students: [{ firstName, lastName, gender, dateOfBirth, ...optional }],
//         dryRun?: boolean }
// Optional per row: otherName, class (name, enrolls into the current
// session/term), admissionNumber, username, email, password, phoneNumber,
// address, admissionDate. Anything left blank is generated: admission number
// from School Settings, username from the admission number, a placeholder
// email, and a random password (returned ONCE in the response).
// A bad row never blocks the others; each row succeeds or fails by itself.
const bulkCreateStudents = async (data) => {
  const input = Array.isArray(data.students) ? data.students : [];
  const dryRun = data.dryRun === true;
  const limit = dryRun ? BULK_DRY_RUN_MAX : BULK_CREATE_MAX;

  if (input.length === 0) {
    throw new ApiError(400, "At least one student is required.");
  }
  if (input.length > limit) {
    throw new ApiError(400, `Send at most ${limit} students per request.`);
  }

  const classes = (await SchoolClass.find()).filter((c) => c.isActive !== false);
  const classByKey = new Map(classes.map((c) => [classKey(c.fullName), c]));

  const parsed = input.map((raw) => normalizeBulkRow(raw || {}, classByKey));

  // Duplicates among the values the admin supplied: inside this batch...
  const seen = { username: new Map(), email: new Map(), admissionNumber: new Map() };
  parsed.forEach(({ row, errors }, index) => {
    for (const field of ["username", "email", "admissionNumber"]) {
      if (!row[field]) continue;
      if (seen[field].has(row[field])) {
        errors.push(`Duplicate ${field} "${row[field]}" (also on row ${seen[field].get(row[field]) + 1})`);
      } else {
        seen[field].set(row[field], index);
      }
    }
  });

  // ...and against what's already in the database (one query each).
  const supplied = (field) => [...seen[field].keys()];
  const [users, students] = await Promise.all([
    User.find({
      $or: [
        { username: { $in: supplied("username") } },
        { email: { $in: supplied("email") } },
      ],
    }).select("username email"),
    Student.find({ admissionNumber: { $in: supplied("admissionNumber") } }).select(
      "admissionNumber",
    ),
  ]);
  const takenUsernames = new Set(users.map((u) => u.username));
  const takenEmails = new Set(users.map((u) => u.email));
  const takenAdmission = new Set(students.map((s) => s.admissionNumber));

  parsed.forEach(({ row, errors }) => {
    if (row.username && takenUsernames.has(row.username))
      errors.push(`Username "${row.username}" is already taken`);
    if (row.email && takenEmails.has(row.email))
      errors.push(`Email "${row.email}" is already in use`);
    if (row.admissionNumber && takenAdmission.has(row.admissionNumber))
      errors.push(`Admission number "${row.admissionNumber}" already exists`);
  });

  // Enrolling needs a current session and term.
  let context = null;
  if (parsed.some(({ row, errors }) => row.classId && errors.length === 0)) {
    try {
      context = await getCurrentAcademicContext();
    } catch {
      parsed.forEach(({ row, errors }) => {
        if (row.classId) errors.push("No active session/term to enrol into");
      });
    }
  }

  const results = [];
  let created = 0;

  for (let index = 0; index < parsed.length; index++) {
    const { row, errors } = parsed[index];

    if (errors.length > 0) {
      results.push({ index, ok: false, errors });
      continue;
    }
    if (dryRun) {
      results.push({ index, ok: true });
      continue;
    }

    try {
      const generatedPassword = row.password ? null : generatePassword();

      const student = await withTransaction(async (session) => {
        // Pick the admission number (retry if a generated one is taken).
        let admissionNumber = row.admissionNumber;
        for (let attempt = 0; !admissionNumber && attempt < 5; attempt++) {
          const candidate = await settingService.generateId("student");
          if (!(await Student.exists({ admissionNumber: candidate }).session(session)))
            admissionNumber = candidate;
        }
        if (!admissionNumber) throw new ApiError(500, "Could not generate an admission number.");

        const username = row.username || admissionNumber.toLowerCase();
        const email = row.email || `${username}@students.invalid`;

        const clash = await User.findOne({ $or: [{ username }, { email }] })
          .select("username email")
          .session(session);
        if (clash) {
          throw new ApiError(
            400,
            clash.username === username
              ? `Username "${username}" is already taken`
              : `Email "${email}" is already in use`,
          );
        }

        const [user] = await User.create(
          [
            {
              firstName: row.firstName,
              lastName: row.lastName,
              otherName: row.otherName || undefined,
              username,
              email,
              password: row.password || generatedPassword,
              phoneNumber: row.phoneNumber || undefined,
              role: "student",
            },
          ],
          { session },
        );

        const [student] = await Student.create(
          [
            {
              user: user._id,
              admissionNumber,
              gender: row.gender,
              dateOfBirth: row.dateOfBirth,
              admissionDate: row.admissionDate,
              address: row.address || undefined,
            },
          ],
          { session },
        );

        if (row.classId) {
          await Enrollment.create(
            [
              {
                student: student._id,
                session: context.session._id,
                term: context.term._id,
                schoolClass: row.classId,
              },
            ],
            { session },
          );
        }

        return { student, username, email };
      });

      created++;
      results.push({
        index,
        ok: true,
        student: {
          _id: student.student._id,
          admissionNumber: student.student.admissionNumber,
          username: student.username,
          // Only generated passwords are echoed back, and only this once.
          password: generatedPassword,
          class: row.className || null,
        },
      });
    } catch (error) {
      results.push({
        index,
        ok: false,
        errors: [error.message || "Could not create student"],
      });
    }
  }

  if (created > 0) await bustDashboard();

  return {
    dryRun,
    total: parsed.length,
    createdCount: created,
    validCount: results.filter((r) => r.ok).length,
    failedCount: results.filter((r) => !r.ok).length,
    results,
  };
};

export default {
  createStudent,
  bulkCreateStudents,
  getStudents,
  getStudent,
  updateStudent,
};
