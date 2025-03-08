import { Router } from "express";
import isAuth from "#api/middlewares/auth.middleware.js";
import ExperimentController from "../../controllers/experiment.controller.js";

const experimentRouter = Router();

experimentRouter.get("/", ExperimentController.Get);
experimentRouter.get("/allExperiments", ExperimentController.getAllExperiments);
experimentRouter.get("/deploy", ExperimentController.DeployModel);
experimentRouter.get("/train-history", ExperimentController.GetTrainingGraph);
experimentRouter.get(
  "/save-model",
  [isAuth],
  ExperimentController.SaveBestModel
);
experimentRouter.get("/cloud_deploy", ExperimentController.DeployCloudModel);
experimentRouter.get(
  "/cloud_deploy_status",
  ExperimentController.GetDeployProgress
);
experimentRouter.get("/model/:experimentName", ExperimentController.GetModel);

experimentRouter.post("/delete/:experimentName", ExperimentController.Delete);
experimentRouter.post("/predict", ExperimentController.Predict);
experimentRouter.post("/explain", ExperimentController.Explain);
experimentRouter.post("/", ExperimentController.Create);

export default experimentRouter;
