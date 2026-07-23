import { Router } from "express";

import userController from "../controllers/user.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import {
  createUserValidator,
  updateUserValidator,
  updateUserStatusValidator,
  resetUserPasswordValidator,
} from "../validators/user.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createUserValidator,
  validate,
  userController.createUser,
);

router.get("/", protect, authorize("admin"), userController.getUsers);

router.get("/:id", protect, authorize("admin"), userController.getUser);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateUserValidator,
  validate,
  userController.updateUser,
);

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  updateUserStatusValidator,
  validate,
  userController.updateUserStatus,
);

router.patch(
  "/:id/password",
  protect,
  authorize("admin"),
  resetUserPasswordValidator,
  validate,
  userController.resetUserPassword,
);

export default router;
