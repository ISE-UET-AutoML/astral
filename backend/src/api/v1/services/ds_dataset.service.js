import DS_Dataset from "../models/ds_dataset.model.js";
import axios from "axios";
import config from "#src/config/config.js";
import ProjectService from "./project.service.js";

const Create = async (userID, project_id, type) => {
  try {
    const existingDataset = await DS_Dataset.findOne({
      project_id: project_id,
    });
    if (existingDataset) {
      throw new Error("Dataset already exist");
    }

    //TODO: Change project_name
    const body = {
      project_name: "string",
      project_type: type,
    };

    const { data } = await axios.post(
      `${config.dataServiceAddr}/ls/project/create`,
      body
    );

    const ds_project_id = data.id;

    const dataset = new DS_Dataset({
      project_id: project_id,
      author: userID,
      ds_project_id: ds_project_id,
    });
    await dataset.save();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Get = async (project_id) => {
  try {
    const dataset = await DS_Dataset.findOne({ project_id: project_id });
    if (!dataset) {
      throw new Error("Dataset does not exist");
    }
    return dataset;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Delete = async (project_id) => {
  try {
    const dataset = await DS_Dataset.findOne({ project_id: project_id });
    if (!dataset) {
      console.log("Dataset does not exist");
      // throw new Error('Dataset does not exist')
      return;
    }
    await axios.delete(
      `${config.dataServiceAddr}/ls/project/${dataset.ds_project_id}/delete`
    );
    await DS_Dataset.deleteOne({ project_id: project_id });
  } catch (error) {
    console.error(error);
    // throw error
  }
};

const SetLabelConfig = async (project_id, label_config) => {
  try {
    const dataset = await DS_Dataset.findOne({ project_id: project_id });
    if (!dataset) {
      throw new Error("Dataset does not exist");
    }

    const body = label_config;

    const { data } = await axios.post(
      `${config.dataServiceAddr}/ls/project/${dataset.ds_project_id}/set_label_config`,
      body
    );

    // console.log(data)
    dataset.label_config = label_config;
    dataset.markModified("label_config");
    await dataset.save();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Use direct dataset instead of project_id
const SetLabelConfigNew = async (dataset, label_config) => {
  try {
    const body = label_config;

    const { data } = await axios.post(
      `${config.dataServiceAddr}/ls/project/${dataset.ds_project_id}/set_label_config`,
      body
    );

    dataset.label_config = label_config;
    dataset.markModified("label_config");
    await dataset.save();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const GetLabelConfig = async (project_id) => {
  try {
    const dataset = await DS_Dataset.findOne({ project_id: project_id });
    if (!dataset) {
      throw new Error("Dataset does not exist");
    }

    const { data } = await axios.get(
      `${config.dataServiceAddr}/ls/project/${dataset.ds_project_id}/get_label_config`
    );
    return data.label_config;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const GetDataset_Preview = async (
  project_id,
  page,
  pageSize,
  exclude_non_annotated = true,
  error_if_not_uploaded = false
) => {
  try {
    const dataset = await DS_Dataset.findOne({ project_id: project_id });
    if (!dataset) {
      throw new Error("Dataset does not exist");
    }
    if (!dataset.uploaded && error_if_not_uploaded) {
      throw new Error("Dataset not uploaded");
    }

    const { data } = await axios.get(
      // `${config.dataServiceAddr}/ls/task/${dataset.ds_project_id}/export_all/?page=${page}&page_size=${pageSize}&exclude_non_annotated=${exclude_non_annotated}`
      `${config.dataServiceAddr}/ls/task/${dataset.ds_project_id}/export_all/?exclude_non_annotated=${exclude_non_annotated}`
    );

    data.project_info.uploaded = dataset.uploaded;
    data.project_info.original_label_column = dataset.original_label_column;

    console.log(data);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const GetDataset_Labeling = async (
  project_id,
  batchSize,
  error_if_not_uploaded = false
) => {
  try {
    const dataset = await DS_Dataset.findOne({ project_id: project_id });
    if (!dataset) {
      throw new Error("Dataset does not exist");
    }
    if (!dataset.uploaded && error_if_not_uploaded) {
      throw new Error("Dataset not uploaded");
    }
    const { data } = await axios.get(
      `${config.dataServiceAddr}/ls/task/${dataset.ds_project_id}/export_for_labeling/?batch_size=${batchSize}`
    );
    data.project_info.uploaded = dataset.uploaded;
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const GetDataset_Info = async (project_id) => {
  try {
    const dataset = await DS_Dataset.findOne({
      project_id,
    });
    if (!dataset) {
      throw new Error("Dataset does not exist");
    }
    return dataset;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const labelData = async (task_id, label) => {
  try {
    const { data } = await axios.post(
      `${config.dataServiceAddr}/ls/task/${task_id}/set_annotation`,
      label
    );
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const SetAnnotation = async (projectID, taskID, annotation) => {
  try {
    const project = await ProjectService.Get(projectID);
    if (!project) {
      throw new Error("Project does not exist");
    }
    if (project.type.includes("CLASSIFICATION")) {
      if (!annotation.choice)
        throw new Error("Choice is required for classification project");
      const { data } = await axios.post(
        `${config.dataServiceAddr}/ls/task/${taskID}/set_annotation`,
        annotation
      );
      return data;
    }
    throw new Error(`Project type ${project.type} is not supported`);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const SetPrediction = async (projectID, taskID, prediction) => {
  try {
    const project = await ProjectService.Get(projectID);
    if (!project) {
      throw new Error("Project does not exist");
    }
    if (project.type.includes("CLASSIFICATION")) {
      if (!prediction.choice)
        throw new Error("Choice is required for classification project");
      const { data } = await axios.post(
        `${config.dataServiceAddr}/ls/task/${taskID}/set_prediction`,
        prediction
      );
      return data;
    }
    throw new Error(`Project type ${project.type} is not supported`);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// get the dataset presign url from s3 bucket
// TODO: implement this route at dataservice
const GetDatasetUrlS3 = async (datasetID) => {};

const DS_DatasetService = {
  Create,
  Get,
  Delete,
  SetLabelConfig,
  SetLabelConfigNew,
  GetLabelConfig,
  GetDataset_Preview,
  GetDataset_Labeling,
  GetDataset_Info,
  labelData,
  SetAnnotation,
  SetPrediction,
  GetDatasetUrlS3,
};

export default DS_DatasetService;
