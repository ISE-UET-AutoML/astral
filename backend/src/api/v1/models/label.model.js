import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    project_id: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
)

const Label = model('Label', schema)
export default Label
