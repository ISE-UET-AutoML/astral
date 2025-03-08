import ImageService from '../services/image.service.js'

const List = async (req, res) => {
  const { project_id, page, size } = req.query
  try {
    const images = await ImageService.List(project_id, +page, +size)
    return res.json(images)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
const Get = async (req, res) => {
  const { id } = req.params
  try {
    const image = await ImageService.Get(id)
    return res.json(image)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const Delete = async (req, res) => {
  const { id } = req.params
  try {
    await ImageService.Delete(id)
    return res.sendStatus(200)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const LabelImage = async (req, res) => {
  const { id } = req.params
  const { label_id } = req.body
  try {
    await ImageService.LabelImage(id, label_id)
    return res.sendStatus(200)
  } catch (error) {
    console.error(error)
    throw error
  }
}

const UpdateImage = async (req, res) => {
  const { imageId, newLabelId } = req.body
  try {
    const images = await ImageService.UpdateLabel(imageId, newLabelId)

    return res.json(images)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const ImageController = { List, Get, Delete, LabelImage, UpdateImage }
export default ImageController
