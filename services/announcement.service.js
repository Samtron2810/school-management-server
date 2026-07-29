import Announcement from "../models/Announcement.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import ParentStudent from "../models/ParentStudent.js";
import Enrollment from "../models/Enrollment.js";
import ClassSubject from "../models/ClassSubject.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";
import notificationService from "./notification.service.js";

const roles = ["admin", "teacher", "student", "parent"];

const getStudentProfile = async (userId) => {
  const student = await Student.findOne({
    user: userId,
    isActive: true,
  });

  if (!student) {
    throw new ApiError(404, "Student profile not found.");
  }

  return student;
};

const getTeacherProfile = async (userId) => {
  const teacher = await Teacher.findOne({
    user: userId,
    isActive: true,
  });

  if (!teacher) {
    throw new ApiError(404, "Teacher profile not found.");
  }

  return teacher;
};

const getParentProfile = async (userId) => {
  const parent = await Parent.findOne({
    user: userId,
    isActive: true,
  });

  if (!parent) {
    throw new ApiError(404, "Parent profile not found.");
  }

  return parent;
};

const buildAudience = (data) => {
  const targetRoles =
    data.targetRoles && data.targetRoles.length > 0
      ? data.targetRoles
      : [...roles];

  return {
    targetRoles,
    targetClasses: data.targetClasses ?? [],
    targetStudents: data.targetStudents ?? [],
    targetParents: data.targetParents ?? [],
  };
};

const isVisibleToUser = async (announcement, user, academicContext) => {
  const now = new Date();

  if (!announcement.isActive) {
    return false;
  }

  if (announcement.publishAt && announcement.publishAt > now) {
    return false;
  }

  if (announcement.expiresAt && announcement.expiresAt < now) {
    return false;
  }

  if (!announcement.targetRoles.includes(user.role)) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (announcement.targetStudents.length > 0 && user.role === "student") {
    const student = await getStudentProfile(user._id);

    return announcement.targetStudents.some(
      (id) => id.toString() === student._id.toString(),
    );
  }

  if (user.role === "parent") {
    const parent = await getParentProfile(user._id);

    // 1. Explicitly targeted as a parent by ID.
    if (
      announcement.targetParents.some(
        (id) => id.toString() === parent._id.toString(),
      )
    ) {
      return true;
    }

    // 2. Find all children linked to this parent.
    const links = await ParentStudent.find({
      parent: parent._id,
      isActive: true,
    }).select("student");
    const childIds = links.map((link) => link.student.toString());
    if (childIds.length === 0) return false;

    // 3. Any child is in targetStudents.
    if (announcement.targetStudents.length > 0) {
      const matchesStudent = announcement.targetStudents.some((sid) =>
        childIds.includes(sid.toString()),
      );
      if (matchesStudent) return true;
    }

    // 4. Any child is enrolled in a targetClass.
    if (announcement.targetClasses.length > 0 && academicContext) {
      const { session, term } = academicContext;
      const enrollment = await Enrollment.findOne({
        student: { $in: childIds },
        schoolClass: { $in: announcement.targetClasses },
        session: session._id,
        term: term._id,
        status: "Active",
      });
      if (enrollment) return true;
    }

    // 5. Announcement targets the "student" role generally — parents can see it.
    if (announcement.targetRoles.includes("student")) {
      return true;
    }

    return false;
  }

  if (announcement.targetClasses.length > 0) {
    // No resolvable current session/term (e.g. between academic sessions) —
    // a class-targeted announcement can't be matched to anyone's enrollment,
    // so treat it as not-visible instead of failing the whole request.
    if (!academicContext) {
      return false;
    }

    const { session, term } = academicContext;

    if (user.role === "student") {
      const student = await getStudentProfile(user._id);

      const enrollment = await Enrollment.findOne({
        student: student._id,
        session: session._id,
        term: term._id,
        status: "Active",
      });

      if (!enrollment) {
        return false;
      }

      return announcement.targetClasses.some(
        (classId) => classId.toString() === enrollment.schoolClass.toString(),
      );
    }

    if (user.role === "teacher") {
      const teacher = await getTeacherProfile(user._id);

      const classSubjects = await ClassSubject.find({
        schoolClass: { $in: announcement.targetClasses },
        isActive: true,
      }).select("_id");

      if (classSubjects.length === 0) {
        return false;
      }

      return Boolean(teacher);
    }
  }

  return true;
};

const createAnnouncement = async (data, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to create announcements.");
  }

  const announcement = await Announcement.create({
    title: data.title,
    message: data.message,
    ...buildAudience(data),
    publishAt: data.publishAt ?? Date.now(),
    expiresAt: data.expiresAt ?? null,
    priority: data.priority ?? "Normal",
    isPinned: data.isPinned ?? false,
    createdBy: user._id,
  });

  // Notify the target audience about the new announcement.
  try {
    const audience = buildAudience(data);
    const link = `/${user.role}/announcements`;

    if (audience.targetRoles.length > 0) {
      await notificationService.notifyRoles(audience.targetRoles, {
        title: `New Announcement: ${announcement.title}`,
        message: announcement.message?.substring(0, 120) || "No details",
        type: "announcement",
        link,
      });
    }

    for (const studentId of audience.targetStudents) {
      await notificationService.notifyStudentAndParents(studentId, {
        title: `New Announcement: ${announcement.title}`,
        message: announcement.message?.substring(0, 120) || "No details",
        type: "announcement",
        link,
      });
    }
  } catch (error) {
    console.error(
      "Failed to send announcement notifications:",
      error?.message || error,
    );
  }

  return announcement;
};

const updateAnnouncement = async (announcementId, data, user) => {
  const announcement = await findDocumentOrFail(
    Announcement,
    announcementId,
    "Announcement",
  );

  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to update announcements.");
  }

  announcement.title = data.title ?? announcement.title;
  announcement.message = data.message ?? announcement.message;
  announcement.targetRoles = data.targetRoles ?? announcement.targetRoles;
  announcement.targetClasses = data.targetClasses ?? announcement.targetClasses;
  announcement.targetStudents =
    data.targetStudents ?? announcement.targetStudents;
  announcement.targetParents = data.targetParents ?? announcement.targetParents;
  announcement.publishAt = data.publishAt ?? announcement.publishAt;
  announcement.expiresAt =
    data.expiresAt === undefined ? announcement.expiresAt : data.expiresAt;
  announcement.priority = data.priority ?? announcement.priority;
  announcement.isPinned =
    data.isPinned === undefined ? announcement.isPinned : data.isPinned;

  await announcement.save();

  return announcement;
};

const deleteAnnouncement = async (announcementId, user) => {
  const announcement = await findDocumentOrFail(
    Announcement,
    announcementId,
    "Announcement",
  );

  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to delete announcements.");
  }

  announcement.isActive = false;

  await announcement.save();

  return announcement;
};

const getAnnouncementById = async (announcementId, user) => {
  const announcement = await findDocumentOrFail(
    Announcement,
    announcementId,
    "Announcement",
  );

  const academicContext = await getCurrentAcademicContext().catch(() => null);

  const visible = await isVisibleToUser(announcement, user, academicContext);

  if (!visible) {
    throw new ApiError(403, "You are not allowed to view this announcement.");
  }

  return announcement;
};

const getAnnouncements = async (user) => {
  const announcements = await Announcement.find({
    isActive: true,
  })
    .sort({
      isPinned: -1,
      publishAt: -1,
      createdAt: -1,
    })
    .lean();

  // Resolved once per request, not once per announcement — also means one
  // missing/ambiguous academic context can no longer fail the whole list.
  const academicContext = await getCurrentAcademicContext().catch(() => null);

  const visibleAnnouncements = [];

  for (const announcement of announcements) {
    if (await isVisibleToUser(announcement, user, academicContext)) {
      visibleAnnouncements.push(announcement);
    }
  }

  return visibleAnnouncements;
};

export default {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  getAnnouncements,
};
