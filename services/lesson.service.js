import Lesson from "../models/Lesson.js";
import LessonAttachment from "../models/LessonAttachment.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import ClassSubject from "../models/ClassSubject.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";

import ApiError from "../utils/ApiError.js";
import withTransaction from "../utils/withTransaction.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";
import fileService from "./file.service.js";
import deleteFromCloudinary from "../utils/deleteFromCloudinary.js";

const populateLessonById = async (lessonId) => {
  const lesson = await Lesson.findById(lessonId)
    .populate({
      path: "teacher",
      populate: {
        path: "user",
        select:
          "firstName lastName otherName email username phoneNumber avatar role",
      },
    })
    .populate({
      path: "teacherAssignment",
      populate: [
        {
          path: "teacher",
          populate: {
            path: "user",
            select: "firstName lastName otherName email username role",
          },
        },
        {
          path: "subject",
          select: "name code",
        },
        {
          path: "schoolClass",
        },
        {
          path: "session",
          select: "name",
        },
        {
          path: "term",
          select: "name",
        },
      ],
    })
    .populate({
      path: "classSubject",
      populate: [
        {
          path: "subject",
          select: "name code",
        },
        {
          path: "schoolClass",
        },
      ],
    })
    .populate("session", "name")
    .populate("term", "name");

  if (!lesson) {
    throw new ApiError(404, "Lesson not found.");
  }

  const attachments = await LessonAttachment.find({
    lesson: lessonId,
    isActive: true,
  }).sort({
    createdAt: 1,
  });

  return {
    ...lesson.toJSON(),
    attachments,
  };
};

const ensureTeacherCanManageLesson = async (lesson, user) => {
  if (user.role === "admin") return;

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({
      user: user._id,
    });

    if (!teacher) {
      throw new ApiError(403, "Teacher profile not found.");
    }

    if (lesson.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, "You are not allowed to manage this lesson.");
    }

    return;
  }

  throw new ApiError(403, "You are not allowed to manage this lesson.");
};

const createLesson = async (data, files = [], user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not allowed to create lessons.");
  }

  const { session: currentSession, term: currentTerm } =
    await getCurrentAcademicContext();

  const teacherAssignment = await TeacherAssignment.findById(
    data.teacherAssignment,
  )
    .populate({
      path: "teacher",
      populate: {
        path: "user",
        select: "firstName lastName otherName email username role",
      },
    })
    .populate("subject", "name code")
    .populate("schoolClass")
    .populate("session", "name")
    .populate("term", "name");

  if (!teacherAssignment) {
    throw new ApiError(404, "Teacher assignment not found.");
  }

  if (
    teacherAssignment.session._id.toString() !==
      currentSession._id.toString() ||
    teacherAssignment.term._id.toString() !== currentTerm._id.toString()
  ) {
    throw new ApiError(
      400,
      "Teacher assignment does not belong to the current academic session or term.",
    );
  }

  if (teacherAssignment.isActive === false) {
    throw new ApiError(400, "Teacher assignment is inactive.");
  }

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({
      user: user._id,
    });

    if (!teacher) {
      throw new ApiError(403, "Teacher profile not found.");
    }

    if (teacherAssignment.teacher._id.toString() !== teacher._id.toString()) {
      throw new ApiError(
        403,
        "You are not allowed to create a lesson for this assignment.",
      );
    }
  }

  const classSubject = await ClassSubject.findOne({
    schoolClass: teacherAssignment.schoolClass._id,
    subject: teacherAssignment.subject._id,
    isActive: true,
  });

  if (!classSubject) {
    throw new ApiError(
      400,
      "This subject is not assigned to the selected class.",
    );
  }

  let uploadedFiles = [];

  if (files.length > 0) {
    uploadedFiles = await fileService.uploadFiles(files, `tronschool/lessons`);
  }

  try {
    const lessonId = await withTransaction(async (session) => {
      const [lesson] = await Lesson.create(
        [
          {
            teacher: teacherAssignment.teacher._id,
            teacherAssignment: teacherAssignment._id,
            classSubject: classSubject._id,
            session: currentSession._id,
            term: currentTerm._id,
            title: data.title,
            description: data.description || "",
            topic: data.topic,
            week: data.week,
            isPublished: data.isPublished ?? true,
            publishedAt: data.isPublished === false ? null : new Date(),
            isActive: true,
          },
        ],
        { session },
      );

      if (uploadedFiles.length > 0) {
        const attachmentDocs = uploadedFiles.map((file) => ({
          lesson: lesson._id,
          fileName: file.fileName,
          originalName: file.originalName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          url: file.url,
          publicId: file.publicId,
          resourceType: file.resourceType,
          uploadedBy: teacherAssignment.teacher._id,
          isActive: true,
        }));

        await LessonAttachment.create(attachmentDocs, {
          session,
        });
      }

      return lesson._id;
    });

    return await populateLessonById(lessonId);
  } catch (error) {
    if (uploadedFiles.length > 0) {
      await Promise.allSettled(
        uploadedFiles.map((file) =>
          deleteFromCloudinary(file.publicId, file.resourceType),
        ),
      );
    }

    throw error;
  }
};

const getLessons = async () => {
  const lessons = await Lesson.find({
    isActive: true,
  })
    .populate({
      path: "teacher",
      populate: {
        path: "user",
        select:
          "firstName lastName otherName email username phoneNumber avatar role",
      },
    })
    .populate({
      path: "teacherAssignment",
      populate: [
        {
          path: "subject",
          select: "name code",
        },
        {
          path: "schoolClass",
        },
        {
          path: "session",
          select: "name",
        },
        {
          path: "term",
          select: "name",
        },
      ],
    })
    .populate({
      path: "classSubject",
      populate: [
        {
          path: "subject",
          select: "name code",
        },
        {
          path: "schoolClass",
        },
      ],
    })
    .populate("session", "name")
    .populate("term", "name")
    .sort({
      createdAt: -1,
    });

  return lessons;
};

const getMyLessons = async (user) => {
  if (user.role === "admin") {
    return await getLessons();
  }

  const { session: currentSession, term: currentTerm } =
    await getCurrentAcademicContext();

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({
      user: user._id,
    });

    if (!teacher) {
      throw new ApiError(403, "Teacher profile not found.");
    }

    return await Lesson.find({
      teacher: teacher._id,
      session: currentSession._id,
      term: currentTerm._id,
      isActive: true,
    })
      .populate({
        path: "teacher",
        populate: {
          path: "user",
          select:
            "firstName lastName otherName email username phoneNumber avatar role",
        },
      })
      .populate({
        path: "teacherAssignment",
        populate: [
          {
            path: "subject",
            select: "name code",
          },
          {
            path: "schoolClass",
          },
          {
            path: "session",
            select: "name",
          },
          {
            path: "term",
            select: "name",
          },
        ],
      })
      .populate({
        path: "classSubject",
        populate: [
          {
            path: "subject",
            select: "name code",
          },
          {
            path: "schoolClass",
          },
        ],
      })
      .sort({
        createdAt: -1,
      });
  }

  if (user.role === "student") {
    const student = await Student.findOne({
      user: user._id,
    });

    if (!student) {
      throw new ApiError(403, "Student profile not found.");
    }

    const enrollment = await Enrollment.findOne({
      student: student._id,
      session: currentSession._id,
      status: "Active",
    });

    if (!enrollment) {
      throw new ApiError(404, "No active enrollment found for this student.");
    }

    const classSubjects = await ClassSubject.find({
      schoolClass: enrollment.schoolClass,
      isActive: true,
    }).select("_id");

    const classSubjectIds = classSubjects.map((item) => item._id);

    return await Lesson.find({
      classSubject: { $in: classSubjectIds },
      session: currentSession._id,
      term: currentTerm._id,
      isActive: true,
      isPublished: true,
    })
      .populate({
        path: "teacher",
        populate: {
          path: "user",
          select:
            "firstName lastName otherName email username phoneNumber avatar role",
        },
      })
      .populate({
        path: "teacherAssignment",
        populate: [
          {
            path: "subject",
            select: "name code",
          },
          {
            path: "schoolClass",
          },
          {
            path: "session",
            select: "name",
          },
          {
            path: "term",
            select: "name",
          },
        ],
      })
      .populate({
        path: "classSubject",
        populate: [
          {
            path: "subject",
            select: "name code",
          },
          {
            path: "schoolClass",
          },
        ],
      })
      .sort({
        createdAt: -1,
      });
  }

  throw new ApiError(403, "You are not allowed to view these lessons.");
};

const getLessonById = async (id, user) => {
  const lesson = await Lesson.findById(id)
    .populate({
      path: "teacher",
      populate: {
        path: "user",
        select:
          "firstName lastName otherName email username phoneNumber avatar role",
      },
    })
    .populate({
      path: "teacherAssignment",
      populate: [
        {
          path: "teacher",
          populate: {
            path: "user",
            select: "firstName lastName otherName email username role",
          },
        },
        {
          path: "subject",
          select: "name code",
        },
        {
          path: "schoolClass",
        },
        {
          path: "session",
          select: "name",
        },
        {
          path: "term",
          select: "name",
        },
      ],
    })
    .populate({
      path: "classSubject",
      populate: [
        {
          path: "subject",
          select: "name code",
        },
        {
          path: "schoolClass",
        },
      ],
    })
    .populate("session", "name")
    .populate("term", "name");

  if (!lesson) {
    throw new ApiError(404, "Lesson not found.");
  }

  if (user) {
    if (user.role === "admin") {
      // allowed
    } else if (user.role === "teacher") {
      const teacher = await Teacher.findOne({
        user: user._id,
      });

      if (!teacher) {
        throw new ApiError(403, "Teacher profile not found.");
      }

      if (lesson.teacher._id.toString() !== teacher._id.toString()) {
        throw new ApiError(403, "You are not allowed to view this lesson.");
      }
    } else if (user.role === "student") {
      const student = await Student.findOne({
        user: user._id,
      });

      if (!student) {
        throw new ApiError(403, "Student profile not found.");
      }

      const { session: currentSession, term: currentTerm } =
        await getCurrentAcademicContext();

      const enrollment = await Enrollment.findOne({
        student: student._id,
        session: currentSession._id,
        status: "Active",
      });

      if (!enrollment) {
        throw new ApiError(404, "No active enrollment found for this student.");
      }

      const classSubject = await ClassSubject.findOne({
        _id: lesson.classSubject._id,
        schoolClass: enrollment.schoolClass,
        isActive: true,
      });

      if (!classSubject) {
        throw new ApiError(403, "You are not allowed to view this lesson.");
      }

      if (
        lesson.session._id.toString() !== currentSession._id.toString() ||
        lesson.term._id.toString() !== currentTerm._id.toString()
      ) {
        throw new ApiError(403, "You are not allowed to view this lesson.");
      }
    } else {
      throw new ApiError(403, "You are not allowed to view this lesson.");
    }
  }

  const attachments = await LessonAttachment.find({
    lesson: lesson._id,
    isActive: true,
  }).sort({
    createdAt: 1,
  });

  return {
    ...lesson.toJSON(),
    attachments,
  };
};

const updateLesson = async (id, data, files = [], user) => {
  const lesson = await Lesson.findById(id);

  if (!lesson) {
    throw new ApiError(404, "Lesson not found.");
  }

  await ensureTeacherCanManageLesson(lesson, user);

  let uploadedFiles = [];

  if (files.length > 0) {
    uploadedFiles = await fileService.uploadFiles(files, `tronschool/lessons`);
  }

  try {
    const updatedLesson = await withTransaction(async (session) => {
      Object.assign(lesson, {
        title: data.title ?? lesson.title,
        topic: data.topic ?? lesson.topic,
        week: data.week ?? lesson.week,
        description: data.description ?? lesson.description,
        isPublished:
          typeof data.isPublished === "boolean"
            ? data.isPublished
            : lesson.isPublished,
      });

      if (
        typeof data.isPublished === "boolean" &&
        data.isPublished === true &&
        !lesson.publishedAt
      ) {
        lesson.publishedAt = new Date();
      }

      await lesson.save({ session });

      if (uploadedFiles.length > 0) {
        const attachmentDocs = uploadedFiles.map((file) => ({
          lesson: lesson._id,
          fileName: file.fileName,
          originalName: file.originalName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          url: file.url,
          publicId: file.publicId,
          resourceType: file.resourceType,
          uploadedBy: lesson.teacher,
          isActive: true,
        }));

        await LessonAttachment.create(attachmentDocs, {
          session,
        });
      }

      return lesson._id;
    });

    return await populateLessonById(updatedLesson);
  } catch (error) {
    if (uploadedFiles.length > 0) {
      await Promise.allSettled(
        uploadedFiles.map((file) =>
          deleteFromCloudinary(file.publicId, file.resourceType),
        ),
      );
    }

    throw error;
  }
};

const deleteLesson = async (id, user) => {
  const lesson = await Lesson.findById(id);

  if (!lesson) {
    throw new ApiError(404, "Lesson not found.");
  }

  await ensureTeacherCanManageLesson(lesson, user);

  const attachments = await LessonAttachment.find({
    lesson: lesson._id,
    isActive: true,
  });

  await withTransaction(async (session) => {
    await LessonAttachment.deleteMany({ lesson: lesson._id }, { session });

    await Lesson.deleteOne({ _id: lesson._id }, { session });
  });

  await Promise.allSettled(
    attachments.map((attachment) =>
      deleteFromCloudinary(attachment.publicId, attachment.resourceType),
    ),
  );

  return {
    deletedLessonId: lesson._id,
    deletedAttachments: attachments.length,
  };
};

export default {
  createLesson,
  getLessons,
  getMyLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
};
