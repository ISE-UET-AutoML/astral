import { Router } from "express";
import AuthController from "../../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/login", AuthController.Login);
authRouter.post("/signup", AuthController.Signup);

export default authRouter;
