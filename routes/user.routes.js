import { Router } from "express";

import userController from "../controllers/user.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { createUserValidator } from "../validators/user.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createUserValidator,
  validateRequest,
  userController.createUser,
);

router.get("/", authenticate, authorize("admin"), userController.getUsers);

export default router;
