import { body } from "express-validator";

export const setStudentPublishStateValidator = [
  body("isPublished")
    .isBoolean()
    .withMessage("isPublished must be true or false"),
];
