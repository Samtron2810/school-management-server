import { Router } from "express";

import parentStudentController from "../controllers/parentStudent.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { linkParentStudentValidator } from "../validators/parentStudent.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  linkParentStudentValidator,
  validate,
  parentStudentController.linkParentStudent,
);

router.get(
  "/student/:studentId",
  protect,
  authorize("admin"),
  parentStudentController.getParentsOfStudent,
);

router.get(
  "/parent/:parentId",
  protect,
  authorize("admin"),
  parentStudentController.getChildrenOfParent,
);

router.patch(
  "/:id/remove",
  protect,
  authorize("admin"),
  parentStudentController.removeParentStudent,
);

export default router;
