import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import roleController from "../controllers/role.controller.js";

const roleRoutes=Router();

roleRoutes.post("/create",authenicate,roleController.create);
roleRoutes.put("/update/:roleId",authenicate,roleController.update);
roleRoutes.get("/get/:roleId",authenicate,roleController.getById);
roleRoutes.get("/get",authenicate,roleController.getAllRoles);
roleRoutes.post("/assign",authenicate,roleController.‎assignRoleToUser);
roleRoutes.get("/revoke",authenicate,roleController.revokeRoleFromUser);

export default roleRoutes;
