import ImageClassDataView from 'src/components/Dataset/View/ImageClassDataView'
import TextClassDataView from 'src/components/Dataset/View/TextClassDataView'
import TabularClassDataView from 'src/components/Dataset/View/TabularClassDataView'
import MultimodalClassDataView from 'src/components/Dataset/View/MultimodalClassDataView'

const config = {
	IMAGE_CLASSIFICATION: {
		datasetView: ImageClassDataView,
	},
	TEXT_CLASSIFICATION: {
		datasetView: MultimodalClassDataView,
	},
	TABULAR_CLASSIFICATION: {
		datasetView: TabularClassDataView,
	},
	MULTIMODAL_CLASSIFICATION: {
		datasetView: MultimodalClassDataView,
	},
}

export default config
