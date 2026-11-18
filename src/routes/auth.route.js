import {Router} from "express";
import authController from "../controllers/auth.controller";
import { asyncHandler } from "../utils/asynchandler.utils";

const authRoutes=Router();
 authRoutes.post("/login", asyncHandler(authController.login));
 authRoutes.post("/refresh", asyncHandler(authController.refresh));
// authRoutes.post("/logout", AuthController.logout);
// router.post(
//   "/logout-all",
//   authenticate,
//   AuthController.logoutAll
// );

export default authRoutes;