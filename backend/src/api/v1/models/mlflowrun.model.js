import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    run_id: { type: String, required: true },
    name: { type: String, required: true },
    experiment_id: { type: Schema.Types.ObjectId, ref: 'Experiment', required: true },
    best_model_url: { type: String, required: true },
    train_accuracy: { type: Number, required: true }, // metrics of best model
    train_loss: { type: Number, required: true },
    val_accuracy: { type: Number, required: true },
    val_loss: { type: Number, required: true },
  },
  { timestamps: true }
)

const MLflowRun = model('MLflowRun', schema)
export default MLflowRun
