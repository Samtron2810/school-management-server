import { Router } from "express";

import classSubjectController from "../controllers/classSubject.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { createClassSubjectValidator } from "../validators/classSubject.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createClassSubjectValidator,
  validateRequest,
  classSubjectController.createClassSubject,
);

router.get(
  "/",
  authenticate,
  authorize("admin"),
  classSubjectController.getClassSubjects,
);

export default router;
