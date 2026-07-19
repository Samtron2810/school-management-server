import { body } from "express-validator";

export const linkParentStudentValidator = [
  body("parent").notEmpty().withMessage("Parent is required"),

  body("student").notEmpty().withMessage("Student is required"),

  body("relationship")
    .isIn([
      "Father",
      "Mother",
      "Guardian",
      "Grandfather",
      "Grandmother",
      "Uncle",
      "Aunt",
      "Brother",
      "Sister",
      "Other",
    ])
    .withMessage("Relationship is invalid"),
];
