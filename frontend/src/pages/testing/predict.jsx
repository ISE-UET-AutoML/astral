// import React, { Fragment, useReducer, useState } from 'react'
// import { fetchWithTimeout } from 'src/utils/timeout'
// import { explainInstance } from 'src/api/project'
// import parse from 'html-react-parser'

// const TestPredict = (props) => {
// 	const [explainImageUrl, setExplainImageUrl] = useState('')
// 	const [selectedImageFile, setSelectedImageFile] = useState(null)
// 	const [selectedTextFile, setSelectedTextFile] = useState(null)
// 	const [predictions, setPredictions] = useState(null)
// 	const [explainTextHTML, setExplainTextHTML] = useState('')
// 	const [sentence, setExplainText] = useState('')

// 	const handlePredictSelectedImage = async (event) => {
// 		event.preventDefault()
// 		console.log('Executing')
// 		const item = event.target.elements.file.files[0]

// 		// TODO: fix hardcorded values
// 		const formData = new FormData()
// 		formData.append('userEmail', 'darklord1611')
// 		formData.append('projectName', '66bdc72c8197a434278f525d')
// 		formData.append('runName', experimentName)
// 		//formData.append('runName', 'ISE')
// 		formData.append('image', item)

// 		const url = `${process.env.REACT_APP_EXPLAIN_URL}/image_classification/temp_predict`

// 		const options = {
// 			method: 'POST',
// 			body: formData,
// 		}

// 		fetchWithTimeout(url, options, 60000)
// 			.then((data) => {
// 				const base64_image_str = data.explain_image
// 				const explain_image_str = `data:image/jpeg;base64,${base64_image_str}`
// 				setExplainImageUrl(explain_image_str)
// 				console.log('Fetch successful')
// 			})
// 			.catch((error) => {
// 				console.error('Fetch error:', error.message)
// 				// Handle timeout or other errors here
// 				if (error.message === 'Request timed out') {
// 					console.log('The request took too long and was terminated.')
// 				}
// 			})
// 	}

// 	const handleImageFileChange = (event) => {
// 		const file = event.target.files[0]
// 		setSelectedImageFile(file)
// 		setExplainImageUrl('')
// 	}

// 	const handleTextFileChange = (event) => {
// 		const file = event.target.files[0]
// 		setSelectedTextFile(file)
// 	}

// 	const handlePredictText = async (event) => {
// 		event.preventDefault()

// 		// TODO: fix hardcorded values
// 		const formData = new FormData()
// 		formData.append('userEmail', 'darklord1611')
// 		formData.append('projectName', '66bdc72c8197a434278f525d')
// 		formData.append('runName', experimentName)
// 		//formData.append('runName', 'ISE')
// 		formData.append('csv_file', selectedTextFile)

// 		const url = `${process.env.REACT_APP_EXPLAIN_URL}/text_prediction/temp_predict`

// 		const options = {
// 			method: 'POST',
// 			body: formData,
// 		}

// 		fetchWithTimeout(url, options, 60000)
// 			.then((data) => {
// 				console.log(data)

// 				const prediction = data.predictions.map((item) => ({
// 					sentence: item.sentence,
// 					confidence: item.confidence,
// 					label: item.class,
// 				}))

// 				setPredictions(prediction)
// 				console.log('Fetch successful')
// 			})
// 			.catch((error) => {
// 				console.error('Fetch error:', error.message)
// 				// Handle timeout or other errors here
// 				if (error.message === 'Request timed out') {
// 					console.log('The request took too long and was terminated.')
// 				}
// 			})
// 	}

// 	const handleExplainText = async (event) => {
// 		event.preventDefault()

// 		// TODO: fix hardcorded values
// 		const formData = new FormData()
// 		formData.append('userEmail', 'darklord1611')
// 		formData.append('projectName', '66bdc72c8197a434278f525d')
// 		formData.append('runName', experimentName)
// 		//formData.append('runName', 'ISE')
// 		formData.append('text', sentence)

// 		const url = `${process.env.REACT_APP_EXPLAIN_URL}/text_prediction/explain`

// 		const options = {
// 			method: 'POST',
// 			body: formData,
// 		}

// 		fetchWithTimeout(url, options, 60000)
// 			.then((data) => {
// 				const html = data.explain_html
// 				setExplainTextHTML(html)
// 				console.log(html)
// 				const parsedHTML = new DOMParser().parseFromString(
// 					html,
// 					'text/html'
// 				)
// 				const scriptContent =
// 					parsedHTML.querySelector('script').textContent
// 				// Create a script element
// 				const script = document.createElement('script')

// 				// Set the script content to execute
// 				script.textContent = scriptContent

// 				// Append the script element to the document body or head
// 				// You can choose where to append it based on your needs
// 				document.body.appendChild(script)

// 				console.log('Fetch successful')
// 			})
// 			.catch((error) => {
// 				console.error('Fetch error:', error.message)
// 				// Handle timeout or other errors here
// 				if (error.message === 'Request timed out') {
// 					console.log('The request took too long and was terminated.')
// 				}
// 			})
// 	}

// 	const handleSelectedText = async (item) => {
// 		setExplainText(item.sentence)
// 	}

// 	return (
// 		<>
// 			<div>
// 				<h1>Image</h1>
// 				<form onSubmit={handlePredictSelectedImage}>
// 					<input
// 						type="file"
// 						name="file"
// 						onChange={handleImageFileChange}
// 					/>
// 					<button type="submit">Submit</button>
// 				</form>
// 				<div
// 					style={{
// 						display: 'flex',
// 						justifyContent: 'space-around',
// 						marginTop: '20px',
// 					}}
// 				>
// 					{selectedImageFile && (
// 						<img
// 							src={URL.createObjectURL(selectedImageFile)}
// 							alt="Selected"
// 							className="rounded-md"
// 							style={{ width: '30%' }}
// 						/>
// 					)}
// 					{explainImageUrl && (
// 						<img
// 							src={explainImageUrl}
// 							alt="Explain"
// 							className="rounded-md"
// 							style={{ width: '30%' }}
// 						/>
// 					)}
// 				</div>
// 			</div>

// 			<div>
// 				<h1>Text</h1>
// 				<form onSubmit={handlePredictText}>
// 					<input
// 						type="file"
// 						name="text_file"
// 						onChange={handleTextFileChange}
// 					/>
// 					<button type="submit">Submit</button>
// 				</form>
// 			</div>

// 			{predictions ? (
// 				<div>
// 					<table style={{ maxWidth: '500px' }}>
// 						<thead>
// 							<tr>
// 								<th>Sentence</th>
// 								<th>Confidence</th>
// 								<th>Label</th>
// 							</tr>
// 						</thead>
// 						<tbody className="bg-white divide-y divide-gray-200">
// 							{predictions.map((item, index) => (
// 								<tr
// 									key={index}
// 									onClick={() => handleSelectedText(item)}
// 									className={`hover:bg-gray-100 cursor-pointer ${sentence === item.sentence ? 'border-2 border-blue-500' : ''}`}
// 								>
// 									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
// 										{item.sentence}
// 									</td>
// 									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// 										{item.confidence}
// 									</td>
// 									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// 										{item.label}
// 									</td>
// 			{predictions ? (
// 				<div>
// 					<table style={{ maxWidth: '500px' }}>
// 						<thead>
// 							<tr>
// 								<th>Sentence</th>
// 								<th>Confidence</th>
// 								<th>Label</th>
// 							</tr>
// 						</thead>
// 						<tbody className="bg-white divide-y divide-gray-200">
// 							{predictions.map((item, index) => (
// 								<tr
// 									key={index}
// 									onClick={() => handleSelectedText(item)}
// 									className={`hover:bg-gray-100 cursor-pointer ${sentence === item.sentence ? 'border-2 border-blue-500' : ''}`}
// 								>
// 									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
// 										{item.sentence}
// 									</td>
// 									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// 										{item.confidence}
// 									</td>
// 									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// 										{item.label}
// 									</td>
// 								</tr>
// 							))}
// 						</tbody>
// 					</table>
// 					<div>
// 						<button onClick={handleExplainText}>Explain</button>
// 					</div>
// 					<div
// 						style={{
// 							width: '100%',
// 							maxWidth: '1000px',
// 							padding: '20px',
// 							backgroundColor: '#f9f9f9',
// 							borderRadius: '8px',
// 							overflow: 'auto',
// 						}}
// 						dangerouslySetInnerHTML={{ __html: explainTextHTML }}
// 					></div>
// 				</div>
// 			) : (
// 				<p>Error</p>
// 			)}

// 					<div>
// 						<button onClick={handleExplainText}>Explain</button>
// 					</div>
// 					<div
// 						style={{
// 							width: '100%',
// 							maxWidth: '1000px',
// 							padding: '20px',
// 							backgroundColor: '#f9f9f9',
// 							borderRadius: '8px',
// 							overflow: 'auto',
// 						}}
// 						dangerouslySetInnerHTML={{ __html: explainTextHTML }}
// 					></div>
// 				</div>
// 			) : (
// 				<p>Error</p>
// 			)}
// 		</>
// 	)
// }

// export default TestPredict
