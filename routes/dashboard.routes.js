import { Router } from "express";

import dashboardController from "../controllers/dashboard.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { heavyReadLimiter } from "../middlewares/rateLimiters.js";

const router = Router();

router.get("/", heavyReadLimiter, protect, dashboardController.getDashboard);

export default router;
