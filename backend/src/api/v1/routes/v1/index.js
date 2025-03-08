import { Router } from "express";
import isAuth from "#api/middlewares/auth.middleware.js";
import authRouter from "./auth.route.js";
import projectRouter from "./projects.route.js";
import labelRouter from "./labels.route.js";
import datasetRouter from "./datasets.route.js";
import imageRouter from "./images.route.js";
import experimentRouter from "./experiments.route.js";
import runRouter from "./runs.route.js";
import importRouter from "./import.route.js";
import chatbotRouter from "./chatbot.route.js";

const routeV1 = Router();

routeV1.use("/auth", authRouter);
routeV1.use("/projects", [isAuth], projectRouter);
routeV1.use("/projects", importRouter);
routeV1.use("/labels", labelRouter);
routeV1.use("/datasets", [isAuth], datasetRouter);
routeV1.use("/images", imageRouter);
routeV1.use("/experiments", experimentRouter);
routeV1.use("/runs", runRouter);
routeV1.use("/chat", [isAuth], chatbotRouter);

export default routeV1;
