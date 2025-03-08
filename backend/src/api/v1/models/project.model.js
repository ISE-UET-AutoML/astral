import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    ds_dataset: { type: Schema.Types.ObjectId, ref: "DS_Dataset" },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    expectation_accuracy: { type: Number, required: true },
    description: { type: String },
    thumbnail_url: { type: String },
    uploaded: { type: Boolean },
    // datasetID: { type: String },
    target_column: { type: String },
    img_column: { type: String },
    text_columns: { type: [String] },
    metrics_explain: {
      type: String,
      default:
        "Accuracy measures the percentage of correct predictions during model training. It helps evaluate performance but may be misleading for imbalanced data.",
    },
  },
  { timestamps: true }
);

const Project = model("Project", schema);
export default Project;
