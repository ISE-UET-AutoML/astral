import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    project_id: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    author_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    isDeployed: { type: Boolean, default: false },
    //additional info for predict
    projectName: { type: String },
    userEmail: { type: String },
    runID: { type: String },
    experimentID: { type: String },
  },
  { timestamps: true }
);

const MLModel = model("MLModel", schema);
export default MLModel;
