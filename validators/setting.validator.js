import { body } from "express-validator";

export const updateSettingsValidator = [
  body("schoolName").optional().trim().notEmpty().withMessage("School name cannot be empty"),

  body("address").optional().trim(),

  body("email").optional({ values: "falsy" }).isEmail().withMessage("Valid email is required"),

  body("phoneNumber").optional().trim(),

  body("logoUrl").optional().trim(),

  body("gradeBands")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Grade bands must be a non-empty array"),

  body("gradeBands.*.grade")
    .trim()
    .notEmpty()
    .withMessage("Each grade band needs a grade label"),

  body("gradeBands.*.minScore")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Grade band scores must be between 0 and 100"),

  body("gradeBands.*.gradePoint")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Grade points cannot be negative"),

  body("gradeBands.*.remark").optional().trim(),

  body("scoreComponents")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Score components must be a non-empty array"),

  body("scoreComponents.*.key")
    .trim()
    .notEmpty()
    .withMessage("Each score component needs a key"),

  body("scoreComponents.*.label")
    .trim()
    .notEmpty()
    .withMessage("Each score component needs a label"),

  body("scoreComponents.*.maxMarks")
    .isFloat({ min: 0 })
    .withMessage("Max marks must be zero or greater"),

  body("scoreComponents.*.isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),

  body("passingScore")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Passing score must be between 0 and 100"),

  body("idFormats.teacher.prefix").optional().trim(),
  body("idFormats.student.prefix").optional().trim(),
  body("idFormats.parent.prefix").optional().trim(),

  body("idFormats.*.padding")
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage("ID padding must be between 2 and 10"),
];
