import { body, param } from "express-validator";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeRule = (field, required) => {
  const rule = body(field)
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage(`${field} must be in HH:MM format`);
  return required ? rule : rule.optional();
};

export const createTimetableValidator = [
  body("teacherAssignment")
    .notEmpty()
    .withMessage("Teacher assignment is required")
    .isMongoId()
    .withMessage("Invalid teacher assignment ID"),

  body("dayOfWeek").isIn(DAYS).withMessage("Invalid day of week"),

  timeRule("startTime", true),

  timeRule("endTime", true),
];

export const updateTimetableValidator = [
  param("id").isMongoId().withMessage("Invalid timetable entry ID"),

  body("dayOfWeek").optional().isIn(DAYS).withMessage("Invalid day of week"),

  timeRule("startTime", false),

  timeRule("endTime", false),
];
