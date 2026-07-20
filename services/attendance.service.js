import Attendance from "../models/Attendance.js";
import Teacher from "../models/Teacher.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";
import ClassSubject from "../models/ClassSubject.js";

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

const getAttendanceByDate = async (teacherAssignmentId, date) => {
  const assignment = await findDocumentOrFail(
    TeacherAssignment,
    teacherAssignmentId,
    "Teacher Assignment",
  );

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

  updateAttendance,

  deleteAttendance,
};
