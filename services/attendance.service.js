import Attendance from "../models/Attendance.js";
import Teacher from "../models/Teacher.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";
import ClassSubject from "../models/ClassSubject.js";
import SchoolClass from "../models/SchoolClass.js";
import Parent from "../models/Parent.js";
import ParentStudent from "../models/ParentStudent.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";

import { getCurrentAcademicContext } from "../utils/academicContext.js";

/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

const getTeacherProfile = async (userId) => {
  return await Teacher.findOne({
    user: userId,
  });
};

const getClassSubject = async (assignment) => {
  const classSubject = await ClassSubject.findOne({
    schoolClass: assignment.schoolClass,

    subject: assignment.subject,

    isActive: true,
  });

  if (!classSubject) {
    throw new ApiError(404, "Class subject not found.");
  }

  return classSubject;
};

const authorizeStudentAttendanceAccess = async (studentId, user) => {
  if (user.role === "admin") {
    return;
  }

  if (user.role === "student") {
    const student = await Student.findOne({ user: user._id });

    if (!student) {
      throw new ApiError(403, "Student profile not found.");
    }

    if (student._id.toString() !== studentId.toString()) {
      throw new ApiError(
        403,
        "You are not allowed to view this student's attendance.",
      );
    }

    return;
  }

  if (user.role === "parent") {
    const parent = await Parent.findOne({ user: user._id });

    if (!parent) {
      throw new ApiError(403, "Parent profile not found.");
    }

    const relation = await ParentStudent.findOne({
      parent: parent._id,
      student: studentId,
      isActive: true,
    });

    if (!relation) {
      throw new ApiError(
        403,
        "You are not allowed to view this student's attendance.",
      );
    }

    return;
  }

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);

    if (!teacher) {
      throw new ApiError(404, "Teacher profile not found.");
    }

    const { session, term } = await getCurrentAcademicContext();

    const enrollment = await Enrollment.findOne({
      student: studentId,
      session: session._id,
      term: term._id,
      status: "Active",
    });

    if (!enrollment) {
      throw new ApiError(404, "No active enrollment found for this student.");
    }

    const assignment = await TeacherAssignment.findOne({
      teacher: teacher._id,
      schoolClass: enrollment.schoolClass,
      session: session._id,
      term: term._id,
      isActive: true,
    });

    if (!assignment) {
      throw new ApiError(
        403,
        "You are not allowed to view this student's attendance.",
      );
    }

    return;
  }

  throw new ApiError(
    403,
    "You are not allowed to view this student's attendance.",
  );
};

const authorizeTeacherAssignmentAccess = async (assignment, user) => {
  if (user.role !== "teacher") {
    return;
  }

  const teacher = await getTeacherProfile(user._id);

  if (!teacher) {
    throw new ApiError(404, "Teacher profile not found.");
  }

  if (assignment.teacher.toString() !== teacher._id.toString()) {
    throw new ApiError(403, "You are not authorized to view this attendance.");
  }
};

/*
|--------------------------------------------------------------------------
| Mark Attendance
|--------------------------------------------------------------------------
*/

const markAttendance = async (data, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to mark attendance.");
  }

  const { session, term } = await getCurrentAcademicContext();

  const assignment = await findDocumentOrFail(
    TeacherAssignment,
    data.teacherAssignment,
    "Teacher Assignment",
  );

  if (!assignment.isActive) {
    throw new ApiError(400, "Teacher assignment is inactive.");
  }

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);

    if (!teacher) {
      throw new ApiError(404, "Teacher profile not found.");
    }

    if (teacher._id.toString() !== assignment.teacher.toString()) {
      throw new ApiError(403, "You are not assigned to this class.");
    }
  }

  const classSubject = await getClassSubject(assignment);

  const enrollments = await Enrollment.find({
    schoolClass: assignment.schoolClass,

    session: session._id,

    term: term._id,

    status: "Active",
  }).select("student");

  const validStudentIds = new Set(
    enrollments.map((item) => item.student.toString()),
  );

  const students = await Student.find({
    _id: {
      $in: [...validStudentIds],
    },
  }).select("_id");

  const studentMap = new Map();

  students.forEach((student) => {
    studentMap.set(student._id.toString(), student);
  });

  const operations = [];

  for (const record of data.records) {
    if (!validStudentIds.has(record.student)) {
      throw new ApiError(
        400,
        "One or more students do not belong to this class.",
      );
    }

    const student = studentMap.get(record.student);

    if (!student) {
      throw new ApiError(404, "Student not found.");
    }

    operations.push({
      updateOne: {
        filter: {
          student: student._id,

          classSubject: classSubject._id,

          date: new Date(data.date),
        },

        update: {
          $set: {
            teacher: assignment.teacher,

            teacherAssignment: assignment._id,

            classSubject: classSubject._id,

            session: session._id,

            term: term._id,

            student: student._id,

            date: new Date(data.date),

            status: record.status,

            remark: record.remark || "",

            isActive: true,
          },
        },

        upsert: true,
      },
    });
  }

  await Attendance.bulkWrite(operations);

  return {
    totalMarked: operations.length,

    attendanceDate: data.date,
  };
};

/*
|--------------------------------------------------------------------------
| Get Attendance By Date
|--------------------------------------------------------------------------
*/

const getAttendanceByDate = async (teacherAssignmentId, date, user) => {
  const assignment = await findDocumentOrFail(
    TeacherAssignment,
    teacherAssignmentId,
    "Teacher Assignment",
  );

  await authorizeTeacherAssignmentAccess(assignment, user);

  const classSubject = await getClassSubject(assignment);

  return await Attendance.find({
    classSubject: classSubject._id,

    date: new Date(date),

    isActive: true,
  })
    .populate({
      path: "student",
      populate: {
        path: "user",
        select: "firstName lastName otherName admissionNumber avatar",
      },
    })
    .sort({
      createdAt: 1,
    })
    .lean();
};

/*
|--------------------------------------------------------------------------
| Get Student Attendance
|--------------------------------------------------------------------------
*/

const getStudentAttendance = async (studentId, user) => {
  await findDocumentOrFail(Student, studentId, "Student");

  await authorizeStudentAttendanceAccess(studentId, user);

  return await Attendance.find({
    student: studentId,

    isActive: true,
  })
    .populate({
      path: "teacher",
      populate: {
        path: "user",
        select: "firstName lastName",
      },
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
          select: "name level",
        },
      ],
    })
    .sort({
      date: -1,
    })
    .lean();
};

/*
|--------------------------------------------------------------------------
| Attendance Summary
|--------------------------------------------------------------------------
*/

const getAttendanceSummary = async (studentId, user) => {
  await findDocumentOrFail(Student, studentId, "Student");

  await authorizeStudentAttendanceAccess(studentId, user);

  const attendance = await Attendance.find({
    student: studentId,

    isActive: true,
  })
    .select("status")
    .lean();

  const total = attendance.length;

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  attendance.forEach((record) => {
    switch (record.status) {
      case "Present":
        present++;
        break;

      case "Absent":
        absent++;
        break;

      case "Late":
        late++;
        break;

      case "Excused":
        excused++;
        break;
    }
  });

  const percentage =
    total === 0 ? 0 : (((present + late) / total) * 100).toFixed(2);

  return {
    total,

    present,

    absent,

    late,

    excused,

    attendancePercentage: Number(percentage),
  };
};

/*
|--------------------------------------------------------------------------
| Update Attendance
|--------------------------------------------------------------------------
*/

const updateAttendance = async (attendanceId, data) => {
  const attendance = await findDocumentOrFail(
    Attendance,
    attendanceId,
    "Attendance",
  );

  if (data.status) {
    attendance.status = data.status;
  }

  if (data.remark !== undefined) {
    attendance.remark = data.remark;
  }

  await attendance.save();

  return attendance;
};

/*
|--------------------------------------------------------------------------
| Delete Attendance
|--------------------------------------------------------------------------
*/

const deleteAttendance = async (attendanceId) => {
  const attendance = await findDocumentOrFail(
    Attendance,
    attendanceId,
    "Attendance",
  );

  attendance.isActive = false;

  await attendance.save();

  return attendance;
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default {
  markAttendance,

  getAttendanceByDate,

  getStudentAttendance,

  getAttendanceSummary,

  getClassRegister,

  getClassAttendanceSummary,

  updateAttendance,

  deleteAttendance,
};

/*
|--------------------------------------------------------------------------
| Class Register (daily view for admins/teachers)
|--------------------------------------------------------------------------
*/

async function getClassRegister(schoolClassId, date, user) {
  const schoolClass = await findDocumentOrFail(
    SchoolClass,
    schoolClassId,
    "Class",
  );

  const classSubjects = await ClassSubject.find({
    schoolClass: schoolClass._id,
  }).select("_id");

  const day = date ? new Date(date) : new Date();
  const startOfDay = new Date(day);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(day);
  endOfDay.setHours(23, 59, 59, 999);

  return await Attendance.find({
    classSubject: { $in: classSubjects.map((item) => item._id) },
    date: { $gte: startOfDay, $lte: endOfDay },
    isActive: true,
  })
    .populate({
      path: "student",
      populate: {
        path: "user",
        select: "firstName lastName otherName admissionNumber avatar",
      },
    })
    .populate({
      path: "classSubject",
      populate: {
        path: "subject",
        select: "name code",
      },
    })
    .sort({ createdAt: 1 })
    .lean();
}

/*
|--------------------------------------------------------------------------
| Class Attendance Summary (date-range report for admins/teachers)
|--------------------------------------------------------------------------
*/

async function getClassAttendanceSummary(schoolClassId, query, user) {
  const schoolClass = await findDocumentOrFail(
    SchoolClass,
    schoolClassId,
    "Class",
  );

  const classSubjects = await ClassSubject.find({
    schoolClass: schoolClass._id,
  }).select("_id");

  const filter = {
    classSubject: { $in: classSubjects.map((item) => item._id) },
    isActive: true,
  };

  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) {
      const end = new Date(query.to);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  const records = await Attendance.find(filter).select("student status").lean();

  const countsByStudent = new Map();
  records.forEach((record) => {
    const key = record.student.toString();
    const entry = countsByStudent.get(key) || {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    entry.total += 1;
    if (record.status === "Present") entry.present += 1;
    if (record.status === "Absent") entry.absent += 1;
    if (record.status === "Late") entry.late += 1;
    if (record.status === "Excused") entry.excused += 1;

    countsByStudent.set(key, entry);
  });

  const students = await Student.find({
    _id: { $in: [...countsByStudent.keys()] },
  }).populate({
    path: "user",
    select: "firstName lastName otherName admissionNumber avatar",
  });

  return students
    .map((student) => {
      const counts = countsByStudent.get(student._id.toString());
      const effective = counts.present + counts.late;

      return {
        student,
        ...counts,
        attendancePercentage:
          counts.total > 0
            ? Number(((effective / counts.total) * 100).toFixed(2))
            : 0,
      };
    })
    .sort((a, b) => {
      const nameA =
        `${a.student.user?.firstName ?? ""} ${a.student.user?.lastName ?? ""}`.trim();
      const nameB =
        `${b.student.user?.firstName ?? ""} ${b.student.user?.lastName ?? ""}`.trim();
      return nameA.localeCompare(nameB);
    });
}
