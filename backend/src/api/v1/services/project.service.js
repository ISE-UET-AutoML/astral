import axios from "axios";
import config from "#src/config/config.js";
import Project from "#api/models/project.model.js";
import User from "#api/models/user.model.js";
import Image from "#api/models/image.model.js";
import Experiment from "#api/models/experiment.model.js";
import {
  ProjectCodePrefixes,
  PROJECT_CODE_LEN,
  ProjectTypes,
  UploadTypes,
} from "../data/constants.js";
import { randomString } from "#api/utils/string.util.js";
import StorageService from "./storage.service.js";
import LabelService from "./label.service.js";
import DatasetService from "./dataset.service.js";
import ImageService from "./image.service.js";
import ExperimentService from "./experiment.service.js";
import MLModel from "../models/mlmodel.model.js";
import DS_Dataset from "../models/ds_dataset.model.js";
import DS_DatasetService from "./ds_dataset.service.js";
import CloudStorageService from "./cloud_storage.service.js";
import fs from "fs";

const List = async (userID) => {
  try {
    const projects = await Project.find({ author: userID }).sort("-createdAt");

    return projects;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Get = async (projectID) => {
  try {
    const project = await Project.findOne({ _id: projectID });
    if (!project) {
      throw new Error("Project does not exist");
    }
    return project;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Create = async (
  userID,
  { name, description, expectation_accuracy, type, metrics_explain }
) => {
  if (!ProjectTypes.hasOwnProperty(type)) {
    return res.status(400).json({ error: "Project type invalid" });
  }

  try {
    const existingProject = await Project.findOne({
      name: name,
      author: userID,
    });

    console.log(existingProject);

    if (existingProject != undefined) {
      throw new Error("Project already exist");
    }

    const projectCode = generateProjectCode(type);

    const project = new Project({
      name,
      description,
      expectation_accuracy,
      type,
      code: projectCode,
      author: userID,
      img_column: null,
      target_column: null,
      metrics_explain,
    });

    const ds_dataset = await DS_DatasetService.Create(
      userID,
      project._id,
      type
    );

    await project.save();

    return project;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Update = async (projectID, updateInfo) => {
  try {
    const project = await Project.findOne({ _id: projectID });
    if (project == undefined) {
      throw new Error("Project does not exist");
    }

    if (updateInfo.name) {
      const existingProject = await Project.findOne({ _id: projectID, name });
      if (existingProject != undefined) {
        throw new Error("Project name is already taken");
      }
    }
    await project.updateOne(updateInfo);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Delete = async (userID, projectID) => {
  //TODO: Delete label studio project
  try {
    const project = await Project.findOne({ _id: projectID, author: userID });
    if (project == undefined) {
      throw new Error("Project does not exist");
    }

    await ImageService.DeleteByProject(projectID);
    await DS_DatasetService.Delete(projectID);
    await ExperimentService.DeleteByProject(projectID);

    //* delete public project folder
    fs.rm(
      `public/media/upload/${projectID}`,
      { recursive: true, force: true },
      (error) => {
        if (error) console.error(error);
      }
    );
    await Project.deleteOne({ _id: projectID });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const UploadFiles = async (
  userID,
  projectID,
  files,
  uploadType,
  import_args = null
) => {
  try {
    const project = await Project.findOne({ _id: projectID }).populate(
      "author"
    );
    if (project == undefined) {
      throw new Error("Project not found");
    }
    // Shallow compare because project.author._id is ObjectId, _id is string
    if (project.author._id != userID) {
      throw new Error("Forbidden");
    }

    if (!files) {
      throw new Error("Files can not be empty");
    }

    const uploadedFiles = await StorageService.UploadLocalFiles(
      project._id,
      files,
      uploadType,
      import_args
    );

    return uploadedFiles;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const TrainModel = async (projectID) => {
  try {
    const project = await Project.findOne({ _id: projectID });
    const user = await User.findOne({ _id: project.author });
    const ds_dataset = await DS_DatasetService.Get(projectID);

    const userEmail = user.email.split("@")[0];
    const presets = "high_quality";
    const payload = {
      userEmail: userEmail,
      projectId: projectID,
      ds_projectId: ds_dataset.ds_project_id,
      runName: "ISE",
      training_time: 600,
      presets: presets,
      //add dataset config
    };
    let service_route = "";
    switch (project.type) {
      case ProjectTypes.IMAGE_CLASSIFICATION:
        service_route = `${config.mlServiceAddr}/model_service/train/v2/image_classification`;
        break;
      case ProjectTypes.TEXT_CLASSIFICATION:
        service_route = `${config.mlServiceAddr}/model_service/train/v2/text_prediction`;
        break;
      case ProjectTypes.TABULAR_CLASSIFICATION:
        service_route = `${config.mlServiceAddr}/model_service/train/v2/tabular_classification`;
        break;
      case ProjectTypes.MULTIMODAL_CLASSIFICATION:
        service_route = `${config.mlServiceAddr}/model_service/train/v2/multimodal_classification`;
        break;
      default:
        throw new Error(
          "Project type currently not supported: " + project.type
        );
    }

    const respone = await axios.post(service_route, payload);
    if (respone.status !== 200) {
      throw new Error("Call ml-service training failed");
    }
    const data = respone.data;
    const task_id = data.task_id;
    ExperimentService.Create({
      experiment_name: task_id,
      project_id: projectID,
    });
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const ListModelByUser = async (userID) => {
  try {
    const models = await MLModel.find({ author_id: userID }).sort("-createdAt");
    return models;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const ListModelByProject = async (projectID) => {
  try {
    const models = await MLModel.find({ project_id: projectID }).sort(
      "-createdAt"
    );
    console.log("models", models);
    return models;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const generateProjectCode = (projectType) => {
  const prefix = ProjectCodePrefixes[projectType];
  const code = randomString(PROJECT_CODE_LEN);
  return `${prefix}-${code}`;
};

const AutoLabeling = async (project_id) => {
  const project = await Project.findOne({ _id: project_id });
  const images = await ImageService.List(project_id, -1, -1, true);
  const body = {
    project: project,
    data: images,
  };
  const labelData = await axios.post(config.dataServiceIp + "/datasets", body);

  if (labelData.data === "error") {
    return;
  }
  await ImageService.UpdateLabelPrediction(labelData.data);
  return labelData.data;
};

const TrainCloudModel = async (projectID, dataset, instanceInfo) => {
  console.log("instanceInfo", instanceInfo);
  console.log("dataset", dataset);

  try {
    // return { task_id: "abcd" };
    const project = await Project.findOne({ _id: projectID });
    console.log("project", project);
    const user = await User.findOne({ _id: project.author });
    console.log(user);
    const ds_dataset = dataset;
    const username = user.email.split("@")[0];

    const presets = "medium_quality";

    // get dataset info: actual data + labels

    const dataset_url = await CloudStorageService.getPresignedURL(
      ds_dataset.title
    );

    // const dataset_label_url = `${config.dataServiceAddr}/ls/task/${ds_dataset.ds_project_id}/export_for_training`;
    const dataset_label_url = `${config.dataServicePublicAddr}/ls/task/${ds_dataset.ds_project_id}/export_for_training`;
    const target_column = project.target_column || "label";
    const image_column = project.img_column || "";

    console.log(target_column);
    console.log(image_column);

    console.log("Dataset Label URL", dataset_label_url);

    // get instance info
    const resource_payload = {
      training_time: instanceInfo.trainingTime * 3600,
      presets: presets,
      task: project.type,
    };

    const res_response = await axios.post(
      `${config.resourceServiceAddr}/select_instance`,
      resource_payload
    );

    if (res_response.status !== 200) {
      throw new Error("Call resource to get instance info failed");
    }

    const instance_info = res_response.data;

    console.log("Instance Info", instance_info);

    const payload = {
      username: username,
      project_id: projectID,
      dataset_url: dataset_url,
      task: project.type,
      dataset_label_url: dataset_url,
      training_time: instanceInfo.trainingTime * 3600,
      presets: presets,
      instance_info: instance_info,
      target_column: target_column,
      image_column: image_column,
      //add dataset config
    };

    if (project.type === "IMAGE_CLASSIFICATION") {
      payload.dataset_label_url = dataset_label_url;
    }

    const service_route = `${config.mlServiceAddr}/model_service/train/v2/generic_cloud_training`;

    const response = await axios.post(service_route, payload);
    if (response.status !== 200) {
      throw new Error("Call ml-service training failed");
    }

    const data = response.data;
    const task_id = data.task_id;

    ExperimentService.Create({
      experiment_name: task_id,
      project_id: projectID,
      max_training_time: instanceInfo.trainingTime * 3600,
    });

    await config.redisClient.set(task_id, JSON.stringify(instance_info));

    // const shutdown_response = await axios.post(
    //   `${config.resourceServiceAddr}/shutdown_instance`,
    //   { id: instance_info.id }
    // );

    // if (shutdown_response.status !== 200) {
    //   console.log("Call resource to shutdown instance failed");
    // } else {
    //   console.log("Instance shutdown successfully");
    // }

    return { data, instance_info };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const SendTargetColumn = async (
  projectID,
  datasetID,
  targetColumn,
  imgColumn,
  textColumns
) => {
  if (!projectID || !datasetID || !targetColumn) {
    throw new Error("Missing required fields");
  }

  const project = await Project.findOne({ _id: projectID });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.type === "MULTIMODAL_CLASSIFICATION" && imgColumn === null) {
    throw new Error("Image column is required for multimodal classification");
  }

  project.target_column = targetColumn;
  project.text_columns = textColumns;
  project.img_column = imgColumn;
  project.ds_dataset = datasetID;

  await project.save();

  console.log("Updated Target Column:", project.target_column);
  console.log("Updated Text Columns:", project.text_columns);
  console.log("Updated Image Column:", project.img_column);
};

const ProjectService = {
  List,
  Get,
  Create,
  Update,
  Delete,
  UploadFiles,
  TrainModel,
  ListModelByUser,
  ListModelByProject,
  AutoLabeling,
  TrainCloudModel,
  SendTargetColumn,
};

export default ProjectService;
