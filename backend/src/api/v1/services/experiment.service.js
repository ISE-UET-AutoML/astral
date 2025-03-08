import axios from "axios";
import config from "#src/config/config.js";
import Experiment from "#api/models/experiment.model.js";
import MLModel from "#api/models/mlmodel.model.js";
import User from "#api/models/user.model.js";
import Project from "#api/models/project.model.js";
import { ExperimentStatuses } from "../data/constants.js";
import LabelService from "./label.service.js";
import ProjectService from "./project.service.js";
import RunService from "./run.service.js";
import { fetchWithTimeout } from "#api/utils/timeout.js";
import CloudStorageService from "./cloud_storage.service.js";

const TIMEOUT_SEC = 600000;

const Create = async ({ experiment_name, project_id, max_training_time }) => {
  try {
    await ProjectService.Get(project_id);
    const experiment = new Experiment({
      name: experiment_name,
      project_id,
      max_training_time,
    });
    await experiment.save();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Get = async (id) => {
  try {
    const experiment = await Experiment.findOne({ _id: id });
    if (!experiment) {
      throw new Error("Experiment does not exist");
    }

    return experiment;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const GetTrainingProgress = async (name) => {
  try {
    const experiment = await Experiment.findOne({ name });
    if (!experiment) {
      throw new Error("Experiment does not exist");
    }
    const task_id = name;
    const reply = await config.redisClient.get(`${task_id}`);

    console.log(task_id);
    const payload = {
      task_id: task_id,
      instance_info: JSON.parse(reply),
    };

    const { data } = await axios.post(
      `${config.mlServiceAddr}/model_service/train/training_progress`,
      payload
    );

    console.log("data train", data);

    experiment.progress = data;
    return { experiment, trainInfo: data };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const GetDeployProgress = async (experiment_name) => {
  try {
    const experiment = await Experiment.findOne({ experiment_name });
    console.log(experiment_name);
    if (!experiment) {
      throw new Error("Experiment does not exist");
    }
    const task_id = experiment_name;
    const reply = await config.redisClient.get(`${task_id}`);

    if (!reply) {
      return { experiment, deployInfo: { status: "OFFLINE" } };
    }

    console.log(task_id);
    const payload = {
      task_id: task_id,
      instance_info: JSON.parse(reply),
    };

    const { data } = await axios.post(
      `${config.mlServiceAddr}/model_service/train/deploy_progress`,
      payload
    );

    console.log("deploy progress", data);

    experiment.progress = data;
    return { experiment, deployInfo: data };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getAllExperiments = async (projectID) => {
  try {
    const experiments = await Experiment.find({ project_id: projectID });
    if (!experiments || experiments.length == 0) {
      throw new Error("Project does not has any experiment");
    }
    return experiments;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const DeployModel = async (experimentName, experimentStatus) => {
  try {
    const experiment = await Experiment.findOne({ name: experimentName });
    if (!experiment) {
      throw new Error("Experiment does not exist");
    }
    const projectID = experiment.project_id;
    const project = await Project.findOne({ _id: projectID });
    const user = await User.findOne({ _id: project.author });

    if (experimentStatus == ExperimentStatuses.DONE) {
      const model = new MLModel({
        name: "model_" + experimentName,
        project_id: projectID,
        author_id: project.author,
        url: "not implemented",

        userEmail: user.email.split("@")[0],
        projectName: projectID,
        runID: experimentName,
        experimentID: experimentName,
      });
      await model.save();
    }

    // TODO: delete instance once finish training

    //? temporary save model in experiment

    await Experiment.findOneAndUpdate(
      { name: experimentName },
      { status: experimentStatus }
    );

    // get instance info
    // const reply = await config.redisClient.get(`${experimentName}`);

    // const res_response = await axios.delete(
    //   `${config.resourceServiceAddr}/instances/${JSON.parse(reply).id}`
    // );

    // if (res_response.status !== 200) {
    //   throw new Error("Call resource to delete instance info failed");
    // }

    // console.log("Delete instance sucessfully");
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const GetModel = async (experimentName) => {
  try {
    const experiment = await Experiment.findOne({ name: experimentName });
    if (!experiment) {
      throw new Error("Experiment does not exist");
    }
    if (experiment.status != ExperimentStatuses.DONE) {
      throw new Error("Experiment is running or failed");
    }
    const model = await MLModel.findOne({ name: "model_" + experimentName });

    if (!model) {
      throw new Error("model not found: " + "model_" + experimentName);
    }
    return model;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// DEPRICATED
const OldPredict = async (experimentName, formData) => {
  // temporary ml_service prediction
  if (formData.task == "TABULAR_CLASSIFICATION") {
    const tempFormData = new FormData();
    tempFormData.append("userEmail", formData.userEmail);
    tempFormData.append("projectName", formData.projectName);
    tempFormData.append("runName", formData.runName);
    tempFormData.append("data_path", formData.dataPath);
    const url = `${config.mlServiceAddr}/model_service/train/tabular_classification/temp_predict`;
    const options = {
      method: "POST",
      body: tempFormData, // chua co
    };
    return fetchWithTimeout(url, options, 120000);
  }
};

// DEPRICATED
const OldExplain = async (experimentName, formData) => {
  if (formData.task == "TABULAR_CLASSIFICATION") {
    const tempFormData = new FormData();
    tempFormData.append("userEmail", formData.userEmail);
    tempFormData.append("projectName", formData.projectName);
    tempFormData.append("runName", formData.runName);
    tempFormData.append("data_path", formData.dataPath);
    const url = `${config.mlServiceAddr}/model_service/train/tabular_classification/explain`;
    const options = {
      method: "POST",
      body: tempFormData, // chua co
    };
    return fetchWithTimeout(url, options, 60000);
  }
};

const Predict = async (experimentName, formData, deployUrl = null) => {
  if (!deployUrl) {
    deployUrl = config.inferenceServiceAddr;
  }
  const reply = await config.redisClient.get(`${experimentName}`);
  const instance_info = JSON.parse(reply);

  const url = `http://${instance_info.public_ip}:${instance_info.deploy_port}/predict`;
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  };


  if (formData.task === "TABULAR_CLASSIFICATION") {
    const project = await Project.findOne({ _id: formData.projectName });
    const dataset_id = project.ds_dataset;

    const dataset_url = await CloudStorageService.getPresignedURL(dataset_id);

    const response = await axios.post(
      `${config.monitoringServiceAddr}/detect_drift`,
      {
        reference_data_url: dataset_url,
        current_data_url: formData.tab_file_path,
        label_column: project.target_column,
      }
    );

    if (response.status === 200) {
      const data = response.data;
      console.log(data);
    } else {
      console.error("Drift detection failed");
    }
  }

  return fetchWithTimeout(url, options, TIMEOUT_SEC);
};

const Explain = async (experimentName, formData, deployUrl = null) => {
  if (!deployUrl) {
    deployUrl = config.inferenceServiceAddr;
  }

  const reply = await config.redisClient.get(`${experimentName}`);
  const instance_info = JSON.parse(reply);

  const url = `http://${instance_info.public_ip}:${instance_info.deploy_port}/explain`;
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  };

  return fetchWithTimeout(url, options, TIMEOUT_SEC);
};

const GetTrainingGraph = async (experimentName) => {
  try {
    // TODO: get training graph from ml service
    const model = await GetModel(experimentName);
    const project = await Project.findOne({ _id: model.project_id });

    const userEmail = model.userEmail;
    const projectName = model.projectName;
    const runName = "ISE"; // fixed
    const task_id = experimentName; // 'lastest' to return lastest experiment or use experiment id to return specific experiment

    let url = `${config.mlServiceAddr}/model_service/train/fit_history/?userEmail=${userEmail}&projectName=${projectName}&runName=${runName}&task_id=${task_id}`;
    if (project.type.includes("TABULAR")) {
      url = `${config.mlServiceAddr}/model_service/train/tabular_model_ranking/?userEmail=${userEmail}&projectName=${projectName}&runName=${runName}&task_id=${task_id}`;
    }

    // const req =
    //   "http://localhost:8670/model_service/train/fit_history/?userEmail=test-automl&projectName=4-animal&runName=ISE&task_id=lastest";
    const res = await axios.get(url, { accept: "application/json" });
    // const bestRun = await RunService.GetBestExperimentRun(experiment._id)

    // console.log(res.data)
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const SaveBestModel = async (userID, experimentName) => {
  try {
    const experiment = await Experiment.findOne({ name: experimentName });
    if (!experiment) {
      throw new Error("Experiment does not exist");
    }

    const bestRun = await RunService.GetBestExperimentRun(experiment._id);

    const model = new MLModel({
      name: "Untitled Model 1",
      url: bestRun.best_model_url,
      project_id: experiment.project_id,
      author_id: userID,
    });
    await model.save();
    return model;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Delete = async (name) => {
  try {
    const experiment = await Experiment.findOne({ name: name });
    const project = await Project.findOne({ _id: experiment.project_id });
    const user = await User.findOne({ _id: project.author });

    var formdata = new FormData();
    formdata.append("user_name", user.email.split("@")[0]);
    formdata.append("project_id", project._id);
    formdata.append("experiment_name", name);

    try {
      await axios.post(
        `${config.mlServiceAddr}/model_service/delete_project`,
        formdata
      );
    } catch (error) {
      console.error(error);
      console.error(
        `delete experiment _${name}_ at mls failed, possibly because the mls server is down`
      );
    }
    await Experiment.findOneAndDelete({ name: name });
    await MLModel.findOneAndDelete({ name: "model_" + name });
    //TODO: delete experiment at ml service
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const DeleteByProject = async (projectID) => {
  try {
    const project = await Project.findOne({ _id: projectID });
    const user = await User.findOne({ _id: project.author });

    var formdata = new FormData();
    formdata.append("user_name", user.email.split("@")[0]);
    formdata.append("project_id", project._id);

    //TODO: delete project at ml service
    try {
      await axios.post(
        `${config.mlServiceAddr}/model_service/delete_project`,
        formdata
      );
    } catch (error) {
      console.error(error);
      console.error(
        `delete project _${projectID}_ at mls failed, possibly because the mls server is down`
      );
    }
    await Experiment.deleteMany({ project_id: projectID });
    await MLModel.deleteMany({
      project_id: projectID,
    });
    //TODO: delete experiment at ml service
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const DeployCloudModel = async (experiment_name, deploy_type) => {
  try {
    const experiment = await Experiment.findOne({ name: experiment_name });
    const project = await Project.findOne({ _id: experiment.project_id });
    const user = await User.findOne({ _id: project.author });

    const resource_payload = {
      training_time: 60,
      presets: "medium_quality",
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

    await config.redisClient.set(
      `${experiment_name}`,
      JSON.stringify(instance_info)
    );

    const payload = {
      username: user.email.split("@")[0],
      task: project.type,
      project_id: project._id,
      task_id: experiment_name,
      instance_info: instance_info,
      deploy_type: deploy_type,
    };

    const response = await axios.post(
      `${config.mlServiceAddr}/model_service/train/v2/generic_cloud_deploy`,
      payload
    );

    if (response.status !== 200) {
      throw new Error("Call ml-service deploy failed");
    }
    const data = response.data;
    config.redisClient.set(
      `instance_info_${experiment_name}`,
      JSON.stringify(instance_info)
    );
    data.url = `http://${instance_info.public_ip}:${instance_info.deploy_port}`;
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const ExperimentService = {
  Create,
  getAllExperiments,
  Get,
  GetTrainingProgress,
  DeployModel,
  GetModel,
  GetTrainingGraph,
  SaveBestModel,
  Delete,
  DeleteByProject,
  Predict,
  Explain,
  Get,
  DeployCloudModel,
  GetDeployProgress,
};
export default ExperimentService;
