import { Router } from "express";
import parentController from "../controllers/parent.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import {
  createParentValidator,
  updateParentValidator,
} from "../validators/parent.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createParentValidator,
  validate,
  parentController.createParent,
);

router.get("/", protect, authorize("admin"), parentController.getParents);

// Signed-in parent's children roster (declared before /:id on purpose).
router.get(
  "/my/children",
  protect,
  authorize("parent"),
  parentController.getMyChildren,
);

router.get("/:id", protect, authorize("admin"), parentController.getParentById);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateParentValidator,
  validate,
  parentController.updateParent,
);

export default router;
