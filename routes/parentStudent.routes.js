import { Router } from "express";

import parentStudentController from "../controllers/parentStudent.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { linkParentStudentValidator } from "../validators/parentStudent.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  linkParentStudentValidator,
  validateRequest,
  parentStudentController.linkParentStudent,
);

router.get(
  "/student/:studentId",
  authenticate,
  authorize("admin"),
  parentStudentController.getParentsOfStudent,
);

router.get(
  "/parent/:parentId",
  authenticate,
  authorize("admin"),
  parentStudentController.getChildrenOfParent,
);

router.patch(
  "/:id/remove",
  authenticate,
  authorize("admin"),
  parentStudentController.removeParentStudent,
);

export default router;
