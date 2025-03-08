import ExperimentService from "../services/experiment.service.js";
import ProjectService from "../services/project.service.js";
import StorageService from "../services/storage.service.js";
import DS_DatasetService from "../services/ds_dataset.service.js";
import { extractDataFromCSV } from "../utils/csv_utils.js";

const Create = async (req, res) => {
  return res.status(400).json({ message: "Depricated" });
  // const { experiment_name, project_id } = req.body
  // try {
  //   const experiment = await ExperimentService.Create({ experiment_name, project_id })
  //   const data = await ProjectService.TrainModel(project_id)
  //   console.log('Response when call API train model: ', data)
  //   return res.json(experiment)
  // } catch (error) {
  //   return res.status(500).json({ error: error.message })
  // }
};

const Get = async (req, res) => {
  const { name } = req.query;
  try {
    const experiment = await ExperimentService.GetTrainingProgress(name);

    return res.json(experiment);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const GetDeployProgress = async (req, res) => {
  const { experiment_name } = req.query;
  try {
    const experiment = await ExperimentService.GetDeployProgress(
      experiment_name
    );

    return res.json(experiment);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllExperiments = async (req, res) => {
  const { projectID } = req.query;

  try {
    const experiment = await ExperimentService.getAllExperiments(projectID);
    return res.json({ data: experiment });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const DeployModel = async (req, res) => {
  const { experiment_name, experiment_status } = req.query;
  try {
    const data = await ExperimentService.DeployModel(
      experiment_name,
      experiment_status
    );
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const Predict = async (req, res) => {
  const { experiment_name } = req.query;
  try {
    // Append other fields from the models
    const data_info = await ExperimentService.GetModel(experiment_name);

    const deploy_url = req.body.deploy_url;

    // Append files to the form data_info
    const file_paths = await StorageService.savePredictFileToLocal(
      req.files.files,
      data_info.projectName
    );
   
    console.log("File paths: ", file_paths);

    const formData = {
      userEmail: data_info.userEmail,
      projectName: data_info.projectName,
      runName: data_info.runID,
      task: req.body.task,
      task_id: experiment_name,
    };

    //TODO: Fix hard code for text classificcation
    switch (req.body.task) {
      case "IMAGE_CLASSIFICATION":
        formData.images = file_paths;
        break;
      case "TEXT_CLASSIFICATION":
        formData.text_file_path = file_paths[0];
        const project_info = await ProjectService.Get(data_info.projectName);
        formData.text_col = project_info.text_columns[0];
        break;
      case "TABULAR_CLASSIFICATION":
        formData.tab_file_path = file_paths[0];
        break;
      case "MULTIMODAL_CLASSIFICATION":
        formData.tab_file_path = file_paths[0];

        // multimodal need extra info about the column types
        const project = await ProjectService.Get(data_info.projectName);

        var img_column = project.img_column;
        formData.column_types = {
          [img_column]: "IMG",
        };
        break;
    }

    console.log("Form data: ", formData);

    const data = await ExperimentService.Predict(
      experiment_name,
      formData,
      deploy_url
    );

    // Temporary solution
    if (req.body.task === "TABULAR_CLASSIFICATION") {
      data.data_path = file_paths[0];
    }

    console.log(data);

    return res.json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const Explain = async (req, res) => {
  const { experiment_name } = req.query;
  try {
    // Append other fields from the models
    const data_info = await ExperimentService.GetModel(experiment_name);

    const deploy_url = req.body.deploy_url;
    // Append files to the form data_info
    let file_paths = [];
    if (req.files) {
      file_paths = await StorageService.savePredictFileToLocal(
        req.files.files,
        data_info.projectName
      );
      console.log("File paths: ", file_paths);
    }

    // let file_paths = file_paths.map((url) =>
    //   url.replace("localhost", "112.137.129.161")
    // );

    const formData = {
      userEmail: data_info.userEmail,
      projectName: data_info.projectName,
      runName: data_info.runID,
      task: req.body.task,
      task_id: experiment_name,
    };

    console.log("type", req.body.task);
    switch (req.body.task) {
      case "IMAGE_CLASSIFICATION":
        formData.image = file_paths[0];
        formData.method = "lime";
        break;

      case "TEXT_CLASSIFICATION":
        formData.text = req.body.text;
        formData.method = "shap";
        break;

      case "TABULAR_CLASSIFICATION":
        const data_path = await extractDataFromCSV(
          req.body.data_path,
          req.body.row_indexes,
          data_info.projectName,
          res
        );
        console.log(data_path);
        formData.tab_explain_file_path = data_path;
        formData.method = "shap";
        break;

      case "MULTIMODAL_CLASSIFICATION":
        const multimodal_data_path = await extractDataFromCSV(
          req.body.data_path,
          req.body.row_indexes,
          data_info.projectName
        );
        console.log(multimodal_data_path);
        formData.tab_explain_file_path = multimodal_data_path;

        // multimodal need extra info about the column types
        const dataset_info = await DS_DatasetService.GetDataset_Info(
          data_info.projectName
        );
        formData.column_types = dataset_info.column_types;
        formData.method = "shap";
        break;

      default:
        console.log("Type is invalid");
        return res.json({
          status: "fail",
        });
    }

    console.log("Form data: ", formData);
    const data = await ExperimentService.Explain(
      experiment_name,
      formData,
      deploy_url
    );

    console.log(data);

    return res.json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const GetTrainingGraph = async (req, res) => {
  const { experiment_name } = req.query;
  try {
    const data = await ExperimentService.GetTrainingGraph(experiment_name);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const SaveBestModel = async (req, res) => {
  const { _id } = req.user;
  const { experiment_name } = req.query;
  try {
    const data = await ExperimentService.SaveBestModel(_id, experiment_name);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const GetModel = async (req, res) => {
  const { experimentName: experiment_name } = req.params;

  try {
    const data = await ExperimentService.GetModel(experiment_name);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const Delete = async (req, res) => {
  const { experimentName: experiment_name } = req.params;
  try {
    await ExperimentService.Delete(experiment_name);
    return res.json({ message: `experiment _${experiment_name}_ deleted` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const DeployCloudModel = async (req, res) => {
  const { experiment_name, deploy_type } = req.query;
  try {
    const data = await ExperimentService.DeployCloudModel(
      experiment_name,
      deploy_type
    );
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const GetDeployStatus = async (req, res) => {
  const { experiment_name } = req.query;
  try {
    const data = await ExperimentService.GetDeployStatus(experiment_name);
    return res.json(data);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const ExperimentController = {
  Create,
  getAllExperiments,
  DeployModel,
  GetTrainingGraph,
  SaveBestModel,
  GetModel,
  Delete,
  Predict,
  Get,
  Explain,
  DeployCloudModel,
  GetDeployProgress,
};

export default ExperimentController;
