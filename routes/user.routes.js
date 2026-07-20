import { Router } from "express";

import userController from "../controllers/user.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { createUserValidator } from "../validators/user.validator.js";

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

export default router;
