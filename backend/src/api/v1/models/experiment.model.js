import { Schema, model } from "mongoose";
import { ExperimentStatuses } from "../data/constants.js";

const schema = new Schema(
  {
    name: { type: String, required: true },
    project_id: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    status: {
      type: String,
      required: true,
      default: ExperimentStatuses.PROCESSING,
    },
    best_run_id: { type: String },
    max_training_time: { type: Number },
  },
  { timestamps: true }
);

const Experiment = model("Experiment", schema);
export default Experiment;
