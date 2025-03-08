import { Router } from "express";
import ProjectController from "../../controllers/project.controller.js";

const projectRouter = Router();

projectRouter.get("/", ProjectController.List);
projectRouter.get("/models", ProjectController.ListModel);
projectRouter.get("/:id", ProjectController.Get);
projectRouter.post("/", ProjectController.Create);
projectRouter.put("/:id", ProjectController.Update);
projectRouter.post("/:id/delete", ProjectController.Delete);
projectRouter.post("/:id/upload", ProjectController.UploadFiles);
projectRouter.post("/:id/train", ProjectController.TrainModel);
projectRouter.get("/:id/datasets", ProjectController.GetDatasets);
projectRouter.get("/:id/fulldatasets", ProjectController.GetFullDatasets);
projectRouter.post("/:id/explain", ProjectController.ExplainInstance);
projectRouter.post("/:id/autolabel", ProjectController.AutoLabeling);

projectRouter.get("/:id/dataset_preview", ProjectController.GetDataset_Preview);
projectRouter.get(
  "/:id/dataset_labeling",
  ProjectController.GetDataset_Labeling
);
projectRouter.get("/:id/dataset_info", ProjectController.GetDataset_Info);

projectRouter.get("/:id/label_config", ProjectController.GetLabelConfig);
projectRouter.post("/:id/label_config", ProjectController.SetLabelConfig);

projectRouter.post("/:id/set_label/:task_id", ProjectController.SetAnnotation);
projectRouter.post(
  "/:id/set_annotation/:task_id",
  ProjectController.SetAnnotation
);
projectRouter.post(
  "/:id/set_prediction/:task_id",
  ProjectController.SetPrediction
);
projectRouter.post("/:id/sendTargetColumn", ProjectController.SendTargetColumn);

// CLOUD
projectRouter.post("/:id/cloudTrain", ProjectController.TrainCloudModel);

export default projectRouter;
