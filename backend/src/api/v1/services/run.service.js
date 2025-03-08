import MLflowRun from '#api/models/mlflowrun.model.js'
import ExperimentService from './experiment.service.js'

const Create = async (body) => {
  const { experiment_name } = body
  try {
    const experiment = await ExperimentService.GetByName(experiment_name)
    const run = new MLflowRun({ ...body, experiment_id: experiment._id })
    await run.save()
    return run
  } catch (error) {
    console.error(error)
    throw error
  }
}

const GetByName = async (name) => {
  try {
    const run = await MLflowRun.findOne({ name })
    if (!run) {
      throw new Error('Run does not exist')
    }
    return run
  } catch (error) {
    console.error(error)
    throw error
  }
}

const GetBestExperimentRun = async (experiment_id) => {
  try {
    await ExperimentService.Get(experiment_id)
    const runs = await MLflowRun.find({ experiment_id }).sort('-val_accuracy')
    if (runs.length > 0) {
      return runs[0]
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}

const RunService = { Create, GetByName, GetBestExperimentRun }
export default RunService
