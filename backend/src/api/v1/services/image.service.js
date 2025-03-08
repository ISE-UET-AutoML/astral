import config from '#src/config/config.js'
import Image from '#api/models/image.model.js'
import Project from '#api/models/project.model.js'
import Label from '#api/models/label.model.js'
import Dataset from '../models/dataset.model.js'
import { DatasetTypes, GCS_HOST } from '../data/constants.js'
import StorageService from './storage.service.js'
import fs from 'fs'

const List = async (projectID, page, size, isFull = false) => {
  try {
    const project = await Project.findOne({ _id: projectID })
    if (project == undefined) {
      throw new Error('Project does not exist')
    }
    let images = []
    let totalPage = 1
    let filter = {}
    if (!isFull) {
      filter = { project_id: projectID, is_original: false, label_id: { $ne: null } }
    } else {
      filter = { project_id: projectID, is_original: false }
    }

    if (size !== -1) {
      const offset = (page - 1) * size
      const total = await Image.find(filter).countDocuments()
      totalPage = Math.ceil(total / size)
      images = await Image.find(filter).populate('label_id').skip(offset).limit(size)
    } else {
      images = await Image.find(filter).populate('label_id')
    }
    const labelNames = new Set()
    const labels = []
    const files = images.map((image) => {
      image.url = image.url.replace('undefined', 'localhost');
      let label = ''

      return { ...image.toJSON(), label }
    })

    return {
      data: { files, labels },
      meta: {
        page,
        size,
        total_page: totalPage
      }
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}

const Get = async (imageID) => {
  try {
    const image = await Image.findOne({ _id: imageID })
    if (image == undefined) {
      throw new Error('Image does not exist')
    }
    return image
  } catch (error) {
    console.error(error)
    throw error
  }
}

const UpdateAll = async (filter, images) => {
  const updatingImages = images.map((image) => {
    return {
      updateOne: {
        filter,
        update: image,
        upsert: true,
      },
    }
  })

  try {
    await Image.bulkWrite(updatingImages)
  } catch (error) {
    console.error(error)
    throw error
  }
}

const Delete = async (imageID) => {
  try {
    const image = await Image.findOne({ _id: imageID })
    if (image == undefined) {
      return
    }
    await Image.deleteMany({ uid: image.uid })
  } catch (error) {
    console.error(error)
    throw error
  }
}

const DeleteAll = async (images) => {
  const imageIDs = images.map((image) => image._id)
  try {
    await Image.deleteMany({ _id: { $in: imageIDs } })
  } catch (error) {
    console.error(error)
    throw error
  }
}

const DeleteByProject = async (projectID) => {
  try {
    const images = await Image.find({ project_id: projectID })
    images.forEach((image) => {
      if (image.path) {
        fs.rm(image.path, { recursive: true, force: true }, (error) => {
          if (error)
            console.error(error)
        })
        console.log(`${image.path} deleted`)
      }
    })
    await Image.deleteMany({ project_id: projectID })
  } catch (error) {
    console.error(error)
    throw error
  }
}

const LabelImage = async (imageID, labelID) => {
  try {
    const [image, label] = await Promise.all([
      Image.findOne({ _id: imageID }),
      Label.findOne({ _id: labelID }),
    ])
    if (image == undefined) {
      throw new Error('Image does not exist')
    }

    if (label == undefined) {
      throw new Error('Label does not exist')
    }

    const dataset = await Dataset.findOne({
      project_id: image.project_id,
      type: DatasetTypes.IMAGE_DIRECTORY,
    })

    const isLabelExist = !!image.label_id
    const newKey = ReplaceLabel(image.key, isLabelExist, label.name)
    await StorageService.MoveFile(image.key, newKey)

    const url = `${GCS_HOST}/${config.storageBucketName}/${newKey}`
    await image.updateOne({ label_id: labelID, dataset_id: dataset._id, key: newKey, url })
  } catch (error) {
    console.error(error)
    throw error
  }
}


const UpdateLabelImage = async (imageID, labelID) => {
  try {
    console.log(imageID, labelID);
    const [image, label] = await Promise.all([
      Image.findOne({ _id: imageID }),
      Label.findOne({ _id: labelID }),
    ])
    if (image == undefined) {
      throw new Error('Image does not exist')
    }

    if (label == undefined) {
      throw new Error('Label does not exist')
    }
    return await image.updateOne({ label_id: labelID, "label_by": "human" })
  } catch (error) {
    console.error(error)
    throw error
  }
}

// Pass undefined or '' for empty label
const ReplaceLabel = (key, isLabelExist, newLabel) => {
  const paths = key.split('/')
  // E.g: /project_id/daisy/name.png => label = daisy
  const oldLabelIdx = paths.length - 2
  if (isLabelExist) {
    paths[oldLabelIdx] = newLabel
  } else {
    paths.splice(oldLabelIdx + 1, 0, newLabel)
  }
  return paths.filter(Boolean).join('/')
}

const UpdateLabel = async (imageId, newLabelId) => {
  const image = await Image.findById(imageId)
  image.label_id = newLabelId
  image.label_by = 'human'
  image.save()
  return image
}

const UpdateLabelPrediction = async (images) => {
  for (let [k, v] of Object.entries(images)) {
    const tmp_image = await Image.findByIdAndUpdate(k, { label_id: v, label_by: 'autolabel' })
    // console.log(tmp_image);
  }
  return images
}


const ImageService = {
  List,
  Get,
  UpdateAll,
  Delete,
  DeleteAll,
  DeleteByProject,
  LabelImage,
  ReplaceLabel,
  UpdateLabel,
  UpdateLabelImage,
  UpdateLabelPrediction
}
export default ImageService
