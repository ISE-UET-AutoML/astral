import ImagePredict from '../../../components/Predict/ImagePredict'
import TextPredict from '../../../components/Predict/TextPredict'
import TabularPredict from '../../../components/Predict/TabularPredict'
import MultimodalPredict from '../../../components/Predict/MultimodalPredict'
import LabelingTextClassification from 'src/pages/project/build/labelData/labeling/LabelingTextClassification'
import LabelingImageClassification from 'src/pages/project/build/labelData/labeling/LabelingImageClassification'
import MultimodalTrainingGraph from '../../../components/TrainingGraph/MultimodalTrainingGraph'
import TextTrainingGraph from '../../../components/TrainingGraph/TextTrainingGraph'
import TabularTrainingGraph from '../../../components/TrainingGraph/TabularTrainingGraph'
import { UploadTypes } from 'src/constants/file'

const config = {
	IMAGE_CLASSIFICATION: {
		gridClasses: 'grid-cols-6 gap-3',
		folder: UploadTypes.FOLDER,
		labelingView: LabelingImageClassification,
		trainingGraph: MultimodalTrainingGraph,
		predictView: ImagePredict,
	},
	TEXT_CLASSIFICATION: {
		gridClasses: 'grid-cols-1',
		folder: UploadTypes.CSV_SINGLE,
		labelingView: LabelingTextClassification,
		trainingGraph: TextTrainingGraph,
		predictView: TextPredict,
	},
	TABULAR_CLASSIFICATION: {
		gridClasses: 'grid-cols-1',
		folder: UploadTypes.CSV_SINGLE,
		labelingView: LabelingTextClassification,
		trainingGraph: TabularTrainingGraph,
		predictView: TabularPredict,
	},
	MULTIMODAL_CLASSIFICATION: {
		gridClasses: 'grid-cols-1',
		folder: UploadTypes.CSV_SINGLE,
		labelingView: LabelingTextClassification,
		predictView: MultimodalPredict,
		// trainingGraph: MultimodalTrainingGraph,
	},
	// Add more types here as needed
}

export default config
