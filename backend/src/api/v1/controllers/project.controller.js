import ProjectService from "../services/project.service.js";
import DatasetService from "../services/dataset.service.js";
import ImageService from "../services/image.service.js";
import LabelService from "../services/label.service.js";

import axios from "axios";
import config from "#src/config/config.js";
import DS_DatasetService from "../services/ds_dataset.service.js";

const List = async (req, res) => {
  const { _id } = req.user;
  try {
    const projects = await ProjectService.List(_id);
    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const Get = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await ProjectService.Get(id);
    return res.json(project);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const Create = async (req, res) => {
  const { _id } = req.user;
  try {
    const project = await ProjectService.Create(_id, req.body);
    return res.json(project);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const Update = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    await ProjectService.Update(id, { name });
    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const Delete = async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  try {
    await ProjectService.Delete(_id, id);
    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const UploadFiles = async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  const { type, import_args } = req.body;
  const importArgs = JSON.parse(import_args || "{}");
  try {
    const uploadedFiles = await ProjectService.UploadFiles(
      _id,
      id,
      req.files.files,
      type,
      importArgs
    );
    return res.json(uploadedFiles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
};

const TrainModel = async (req, res) => {
  const { _id } = req.user;
  const { id: projectID } = req.params;

  try {
    const TrainingJob = await ProjectService.TrainModel(projectID);

    res.json(TrainingJob);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

const ListModel = async (req, res) => {
  const { _id } = req.user;
  const { project_id } = req.query;
  try {
    if (project_id) {
      const data = await ProjectService.ListModelByProject(project_id);
      res.json(data);
    } else {
      const data = await ProjectService.ListModelByUser(_id);
      res.json(data);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

const GetDatasets = async (req, res) => {
  const { id } = req.params;
  const page = req.query.page || 1;
  try {
    const defaultPageSize = 24;
    const images = await ImageService.List(id, page, defaultPageSize);
    const labels = await LabelService.List(id);
    const labelResult = labels.map((v, i) => {
      return {
        id: v._id.toString(),
        value: v.name,
      };
    });
    const files = images.data.files.map((value, index) => {
      return value;
    });

    const results = {
      files: files,
      labels: labelResult,
      pagination: images.meta,
    };

    return res.json(results);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const GetFullDatasets = async (req, res) => {
  const { id } = req.params;

  const page = req.query.page || 1;
  try {
    const defaultPageSize = -1;
    const images = await ImageService.List(id, page, defaultPageSize, true);
    const labels = await LabelService.List(id);
    const labelResult = labels.map((v, i) => {
      return {
        id: v._id.toString(),
        value: v.name,
      };
    });
    const files = images.data.files.map((value, index) => {
      return value;
    });
    const results = {
      files: files,
      labels: labelResult,
      pagination: images.meta,
    };
    return res.json(results);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const ExplainInstance = async (req, res) => {
  // const image = req.body.image
  const { id: projectID } = req.params;
  console.log(projectID);
  try {
    const data = await ProjectService.Explain(projectID, req.body);
    return res.json(data);
  } catch (err) {
    console.log(err);
  }
};

const AutoLabeling = async (req, res) => {
  const { id } = req.params;
  console.log("project id", id, "auto labeling");
  try {
    const result = await ProjectService.AutoLabeling(id);
    if (result) return res.status(200).json(result);
    return res.status(204).json(result);
  } catch (error) {
    return "error";
  }
};

const SetLabelConfig = async (req, res) => {
  const { id } = req.params;
  const label_config = req.body;
  try {
    const result = await DS_DatasetService.SetLabelConfig(id, label_config);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const GetLabelConfig = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await DS_DatasetService.GetLabelConfig(id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const GetDataset_Preview = async (req, res) => {
  const { id } = req.params;
  const page = req.query.page || 1;
  const pageSize = req.query.pageSize || 12;
  const exclude_non_annotated = req.query.exclude_non_annotated || true;
  try {
    const data = await DS_DatasetService.GetDataset_Preview(
      id,
      page,
      pageSize,
      exclude_non_annotated
    );
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const GetDataset_Labeling = async (req, res) => {
  const { id } = req.params;
  const batchSize = req.query.batchSize || 50;
  try {
    const data = await DS_DatasetService.GetDataset_Labeling(id, batchSize);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const GetDataset_Info = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await DS_DatasetService.GetDataset_Info(id);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const SetAnnotation = async (req, res) => {
  const { id, task_id } = req.params;
  const annotation = req.body;

  try {
    const data = await DS_DatasetService.SetAnnotation(id, task_id, annotation);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const SetPrediction = async (req, res) => {
  const { id, task_id } = req.params;
  const prediction = req.body;

  try {
    const data = await DS_DatasetService.SetPrediction(id, task_id, prediction);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const TrainCloudModel = async (req, res) => {
  //   const { _id } = req.user;
  const { id: projectID } = req.params;
  const { dataset, instanceInfo } = req.body;

  try {
    const TrainingJob = await ProjectService.TrainCloudModel(
      projectID,
      dataset,
      instanceInfo
    );

    res.json(TrainingJob);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

const SendTargetColumn = async (req, res) => {
  const { id } = req.params; // projectID
  const targetColumn = req.body.targetCol;
  const imgColumn = req.body.imgCol;
  const textColumns = req.body.textCols;
  const datasetID = req.body.datasetID;

  if (!id || !datasetID || !targetColumn) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await ProjectService.SendTargetColumn(
      id,
      datasetID,
      targetColumn,
      imgColumn,
      textColumns
    );
    res.status(200).send("Target column sent successfully");
  } catch (error) {
    console.error("Error in SendTargetColumn:", error);
    return res.status(500).json({ error: error.message });
  }
};

const ProjectController = {
  List,
  Get,
  Create,
  Update,
  Delete,
  UploadFiles,
  TrainModel,
  ListModel,
  GetDatasets,
  ExplainInstance,
  AutoLabeling,
  GetFullDatasets,
  SetLabelConfig,
  GetLabelConfig,
  GetDataset_Preview,
  GetDataset_Labeling,
  GetDataset_Info,
  SetAnnotation,
  SetPrediction,
  TrainCloudModel,
  SendTargetColumn,
};

export default ProjectController;
