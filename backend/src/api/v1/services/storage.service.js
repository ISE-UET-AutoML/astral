import config from "#src/config/config.js";
import path from "path";
import mongoose from "mongoose";
import {
  UploadTypes,
  ALLOWED_FILE_EXTENSIONS,
  GCS_HOST,
  UPLOAD_BATCH_SIZE,
  FILE_NAME_LEN,
  ProjectTypes,
} from "../data/constants.js";
import LabelService from "./label.service.js";
import {
  getLabelAndFilePath,
  randomString,
  randomUID,
} from "../utils/string.util.js";
import Image from "../models/image.model.js";
import DatasetService from "./dataset.service.js";
import ProjectService from "./project.service.js";
import DS_DatasetService from "./ds_dataset.service.js";
import { count, error, log } from "console";
import fs from "fs";
import axios from "axios";

import * as d3 from "d3";

const saveFileToLocal = async (validFiles, projectID) => {
  var results = [];
  validFiles.forEach((file, index, readonly) => {
    var paths = file.name.split("/");

    var name = paths[paths.length - 1];
    var label = paths[paths.length - 2];

    var file_path = `public/media/upload/${projectID}/${name}`;

    file.url = `http://${config.hostIP}:${config.port}/${file_path.replace(
      "public/",
      ""
    )}`.replace("undefined", "localhost");
    file.key = file_path;
    file.path = file_path;
    file.label = label;
    results.push(file);
    fs.writeFile(file_path, file.data, (err) => {});
  });

  return results;
};

const savePredictFileToLocal = async (validFiles, projectID) => {
  var results = [];
  if (!fs.existsSync(`public/media/upload/${projectID}`)) {
    fs.mkdirSync(`public/media/upload/${projectID}`, { recursive: true });
  }

  if (Array.isArray(validFiles) != true) {
    validFiles = [validFiles];
  }
  validFiles.forEach((file, index, readonly) => {
    var file_path = `public/media/upload/${projectID}/${file.name}`;

    file.url = `http://${config.hostIP}:${config.publicPort}/${file_path.replace(
      "public/",
      ""
    )}`;

    file.key = file_path;
    results.push(file.url);
    fs.writeFile(file_path, file.data, (err) => {
      console.log(err);
    });
  });
  // log(results[0])
  return results;
};

const UploadLocalFiles = async (projectID, files, uploadType, import_args) => {
  try {
    const project = await ProjectService.Get(projectID);
    if (project.type == ProjectTypes.IMAGE_CLASSIFICATION)
      return await Import_ImageFolders(-1, projectID, files);
    if (project.type == ProjectTypes.TEXT_CLASSIFICATION)
      return await Import_TextCSV(-1, projectID, files);
    if (project.type == ProjectTypes.TABULAR_CLASSIFICATION)
      return await Import_TabularCSV(-1, projectID, files, import_args);
    if (project.type == ProjectTypes.MULTIMODAL_CLASSIFICATION)
      return await Import_MultiModalCSV(-1, projectID, files, import_args);
    throw new Error("Project type not supported");
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const UploadLabeledImages_old = async (projectID, files, uploadType) => {
  console.log("UploadLabeledImages_old");
  try {
    const { labels, validFiles } = parseAndValidateFiles(files, uploadType);
    // console.log('valid file', validFiles[0]);

    const folderPath = `public/media/upload/${projectID}`;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const uploadedFiles = await saveFileToLocal(validFiles, projectID);
    // Upload folder
    const setLbData = new Set(uploadedFiles.map((v, i) => v.label));
    // const labelData = setLb.intersection(setLbData)
    const labelData = new Set([...labels].filter((i) => setLbData.has(i)));
    const lbs = [...labelData];

    if (lbs.length > 0) {
      const insertingLabels = lbs.map((label) => ({
        project_id: projectID,
        name: label,
      }));
      await LabelService.UpsertAll(projectID, insertingLabels);
    }
    const labelMap = await LabelService.GetLabelMap(projectID);
    const datasetInfo = {
      key: `label/${projectID}`,
      pattern: `public/label/${projectID}`,
      project_id: projectID,
    };
    const dataset = await DatasetService.Upsert(datasetInfo);

    const uploadedFilesInfo = await insertUploadedFiles_old(
      uploadedFiles,
      projectID,
      dataset._id,
      labelMap
    );

    const defaultPageSize = 12;
    const totalPage = Math.ceil(uploadedFilesInfo.length / defaultPageSize);
    const fileInfo = uploadedFilesInfo.slice(0, defaultPageSize);
    // Convert label map to array of labels: { id, value }
    const labelsWithID = Object.entries(labelMap).map(([label, id]) => {
      return { id: id.toString(), value: label };
    });

    // Update project thumbnail
    const thumbnailURL = uploadedFilesInfo[0].url;
    await ProjectService.Update(projectID, {
      thumbnail_url: thumbnailURL,
      uploaded: true,
    });
    return {
      files: fileInfo,
      labels: labelsWithID,
      pagination: { page: 1, size: 24, total_page: totalPage },
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Import_ImageFolders = async (userID, projectID, files) => {
  console.log("Upload Labeled Image Folders");

  try {
    const project = await ProjectService.Get(projectID);
    if (project.type != ProjectTypes.IMAGE_CLASSIFICATION) {
      throw new Error("Project type is not image classification");
    }

    const ds_dataset = await DS_DatasetService.Get(projectID);
    if (ds_dataset.uploaded) {
      //! throw Error here in the future
      const preview = await DS_DatasetService.GetDataset_Preview(
        projectID,
        1,
        12
      );
      preview.error = "Dataset already uploaded";
      return preview;
    }

    const { labels, validFiles } = parseAndValidateFiles(files);

    const folderPath = `public/media/upload/${projectID}`;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const uploadedFiles = await saveFileToLocal(validFiles, projectID);

    console.log("UPLOADED FILES", uploadedFiles);

    await insertUploadedImage(uploadedFiles, projectID, ds_dataset._id);

    if (labels.length > 0)
      await DS_DatasetService.SetLabelConfig(projectID, {
        label_choices: labels,
      });
    let dataset = [];
    uploadedFiles.forEach((file) => {
      if (labels.length > 0)
        dataset.push({
          image: file.url,
          label: file.label,
        });
      else
        dataset.push({
          image: file.url,
        });
    });
    console.log("dataset", dataset);

    const body = {
      "attribute_type": {
        "image": "IMG",
      },
      data: dataset,
      label_field: ["label"],
    };

    const { data } = await axios.post(
      `${config.dataServiceAddr}/ls/task/import/${ds_dataset.ds_project_id}`,
      body
    );

    ds_dataset.uploaded = true;
    await ds_dataset.save();
    project.uploaded = true;
    await project.save();

    const preview = await DS_DatasetService.GetDataset_Preview(
      projectID,
      1,
      12
    );
    return preview;
  } catch (error) {
    console.error(error);
  }
};

const Import_UnlabeledImages = async (userID, projectID, files) => {
  console.log("Upload Unlabeled Image Folders");
  try {
    const ds_dataset = await DS_DatasetService.Get(projectID);
    const project = await ProjectService.Get(projectID);
    if (userID != -1 && project.author != userID) throw new Error("Forbidden");
    if (ds_dataset.uploaded) {
      //! throw Error here in the future
      const preview = await DS_DatasetService.GetDataset_Preview(
        projectID,
        1,
        12
      );
      preview.error = "Dataset already uploaded";
      return preview;
    }
    if (project.type != ProjectTypes.IMAGE_CLASSIFICATION)
      //! this import could be used for other project types (Object Detection, Segmentation, ...)
      throw new Error("Project type is not image classification");

    const { _, validFiles } = parseAndValidateFiles(files);
    const folderPath = `public/media/upload/${projectID}`;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const uploadedFiles = await saveFileToLocal(validFiles, projectID);

    // console.log('labels', lbs)
    // await DS_DatasetService.SetLabelConfig(projectID, { "label_choices": lbs })

    let dataset = [];
    uploadedFiles.forEach((file) => {
      dataset.push({
        image: file.url,
      });
    });
    console.log("dataset", dataset);

    const body = {
      "attribute_type": {
        "image": "IMG",
      },
      data: dataset,
      label_field: ["label"],
    };
    const { data } = await axios.post(
      `${config.dataServiceAddr}/ls/task/import/${ds_dataset.ds_project_id}`,
      body
    );

    ds_dataset.uploaded = true;
    await ds_dataset.save();
    project.uploaded = true;
    await project.save();

    const preview = await DS_DatasetService.GetDataset_Preview(
      projectID,
      1,
      12
    );
    return preview;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Import_TextCSV = async (userID, projectID, file) => {
  try {
    const project = await ProjectService.Get(projectID);

    const ds_dataset = await DS_DatasetService.Get(projectID);
    if (ds_dataset.uploaded) {
      //! throw Error here in the future
      const preview = await DS_DatasetService.GetDataset_Preview(
        projectID,
        1,
        12
      );
      preview.error = "Dataset already uploaded";
      return preview;
    }
    if (project.type != ProjectTypes.TEXT_CLASSIFICATION)
      throw new Error("Project type is not text classification");

    const results = d3.csvParse(file.data.toString());

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
    console.log("text_column: ", text_col);
    console.log("label_column: ", label_col);

    if (!text_col) throw new Error(`text or label column not found`);
    if (text_col == label_col)
      throw new Error(
        `text and label column must be different: found ${text_col}`
      );

    //* check and insert labels
    if (label_col) {
      let labels = []; // Có thể dùng Set để tối ưu

      console.log(`label column found`);
      results.forEach((row) => {
        const label = String(row[label_col]);
        if (!labels.includes(label)) labels.push(label);
      });

      console.log("labels", labels);
      await DS_DatasetService.SetLabelConfig(projectID, {
        label_choices: labels,
      });
    }

    let dataset = [];

    for (const [index, row] of results.entries()) {
      // if (index == config.maxImportSize) break; // MAX_IMPORT_SIZE
      if (label_col)
        dataset.push({
          text: row[text_col],
          label: row[label_col],
        });
      else
        dataset.push({
          text: row[text_col],
        });
    }

    console.log("dataset", dataset);

    const body = {
      "attribute_type": {
        "text": "TXT",
      },
      data: dataset,
      label_field: ["label"],
    };

    const { data } = await axios.post(
      `${config.dataServiceAddr}/ls/task/import/${ds_dataset.ds_project_id}`,
      body
    );

    ds_dataset.uploaded = true;
    await ds_dataset.save();
    project.uploaded = true;
    await project.save();

    const preview = await DS_DatasetService.GetDataset_Preview(
      projectID,
      1,
      12
    );
    return preview;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Import_TabularCSV = async (userID, projectID, file, import_args) => {
  try {
    const project = await ProjectService.Get(projectID);

    const ds_dataset = await DS_DatasetService.Get(projectID);
    if (ds_dataset.uploaded) {
      //! throw Error here in the future
      const preview = await DS_DatasetService.GetDataset_Preview(
        projectID,
        1,
        12
      );
      preview.error = "Dataset already uploaded";
      return preview;
    }

    if (project.type != ProjectTypes.TABULAR_CLASSIFICATION)
      throw new Error("Project type is not TABULAR_CLASSIFICATION");

    const results = d3.csvParse(file.data.toString());

    const label_col = import_args?.label_column || null;
    const exclude_cols = import_args?.exclude_columns || [];

    console.log("label_column: ", label_col);
    console.log("exclude_columns: ", exclude_cols);

    //* check and insert labels
    //* chang logics to support tabular regression
    if (label_col) {
      ds_dataset.original_label_column = label_col;
      let labels = [];

      console.log(`label column found`);
      results.forEach((row) => {
        const label = String(row[label_col]);
        if (!labels.includes(label)) labels.push(label);
      });

      console.log("labels", labels);
      await DS_DatasetService.SetLabelConfig(projectID, {
        label_choices: labels,
      });
    }

    let dataset = [];

    for (const [index, row] of results.entries()) {
      if (index == config.maxImportSize) break;
      let data = {};
      for (const [key, value] of Object.entries(row)) {
        if (key === label_col) data["label"] = value;
        else if (!exclude_cols.includes(key)) data[key] = value;
      }

      dataset.push(data);
    }

    const body = {
      "attribute_type": {},
      "data": dataset,
      "label_field": ["label"],
    };
    // console.log("dataset is not uploaded, testing tabular import")
    const { data } = await axios.post(
      `${config.dataServiceAddr}/ls/task/import/${ds_dataset.ds_project_id}`,
      body
    );

    ds_dataset.uploaded = true;
    await ds_dataset.save();
    project.uploaded = true;
    await project.save();

    const preview = await DS_DatasetService.GetDataset_Preview(
      projectID,
      1,
      12
    );
    return preview;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
const Import_MultiModalCSV = async (userID, projectID, file, import_args) => {
  try {
    const project = await ProjectService.Get(projectID);

    const ds_dataset = await DS_DatasetService.Get(projectID);
    if (ds_dataset.uploaded) {
      //! throw Error here in the future
      const preview = await DS_DatasetService.GetDataset_Preview(
        projectID,
        1,
        12
      );
      preview.error = "Dataset already uploaded";
      return preview;
    }
    if (project.type != ProjectTypes.MULTIMODAL_CLASSIFICATION)
      throw new Error("Project type is not MULTIMODAL_CLASSIFICATION");

    let results = d3.csvParse(file.data.toString());
    if (results.length > config.maxImportSize) results = d3.shuffle(results);

    const label_col = import_args?.label_column || null;
    const exclude_cols = import_args?.exclude_columns || [];
    const image_cols = import_args?.image_columns || [];
    const text_cols = import_args?.text_columns || [];

    console.log("label_column: ", label_col);
    console.log("exclude_columns: ", exclude_cols);

    //* check and insert labels
    //* chang logics to support tabular regression
    if (label_col) {
      ds_dataset.original_label_column = label_col;
      let labels = [];

      console.log(`label column found`);
      results.forEach((row) => {
        const label = String(row[label_col]);
        if (!labels.includes(label)) labels.push(label);
      });

      console.log("labels", labels);
      await DS_DatasetService.SetLabelConfig(projectID, {
        label_choices: labels,
      });
    }

    let dataset = [];

    for (const [index, row] of results.entries()) {
      if (index == config.maxImportSize) break;
      let data = {};
      for (const [key, value] of Object.entries(row)) {
        if (key === label_col) data["label"] = value;
        else if (!exclude_cols.includes(key)) data[key] = value;
      }

      dataset.push(data);
    }
    const attribute_type = {};
    results.columns.forEach((column) => {
      if (image_cols.includes(column)) attribute_type[column] = "IMG";
      else if (text_cols.includes(column)) attribute_type[column] = "TXT";
      else if (exclude_cols.includes(column)) attribute_type[column] = "EXC";
      else attribute_type[column] = "VAL";
    });
    console.log("attribute_type", attribute_type);

    const body = {
      attribute_type: attribute_type,
      data: dataset,
      label_field: ["label"],
    };
    // console.log("dataset is not uploaded, testing tabular import")
    const { data } = await axios.post(
      `${config.dataServiceAddr}/ls/task/import/${ds_dataset.ds_project_id}`,
      body
    );

    ds_dataset.column_types = attribute_type;
    ds_dataset.markModified("column_types");
    ds_dataset.uploaded = true;
    await ds_dataset.save();
    project.uploaded = true;
    await project.save();

    const preview = await DS_DatasetService.GetDataset_Preview(
      projectID,
      1,
      12
    );
    return preview;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const UploadFiles = async (projectID, files, uploadType) => {
  try {
    const { labels, validFiles } = parseAndValidateFiles(files, uploadType);
    const uploadedFiles = await uploadFilesToGCS(
      validFiles,
      projectID,
      uploadType
    );

    // Upload folder
    if (labels.length > 0) {
      const insertingLabels = labels.map((label) => ({
        project_id: projectID,
        name: label,
      }));
      await LabelService.UpsertAll(projectID, insertingLabels);
    }
    const labelMap = await LabelService.GetLabelMap(projectID);
    const datasetInfo = {
      key: `label/${projectID}`,
      pattern: `gs://${config.storageBucketName}/label/${projectID}`,
      project_id: projectID,
    };
    const dataset = await DatasetService.Upsert(datasetInfo);

    const uploadedFilesInfo = await insertUploadedFiles_old(
      uploadedFiles,
      projectID,
      dataset._id,
      labelMap
    );

    const defaultPageSize = 24;
    const totalPage = Math.ceil(uploadedFilesInfo.length / defaultPageSize);
    const fileInfo = uploadedFilesInfo.slice(0, defaultPageSize);
    // Convert label map to array of labels: { id, value }
    const labelsWithID = Object.entries(labelMap).map(([label, id]) => {
      return { id: id.toString(), value: label };
    });

    // Update project thumbnail
    const thumbnailURL = uploadedFilesInfo[0].url;
    await ProjectService.Update(projectID, {
      thumbnail_url: thumbnailURL,
      uploaded: true,
    });
    return {
      files: fileInfo,
      labels: labelsWithID,
      pagination: { page: 1, size: 24, total_page: totalPage },
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const DeleteFiles = async (keys) => {
  const successFiles = [];
  const errorFiles = [];
  try {
    const promises = await keys.map(async (key) => deleteLocalFile(key));
    const results = await Promise.allSettled(promises);
    // TODO: handle error
    results.forEach((result, idx) => {
      if (result.status !== "fulfilled") {
        console.error(result.reason);
        errorFiles.push(keys[idx]);
      } else {
        successFiles.push(keys[idx]);
      }
    });
    console.log(
      `${successFiles.length} file(s) deleted successfully, ${errorFiles.length} error(s).`
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const insertUploadedFiles_old = async (
  uploadedFiles,
  projectID,
  datasetID,
  labelMap
) => {
  // const imageURLPrefix = `${GCS_HOST}/${config.storageBucketName}`
  const imageURLPrefix = `media/upload/${projectID}`;
  const insertingFiles = [];
  const uploadedFilesInfo = [];
  try {
    uploadedFiles.forEach((file) => {
      const uid = randomUID();
      const labelingImageID = new mongoose.Types.ObjectId();
      const baseInfo = {
        name: file.name,
        project_id: projectID,
        uid,
        label_by: "ukn",
      };
      // insertingFiles.push({
      //   ...baseInfo,
      //   key: `${file.key}`,
      //   url: `${imageURLPrefix}/${file.key}`,
      //   is_original: true,
      // })

      const labelingImage = {
        ...baseInfo,
        _id: labelingImageID,
        key: `${file.key}`,
        url: file.url,
        is_original: false,
        dataset_id: datasetID,
      };

      let labelID = "";
      if (file?.label && file.label.length > 0) {
        labelID = labelMap[file.label];
        labelingImage.label_id = labelID;
        labelingImage.label_by = "human";
      }
      insertingFiles.push(labelingImage);
      uploadedFilesInfo.push({
        _id: labelingImageID,
        label: file.label,
        label_id: labelID,
        uid,
        url: labelingImage.url,
      });
    });
    await Image.insertMany(insertingFiles);
  } catch (error) {
    console.error(error);
    throw error;
  }
  return uploadedFilesInfo;
};

const insertUploadedImage = async (uploadedImages, projectID, ds_datasetID) => {
  try {
    const insertingImages = [];
    uploadedImages.forEach((file) => {
      const info = {
        name: file.name,
        url: file.url,
        path: file.path,
        project_id: projectID,
        ds_dataset_id: ds_datasetID,
      };
      insertingImages.push(info);
    });
    await Image.insertMany(insertingImages);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const parseAndValidateFiles = (files) => {
  const validFiles = [];
  const labels = [];
  for (let i = 0; i < files.length; i++) {
    // Decode base64
    const originalFileName = Buffer.from(files[i].name, "base64").toString(
      "ascii"
    );
    const { label, path } = getLabelAndFilePath(originalFileName);
    if (labels.indexOf(label) < 0) {
      labels.push(label);
    }
    files[i].name = path;

    const fileName = files[i].name;
    if (fileName.startsWith(".")) {
      continue;
    }
    if (isAllowedExtension(fileName)) {
      files[i].name = generateUniqueFileName(files[i].name);
      validFiles.push(files[i]);
    } else {
      console.error("File extension not supported: ", fileName);
      throw new Error("File extension not supported");
    }
  }
  return { labels, validFiles };
};

const isAllowedExtension = (fileName) => {
  const idx = fileName.lastIndexOf(".");
  if (idx <= 0) {
    return false;
  }
  const ext = fileName.substring(idx + 1, fileName.length);
  return ALLOWED_FILE_EXTENSIONS.includes(ext);
};

// TODO: using socket for realtime rendering
const uploadFilesToGCS = async (files, projectID, uploadType) => {
  const timeNowUnix = new Date().getTime();
  const uploadedFiles = [];
  for (let i = 0; i < files.length; i += UPLOAD_BATCH_SIZE) {
    const promises = files
      .slice(i, i + UPLOAD_BATCH_SIZE)
      .map((file) => uploadFile(file, projectID, uploadType));
    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
      if (result.status !== "fulfilled") {
        console.error(result.reason);
      }
      uploadedFiles.push(result.value);
    });
    console.log(
      `#${i / UPLOAD_BATCH_SIZE + 1} - [${i} to ${
        i + UPLOAD_BATCH_SIZE
      }]: Upload done`
    );
  }
  const doneTime = new Date().getTime();
  const timeDiff = (doneTime - timeNowUnix) / 1000;
  console.log(
    `Successfully uploaded ${files.length} file(s), total time: ${timeDiff} seconds`
  );
  return uploadedFiles;
};

const uploadFile = async (file, projectID, uploadType) => {
  const fileName = file.name;
  // TODO: add time unix to file name, make public at file level
  const keyWithoutPrefix = `${projectID}/${fileName}`;
  const objKey = `images/${keyWithoutPrefix}`;
  const datasetKey = `label/${keyWithoutPrefix}`;
  try {
    await config.storageBucket.file(objKey).save(file.data);
    const paths = fileName.split("/");
    const name = paths[paths.length - 1];
    let label = "";
    if (uploadType == UploadTypes.FOLDER) {
      // TODO: ensure paths.length > 2
      label = paths[paths.length - 2];
    }
    await copyFile(objKey, datasetKey);
    return { key: keyWithoutPrefix, name, label };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const copyFile = async (srcFileName, destFileName) => {
  const copyDestination = config.storageBucket.file(destFileName);
  try {
    await config.storageBucket.file(srcFileName).copy(copyDestination);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const MoveFile = async (srcFileName, destFileName) => {
  try {
    await config.storageBucket.file(srcFileName).move(destFileName);
    console.log(
      `gs://${config.storageBucketName}/${srcFileName} moved to gs://${config.storageBucketName}/${destFileName}`
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const deleteFile = async (fileObjKey) => {
  try {
    await config.storageBucket.file(fileObjKey).delete();
    console.log(`gs://${config.storageBucketName}/${fileObjKey} deleted`);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
const deleteLocalFile = async (fileObjKey) => {
  try {
    fs.rm(fileObjKey, { recursive: true, force: true }, (error) => {
      if (error) console.error(error);
    });
    console.log(`${fileObjKey} deleted`);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const generateUniqueFileName = (originalFileName) => {
  let paths = originalFileName.split("/");
  const extension = path.extname(paths[paths.length - 1]);
  paths = paths.slice(0, -1);
  paths.push(randomString(FILE_NAME_LEN));
  const fileName = paths.join("/");
  return `${fileName}${extension}`;
};

const StorageService = {
  UploadFiles,
  DeleteFiles,
  MoveFile,
  UploadLocalFiles,
  Import_ImageFolders,
  Import_TextCSV,
  Import_UnlabeledImages,
  savePredictFileToLocal,
  parseAndValidateFiles,
};
export default StorageService;
