import { Router } from "express";
import DatasetController from "#api/controllers/dataset.controller.js";

const datasetRouter = Router();

/* -------------------Old Code of Minh --------------------- */

datasetRouter.post("/clf/:id", DatasetController.CreateClassificationDataset);

// datasetRouter.put('/:id/labels', DatasetController.CreateLabelDataset)

datasetRouter.post("/:id/label");

/* -------------------Old Code of Minh --------------------- */

datasetRouter.get("/", DatasetController.List);
datasetRouter.post("/", DatasetController.Create);
datasetRouter.get("/:id", DatasetController.Get);
datasetRouter.get("/:id/datasetPreview", DatasetController.Preview);
datasetRouter.get("/:id/dataTen", DatasetController.GetTen); // get 10 first rows in dataset
datasetRouter.post("/:id/deleteObjects", DatasetController.DeleteObjects);
datasetRouter.post("/:id/addNewFiles", DatasetController.AddNewFiles);

export default datasetRouter;
