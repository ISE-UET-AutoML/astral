import { Router } from 'express'
import ImageController from '#api/controllers/image.controller.js'

const imageRouter = Router()

imageRouter.get('/', ImageController.List)
imageRouter.get('/:id', ImageController.Get)
imageRouter.delete('/:id', ImageController.Delete)

export default imageRouter
