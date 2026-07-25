import { Router } from "express";

import dashboardController from "../controllers/dashboard.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", protect, dashboardController.getDashboard);

export default router;
