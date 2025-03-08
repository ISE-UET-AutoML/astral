/* -------------------Old Code of Minh --------------------- */

import axios from "axios";
import config from "../../../config/config.js";
import Dataset from "#api/models/dataset.model.js";
import Label from "#api/models/label.model.js";
import DS_DatasetService from "#api/services/ds_dataset.service.js";

const CreateClassificationDataset = async (req, res) => {
  const targetSize = 224;
  const { id } = req.params;
  try {
    const dataset = await Dataset.findOne({ project_id: id });
    const labels = await Label.find({ project_id: id });
    const tfrecordDatasetURL = `${config.storageBucketURL}/images/${id}/tfrecords-jpeg-${targetSize}x${targetSize}/`;
    const classes = labels.map((label) => label.name);

    await axios.post(`${config.mlServiceAddr}/clf/dataset`, {
      gcs_pattern: dataset.base_url,
      gcs_output: tfrecordDatasetURL,
      classes,
    });

    dataset.train_url = `${tfrecordDatasetURL}*.tfrec`;
    await dataset.save();
    return res.json({ message: "Dataset created successfully" });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const CreateLabelDataset = async (req, res) => {
  const { id } = req.params;
  const result = await DatasetService.createLabelDataset(id, req.body);
  if (result) {
    return res.json(result);
  } else return res.json({ message: "Label created faild" });
};

const LabelData = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await DS_DatasetService.labelData(id, req.body);
    return res.json(result);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/* -------------------Old Code of Minh --------------------- */

import DatasetService from "../services/dataset.service.js";

const List = async (req, res) => {
  const { _id } = req.user; // userID
  try {
    const datasets = await DatasetService.List(_id);
    return res.json(datasets);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const Create = async (req, res) => {
  console.log("Create Dataset from FE", req.body);

  const { _id } = req.user; // userID

  try {
    const dataset = await DatasetService.Create(_id, req.body, req.files.files);

    return res.status(201).json(dataset);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const Get = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Take dataset and files from Dataset Service
    const { dataset, files } = await DatasetService.Get(id);

    if (!dataset || !files) {
      return res.status(404).json({ error: "Dataset or files not found" });
    }

    return res.status(200).json({ dataset, files });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const GetTen = async (req, res) => {
  const { id } = req.params; // datasetID

  try {
    // 1. Take dataset and files from Dataset Service
    const { files } = await DatasetService.GetTen(id);

    if (!files) {
      return res.status(404).json({ error: "Files not found" });
    }

    return res.status(200).json({ files });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// TODO: Unfinish to call Label studio
const DeleteObjects = async (req, res) => {
  const { id } = req.params; // datasetID
  const { objects } = req.body;

  //Convert String to Array
  const objectsArray = JSON.parse(objects);

  // Delete selected Objects

  res.status(200).send("Objects deleted successfully");
};

const AddNewFiles = async (req, res) => {
  const { id } = req.params; // DatasetID

  try {
    const dataset = await DatasetService.AddNewFiles(id, req.files.files);

    return res.status(201).json(dataset);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const Preview = async (req, res) => {
  const datasetID = req.params.id;
  const size = parseInt(req.query.size, 10) || 10;

  try {
    // 1. Take dataset and files from Dataset Service
    const { dataset, files } = await DatasetService.Preview(datasetID, size);

    if (!dataset || !files) {
      return res.status(404).json({ error: "Dataset or files not found" });
    }

    return res.status(200).json({ dataset, files });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const DatasetController = {
  CreateClassificationDataset,
  CreateLabelDataset,
  LabelData,
  Create,
  List,
  Get,
  GetTen,
  DeleteObjects,
  AddNewFiles,
  Preview,
};

export default DatasetController;
