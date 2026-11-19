import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/async-handler.utils.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const authRoutes = Router();
authRoutes.post("/register", asyncHandler(authController.register));
authRoutes.post("/login", asyncHandler(authController.login));
authRoutes.post("/refresh", asyncHandler(authController.refresh));
authRoutes.post("/logout", asyncHandler(authController.logout));
authRoutes.post(
  "/logout-all",
  authenticate,
  asyncHandler(authController.logoutAll),
);

export default authRoutes;