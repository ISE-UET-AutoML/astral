import { Schema, model } from "mongoose";
import { DatasetTypes } from "../data/constants.js";

const schema = new Schema(
  {
    project_id: { type: Schema.Types.ObjectId, ref: "Project" },
    userID: { type: Schema.Types.ObjectId, ref: "User" },
    //project_id: { type: Schema.Types.ObjectId, required: true, ref: "Project" },
    // userID: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    ds_project_id: { type: String },
    title: { type: String },
    bucketName: { type: String },
    service: { type: String },
    type: { type: String },
    selectedUrlOption: { type: String },
    url: { type: String },
    isPrivate: { type: Boolean, default: true },
    isLabeled: { type: Boolean, default: true },
    label_config: { type: Schema.Types.Mixed },
    uploaded: { type: Boolean, default: false },
    original_label_column: { type: String, default: "label" },
    column_types: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const DS_Dataset = model("DS_Dataset", schema);
export default DS_Dataset;
