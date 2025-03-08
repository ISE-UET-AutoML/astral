import { Router } from 'express'
import LabelController from '../../controllers/label.controller.js'

const labelRouter = Router()

labelRouter.get('/', LabelController.List)
labelRouter.get('/:id', LabelController.Get)
labelRouter.post('/', LabelController.Create)
labelRouter.put('/:id', LabelController.Update)
labelRouter.delete('/:id', LabelController.Delete)

export default labelRouter
