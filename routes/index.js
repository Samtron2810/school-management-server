import { Router } from "express";

import authRoutes from "./auth.routes.js";
import sessionRoutes from "./session.routes.js";
import termRoutes from "./term.routes.js";
import classRoutes from "./class.routes.js";
import subjectRoutes from "./subject.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TronSchool API is running",
  });
});

router.use("/auth", authRoutes);
router.use("/sessions", sessionRoutes);
router.use("/terms", termRoutes);
router.use("/classes", classRoutes);
router.use("/subjects", subjectRoutes);

export default router;
