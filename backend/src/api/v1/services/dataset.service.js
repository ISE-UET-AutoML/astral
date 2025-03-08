import Dataset from "#api/models/dataset.model.js";
import { DatasetTypes } from "../data/constants.js";
import LabelService from "../services/label.service.js";
import { randomString } from "../utils/string.util.js";
import config from "#src/config/config.js";
import axios from "axios";
import { Readable } from "stream";
import csv from "csv-parser";
import iconv from "iconv-lite";
import {
  UploadTypes,
  ALLOWED_FILE_EXTENSIONS,
  GCS_HOST,
  UPLOAD_BATCH_SIZE,
  FILE_NAME_LEN,
} from "../data/constants.js";

/*----------------------<start> Old Code </start>----------------*/
const Upsert = async (dataset) => {
  const upsertDataset = [
    {
      updateOne: {
        filter: { project_id: dataset.project_id, key: dataset.key },
        update: dataset,
        upsert: true,
      },
    },
  ];

  try {
    await Dataset.bulkWrite(upsertDataset);
    const result = await Dataset.findOne({
      project_id: dataset.project_id,
      key: dataset.key,
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const ListByProject = async (projectID) => {
  try {
    const dataset = await Dataset.findOne({
      project_id: projectID,
      type: DatasetTypes.IMAGE_DIRECTORY,
    });
    return dataset;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const DeleteAllByProject = async (projectID) => {
  try {
    await Dataset.deleteMany({ project_id: projectID });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const CreateTFRecordDataset = async (projectID) => {
  try {
    const dataset = await DatasetService.ListByProject(projectID);
    const labelMap = await LabelService.GetLabelMap(projectID);
    const classes = Object.keys(labelMap);
    const experimentName = randomString(10);

    const payload = {
      project_id: projectID,
      experiment_name: experimentName,
      gcs_folder: dataset.pattern,
      gcs_output: `gs://${config.storageBucketName}/datasets/${experimentName}/`,
      dataset_url: `gs://${config.storageBucketName}/datasets/${experimentName}/*.tfrec`,
      target_size: 224,
      classes,
      num_classes: classes.length,
    };

    const { data } = await axios.post(
      `${config.mlServiceAddr}/clf/dataset`,
      payload
    );
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createLabelDataset = async (projectID, labels) => {
  const insertingLabels = labels["label"].map((label) => ({
    project_id: projectID,
    name: label,
  }));
  await LabelService.UpsertAll(projectID, insertingLabels);
  return await LabelService.List(projectID);
};

/*----------------------<end> Old Code </end>----------------*/

import DS_Dataset from "../models/ds_dataset.model.js";
import DS_DatasetService from "./ds_dataset.service.js";
import StorageService from "./storage.service.js";
import CloudStorageService from "./cloud_storage.service.js";
import * as d3 from "d3";

const List = async (userID) => {
  try {
    const datasets = await DS_Dataset.find({ userID }).sort("-createdAt");
    return datasets;
  } catch (error) {
    console.error("Error fetching datasets:", error);
    throw new Error("Unable to fetch datasets");
  }
};

/**
 *
 * @param {string} userID - ID of user
 * @param {Object} reqData - information of Dataset
 * @param {Array} files - uploaded files
 * @returns
 */
const Create = async (userID, reqData, files) => {
  try {
    // 0. Check dataset is exist or not
    const existingDataset = await DS_Dataset.findOne({
      userID: userID,
      bucketName: reqData.bucketName,
      title: reqData.title,
    });

    if (existingDataset) {
      throw new Error("Dataset already exist");
    }

    if (!files) {
      throw new Error("Files can not be empty");
    }

    // 1. Create Dataset

    const body = {
      project_name: reqData.title,
      project_type: reqData.type,
    };

    const { data } = await axios.post(
      `${config.dataServiceAddr}/ls/project/create`,
      body
    );

    const ds_project_id = data.id;

    const dataset = new DS_Dataset({
      userID: userID,
      ds_project_id: ds_project_id,
      title: reqData.title,
      bucketName: reqData.bucketName,
      service: reqData.service,
      isPrivate: reqData.isPrivate,
      isLabeled: reqData.isLabeled,
      type: reqData.type,
      url: reqData.url,
      selectedUrlOption: reqData.selectedUrlOption,
    });

    await dataset.save();

    // 2. Take Labels from Folder and add them to Label Studio

    if (reqData.type === "IMAGE_CLASSIFICATION") {
      // store image labels at data service
      const { validFiles } = await takeLabel(files, reqData.type, dataset);

      await CloudStorageService.uploadZippedFiles(reqData.title, validFiles);
    } else {
      // else push directly to S3 bucket
      await CloudStorageService.uploadZippedFiles(reqData.title, files);
    }

    // if (reqData.type === "MULTIMODAL_CLASSIFICATION") {
    //   await CloudStorageService.uploadZippedFiles(reqData.title, files);
    // } else {
    //   const { validFiles } = await takeLabel(files, reqData.type, dataset);

    //   // 3. Upload Files to Cloud
    //   if (reqData.type === "IMAGE_CLASSIFICATION") {
    //     await CloudStorageService.uploadZippedFiles(reqData.title, validFiles);
    //   }
    // }

    return dataset;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Get = async (datasetID) => {
  try {
    // 1. Find dataset based on datasetID
    const dataset = await DS_Dataset.findOne({ _id: datasetID });

    if (!dataset) {
      throw new Error("Project does not exist");
    }

    let files;

    // 2. Take data from Cloud using object name
    if (dataset.type === "IMAGE_CLASSIFICATION") {
      files = await CloudStorageService.getDataset(
        dataset.bucketName,
        dataset.title
      );

      // 3. Change buffer to base64 and add the data URL prefix if IMG
      const result = files.map((file) => {
        let mimeType = "";
        if (file.fileName.endsWith(".jpg") || file.fileName.endsWith(".jpeg")) {
          mimeType = "image/jpeg";
        } else if (file.fileName.endsWith(".png")) {
          mimeType = "image/png";
        }
        return {
          fileName: file.fileName,
          content: `data:${mimeType};base64,${file.content.toString("base64")}`,
        };
      });
      return { dataset, files: result };
    } else {
      const extractedFiles = await CloudStorageService.getDataset(
        dataset.bucketName,
        dataset.title
      );

      // Đọc CSV từ buffer
      files = await new Promise((resolve, reject) => {
        const results = [];

        // Lấy content từ file đầu tiên trong mảng
        const fileContent = extractedFiles[0]?.content;

        if (!fileContent) {
          return reject(new Error("File content is undefined"));
        }

        // const contentString = iconv.decode(fileContent, "utf8");
        const contentString = iconv.decode(fileContent, "utf-8");

        Readable.from(contentString) // Chuyển buffer thành stream
          .pipe(
            csv({
              skipBOM: true, // Skip BOM (Byte Order Mark) if present
              encoding: "utf8",
              headers: true,
              escape: '"',
              quote: '"',
              ltrim: true,
              rtrim: true,
            })
          )
          .on("data", (row) => {
            // Chuyển đổi các giá trị trong row về Unicode normalized form
            const normalizedRow = {};
            for (const [key, value] of Object.entries(row)) {
              if (typeof value === "string") {
                normalizedRow[key] = value.normalize("NFC");
              } else {
                normalizedRow[key] = value;
              }
            }
            results.push(normalizedRow);
          })
          .on("end", () => {
            resolve(results);
          })
          .on("error", (err) => {
            reject(err);
          });
      });
    }

    return { dataset, files };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const GetTen = async (datasetID) => {
  try {
    // 1. Find dataset based on datasetID
    const dataset = await DS_Dataset.findOne({ _id: datasetID });

    if (!dataset) {
      throw new Error("Project does not exist");
    }

    let files;

    const response = await axios.get(
      `${config.dataServiceAddr}/ls/task/${
        dataset.ds_project_id
      }/export_ten/?page=${1}&page_size=${10}&exclude_non_annotated=${true}`
    );

    files = response.data;
    files.project_info.uploaded = dataset.uploaded;
    files.project_info.original_label_column = dataset.original_label_column;

    console.log(files);

    return { files };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Check type of dataset
const takeLabel = async (files, type, dataset) => {
  switch (type) {
    case "IMAGE_CLASSIFICATION":
      return await imgClassLabel(files, dataset);

    case "TEXT_CLASSIFICATION":
      return await textClassLabel(files, dataset);

    case "TABULAR_CLASSIFICATION":
      return await tabularClassLabel(files, dataset);

    default:
      throw new Error("Unknown Type");
  }
};

const imgClassLabel = async (files, dataset) => {
  try {
    // 1. Parse Files and take labels
    const { labels, validFiles } = await StorageService.parseAndValidateFiles(
      files
    );

    validFiles.forEach((file) => {
      var paths = file.name.split("/");
      file.name = paths[paths.length - 1];
      file.label = paths[paths.length - 2];
    });

    // 2. Set label config and send it to Label Studio
    if (labels.length > 0)
      await DS_DatasetService.SetLabelConfigNew(dataset, {
        label_choices: labels,
      });

    let datasetSend = [];
    validFiles.forEach((file) => {
      if (labels.length > 0)
        datasetSend.push({
          image: file.name,
          label: file.label,
        });
      else
        datasetSend.push({
          image: file.name,
        });
    });

    const body = {
      "attribute_type": {
        "image": "IMG",
      },
      data: datasetSend,
      label_field: ["label"],
    };

    await axios.post(
      `${config.dataServiceAddr}/ls/task/import/${dataset.ds_project_id}`,
      body
    );

    // 3. Save dataset
    dataset.uploaded = true;
    await dataset.save();

    return { validFiles };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const textClassLabel = async (files, dataset) => {
  try {
    // 1. Parse Files
    const results = d3.csvParse(files.data.toString());

    // 2. Difine Text column and Label column
    let text_col = "";
    let label_col = "";
    results.columns.forEach((column) => {
      const column_lower = column.toLowerCase();
      if (
        column_lower.includes("text") ||
        column_lower.includes("content") ||
        column_lower.includes("sentence")
      )
        text_col = column;
      if (
        column_lower.includes("label") ||
        column_lower.includes("category") ||
        column_lower.includes("class") ||
        column_lower.includes("target")
      )
        label_col = column;
    });

    if (!text_col || !label_col)
      throw new Error(`Text or Label column not found`);
    if (text_col == label_col)
      throw new Error(
        `Text and Label column must be different: found ${text_col}`
      );

    console.log("text_column: ", text_col);
    console.log("label_column: ", label_col);

    // 3. Take Labels
    let labels = [];
    results.forEach((row) => {
      const label = String(row[label_col]);
      if (!labels.includes(label)) labels.push(label);
    });

    //4. Set label config and send it to Label Studio
    await DS_DatasetService.SetLabelConfigNew(dataset, {
      label_choices: labels,
    });

    let datasetSend = [];

    for (const [index, row] of results.entries()) {
      // if (index == config.maxImportSize) break;
      if (label_col)
        datasetSend.push({
          text: row[text_col],
          label: row[label_col],
        });
      else
        datasetSend.push({
          text: row[text_col],
        });
    }

    const body = {
      "attribute_type": {
        "text": "TXT",
      },
      data: datasetSend,
      label_field: ["label"],
    };

    await axios.post(
      `${config.dataServiceAddr}/ls/task/import/${dataset.ds_project_id}`,
      body
    );

    // 5. Save dataset
    dataset.uploaded = true;
    await dataset.save();

    return { validFiles: files };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const tabularClassLabel = async (files, dataset) => {
  try {
    // 1. Parse Files
    const results = d3.csvParse(files.data.toString());

    // 2. Tạo cột temp_label mặc định giá trị 0
    const label_col = "temp_label";
    results.forEach((row) => {
      row[label_col] = "0"; // Thêm cột temp_label với giá trị mặc định là "0"
    });

    if (label_col) {
      dataset.original_label_column = label_col;
      let labels = ["0", "1"];

      console.log("labels", labels);
      await DS_DatasetService.SetLabelConfigNew(dataset, {
        label_choices: labels,
      });
    }

    // 3. Gửi dữ liệu đến Label Studio
    let datasetSend = [];

    for (const [index, row] of results.entries()) {
      // if (index == config.maxImportSize) break;

      let data = {};
      for (const [key, value] of Object.entries(row)) {
        if (key === label_col) data["label"] = value;
        else data[key] = value;
      }

      datasetSend.push(data);
    }

    const body = {
      "attribute_type": {},
      "data": datasetSend,
      "label_field": ["label"],
    };

    await axios.post(
      `${config.dataServiceAddr}/ls/task/import/${dataset.ds_project_id}`,
      body
    );

    // 6. Lưu dataset
    dataset.uploaded = true;
    await dataset.save();

    return { validFiles: files };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const AddNewFiles = async (datasetID, files) => {
  // 1. Lấy dataset từ Label Studio
  // 2. Tách Label và gửi cho Label Studio
  // 3. Upload lên Storage với key là id-add1
};

const Preview = async (datasetID, size) => {
  try {
    // 1. Find dataset based on datasetID
    const dataset = await DS_Dataset.findOne({ _id: datasetID });

    if (!dataset) {
      throw new Error("Project does not exist");
    }

    let files;

    if (dataset.type !== "IMAGE_CLASSIFICATION") {
      const extractedFiles = await CloudStorageService.getDataset(
        dataset.bucketName,
        dataset.title
      );

      // Đọc CSV từ buffer
      files = await new Promise((resolve, reject) => {
        const results = [];

        // Lấy content từ file đầu tiên trong mảng
        const fileContent = extractedFiles[0]?.content;

        if (!fileContent) {
          return reject(new Error("File content is undefined"));
        }

        Readable.from(fileContent.toString()) // Chuyển buffer thành stream
          .pipe(csv())
          .on("data", (row) => {
            if (results.length < size) results.push(row);
          })
          .on("end", () => {
            resolve(results);
          })
          .on("error", (err) => {
            reject(err);
          });
      });
    }

    return { dataset, files };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const DatasetService = {
  Upsert,
  DeleteAllByProject,
  ListByProject,
  CreateTFRecordDataset,
  createLabelDataset,
  Create,
  List,
  Get,
  GetTen,
  AddNewFiles,
  Preview,
};
export default DatasetService;
