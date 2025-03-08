import StorageService from "../services/storage.service.js"

const Import_ImageFolders = async (req, res) => {
    const { _id } = req.user
    const { id } = req.params
    const { files } = req.files.files
    try {
        const uploaded = StorageService.Import_ImageFolders(_id, id, files, id)
        return res.json(uploaded)
    }
    catch (error) {
        console.error(error)
        throw error
    }
}
const Import_UnlabeledImages = async (req, res) => {
    const { _id } = req.user
    const { id } = req.params
    const { files } = req.files.files
    try {
        const uploaded = StorageService.Import_UnlabeledImages(_id, id, files, id)
        return res.json(uploaded)
    }
    catch (error) {
        console.error(error)
        throw error
    }
}

const Import_TextCSV = async (req, res) => {
    const { _id } = req.user
    const { id } = req.params
    const { files } = req.files
    try {
        const uploaded = StorageService.Import_TextCSV(_id, id, files, id)
        return res.json(uploaded)
    }
    catch (error) {
        console.error(error)
        throw error
    }
}

const ImportController = {
    Import_ImageFolders,
    Import_TextCSV,
    Import_UnlabeledImages
}
export default ImportController