import { body } from "express-validator";

export const markAttendanceValidator = [
  body("teacherAssignment")
    .notEmpty()
    .withMessage("Teacher assignment is required"),

  body("date").isISO8601().withMessage("Invalid attendance date"),

  body("records")
    .isArray({ min: 1 })
    .withMessage("Attendance records are required"),

  body("records.*.student").notEmpty().withMessage("Student is required"),

  body("records.*.status")
    .isIn(["Present", "Absent", "Late", "Excused"])
    .withMessage("Invalid attendance status"),

  body("records.*.remark").optional().trim(),
];
