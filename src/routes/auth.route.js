import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const authRoutes = Router();
authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.post("/refresh", authController.refreshToken);
authRoutes.get("/profile",authenticate,authController.profile);
authRoutes.post("/logout", authController.logout);
authRoutes.post(
  "/logout-all",
  authenticate,
  authController.logoutAll,
);

export default authRoutes;