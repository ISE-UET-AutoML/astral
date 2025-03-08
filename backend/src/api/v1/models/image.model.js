import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    name: { type: String, required: true },
    uid: { type: String }, // same uid => same images
    url: { type: String, required: true },
    path: { type: String },
    project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    ds_dataset_id: { type: Schema.Types.ObjectId, ref: 'DS_Dataset' },
  },
  { timestamps: true }
)

const Image = model('Image', schema)
export default Image
