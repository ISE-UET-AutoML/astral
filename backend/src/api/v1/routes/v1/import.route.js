import { Router } from "express";

import ImportController from "#api/controllers/import.controller.js";

const importRouter = Router();

importRouter.post("/:id/import/image_folders", ImportController.Import_ImageFolders);
importRouter.post("/:id/import/image_unlabeled", ImportController.Import_UnlabeledImages);
// more routes here

export default importRouter;