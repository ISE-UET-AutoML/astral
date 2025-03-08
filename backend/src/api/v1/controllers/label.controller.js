import ImageService from '../services/image.service.js'
import LabelService from '../services/label.service.js'

const List = async (req, res) => {
  const { project_id } = req.query
  try {
    const labels = await LabelService.List(project_id)
    return res.json(labels)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
}

const Get = async (req, res) => {
  const { id } = req.params
  try {
    const label = await LabelService.Get(id)
    return res.json(label)
  } catch (error) {
    console.error(error)
    return res.status(500).json(error)
  }
}

const Create = async (req, res) => {
  const { name, description, project_id } = req.body
  try {
    const label = await LabelService.Create({ name, description, project_id })
    return res.json(label)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
}

const Update = async (req, res) => {
  const { id } = req.params
  const { name, description, project_id } = req.body
  try {
    await LabelService.Update(id, { name, description, project_id })
    return res.sendStatus(200)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
}

const Delete = async (req, res) => {
  const { id } = req.params
  try {
    await LabelService.Delete(id)
    return res.sendStatus(200)
  } catch (error) {
    console.error(error)
    throw error
  }
}

const LabelController = { List, Get, Create, Update, Delete }
export default LabelController
