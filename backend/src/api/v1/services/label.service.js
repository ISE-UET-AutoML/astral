import config from '#src/config/config.js'
import Label from '#api/models/label.model.js'
import Image from '#api/models/image.model.js'
import ProjectService from './project.service.js'
import StorageService from './storage.service.js'
import ImageService from './image.service.js'
import { GCS_HOST } from '../data/constants.js'

const List = async (projectID) => {
  try {
    await ProjectService.Get(projectID)
    const labels = await Label.find({ project_id: projectID })
    return labels
  } catch (error) {
    console.error(error)
    throw error
  }
}

const Get = async (labelID) => {
  try {
    const label = await Label.findOne({ _id: labelID })
    if (label == undefined) {
      throw new Error('Label does not exist')
    }
    return label
  } catch (error) {
    console.error(error)
    throw error
  }
}

const Create = async ({ name, description, project_id }) => {
  try {
    await ProjectService.Get(project_id)
    const existingLabel = await Label.findOne({ project_id, name })
    if (existingLabel != undefined) {
      throw new Error('Label already exist')
    }

    const label = new Label({ name, description, project_id })
    await label.save()
    return label
  } catch (error) {
    console.error(error)
    throw error
  }
}

const Update = async (id, { name, description, project_id }) => {
  try {
    await ProjectService.Get(project_id)
    const label = await Label.findOne({ _id: id })
    if (label == undefined || label.project_id != project_id) {
      throw new Error('Label does not exist')
    }

    const existingLabel = await Label.findOne({ project_id, name })
    if (existingLabel != undefined) {
      throw new Error('Label already exist')
    }

    await label.updateOne({ name, description, project_id })
  } catch (error) {
    console.error(error)
    throw error
  }
}

const Delete = async (labelID) => {
  try {
    const images = await Image.find({ label_id: labelID })
    const updatingImages = []
    const promises = images.map((image) => {
      const keyWithoutLabel = ImageService.ReplaceLabel(image.key, true, undefined)
      updatingImages.push({
        $unset: { label_id: 1 },
        $set: {
          key: keyWithoutLabel,
          url: `${GCS_HOST}/${config.storageBucketName}/${keyWithoutLabel}`,
        },
      })
      return StorageService.MoveFile(image.key, keyWithoutLabel)
    })
    const results = await Promise.allSettled(promises)
    // TODO: handle error
    results.forEach((result, idx) => {
      if (result.status !== 'fulfilled') {
        console.error(result.reason)
        console.log(`Error while move file ${images[idx].url}`)
      }
    })

    await ImageService.UpdateAll({ label_id: labelID }, updatingImages)
    await Label.deleteOne({ _id: labelID })
  } catch (error) {
    console.error(error)
    throw error
  }
}

const UpsertAll = async (projectID, labels) => {
  const upsertingLabels = labels.map((label) => {
    return {
      updateOne: {
        filter: { project_id: projectID, name: label.name },
        update: label,
        upsert: true,
      },
    }
  })

  try {
    await Label.bulkWrite(upsertingLabels)
  } catch (error) {
    console.error(error)
    throw error
  }
}

const DeleteAll = async (labels) => {
  const labelIDs = labels.map((label) => label._id)
  try {
    await Label.deleteMany({ _id: { $in: labelIDs } })
  } catch (error) {
    console.error(error)
    throw error
  }
}

const DeleteAllByProject = async (projectID) => {
  try {
    await Label.deleteMany({ project_id: projectID })
  } catch (error) {
    console.error(error)
    throw error
  }
}

const GetLabelMap = async (projectID) => {
  try {
    await ProjectService.Get(projectID)
    const labels = await Label.find({ project_id: projectID })
    const labelMap = {}
    labels.forEach((label) => {
      labelMap[label.name] = label._id
    })
    return labelMap
  } catch (error) {
    console.error(error)
    throw error
  }
}

const LabelService = {
  List,
  Get,
  Create,
  Update,
  Delete,
  UpsertAll,
  DeleteAll,
  DeleteAllByProject,
  GetLabelMap,
}
export default LabelService
