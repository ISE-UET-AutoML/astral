import { Router } from 'express'
import RunController from '../../controllers/run.controller.js'

const runRouter = Router()

runRouter.post('/', RunController.Create)
runRouter.get('/', RunController.GetByName)
runRouter.get('/best', RunController.GetBestExperimentRun)

export default runRouter
