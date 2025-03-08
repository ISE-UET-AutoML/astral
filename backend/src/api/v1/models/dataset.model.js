import { Schema, model } from 'mongoose'
import { DatasetTypes } from '../data/constants.js'

const schema = new Schema(
  {
    key: { type: String, required: true },
    type: { type: String, required: true, default: DatasetTypes.IMAGE_DIRECTORY },
    pattern: { type: String },
    project_id: { type: Schema.Types.ObjectId, required: true },

    csv_data_source: { type: String },
  },
  { timestamps: true }
)

const Dataset = model('Dataset', schema)
export default Dataset
