// import React, { Fragment, useReducer, useState } from 'react'
// import { fetchWithTimeout } from 'src/utils/timeout'
// import { explainInstance } from 'src/api/project'
// import parse from 'html-react-parser'
// import * as experimentAPI from 'src/api/experiment'

// const Explain = (props) => {
// 	const [explainImageUrl, setExplainImageUrl] = useState('')
// 	const [explainTextHTML, setExplainTextHTML] = useState('')
// 	const [selectedImageFile, setSelectedImageFile] = useState(null)
// 	const [sentence, setSentence] = useState('')

// 	const handleExplainSelectedImage = async (event) => {
// 		event.preventDefault()
// 		console.log('Executing')
// 		const item = event.target.elements.file.files[0]

// TODO: fix hardcorded values
// 		const formData = new FormData()
// 		formData.append('files', item)

// 		const experimentName = 'temp'
// 		const { data } = await experimentAPI.predictImages(
// 			experimentName,
// 			formData
// 		)

// 		console.log(data)
// 		return

// 		formData.append('userEmail', process.env.USER_EMAIL)
// 		formData.append('projectName', process.env.PROJECT_NAME)
// 		formData.append('runName', process.env.RUN_NAME)
// 		formData.append('image', item)

// 		const url = `${process.env.REACT_APP_EXPLAIN_URL}/image_classification/explain`

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
// Handle timeout or other errors here
// 				if (error.message === 'Request timed out') {
// 					console.log('The request took too long and was terminated.')
// 				}
// 			})
// 	}

// const handleHighlight = (selectedClass) => {
// 	setHighlightedClass(selectedClass)
// }

// const shouldHighlight = (word) => {
// 	const currrentClassWords = explanation.find(
// 		(item) => item.class === selectedClass
// 	).words
// 	return currrentClassWords.includes(word)
// }

// 	const handleFileChange = (event) => {
// 		const file = event.target.files[0]
// 		setSelectedImageFile(file)
// 		setExplainImageUrl('')
// 	}

// 	const handleTextChange = (event) => {
// 		setSentence(event.target.value)
// 	}

// 	const handleExplainText = async (event) => {
// 		event.preventDefault()

// TODO: fix hardcorded values
// 		const formData = new FormData()
// 		formData.append('userEmail', process.env.USER_EMAIL)
// 		formData.append('projectName', process.env.PROJECT_NAME)
// 		formData.append('runName', process.env.RUN_NAME)
// 		formData.append('text', sentence)

// 		const temp = sentence.split(/[\s,]+/)

// 		console.log(temp.map((word) => word.replace(/[()]/g, '')))

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
// 			})
// 	}

// 	const handleDeploy = async (event) => {
// 		event.preventDefault()
// 		const formData = new FormData()

// 		formData.append('userEmail', process.env.USER_EMAIL)
// 		formData.append('projectName', process.env.PROJECT_NAME)
// 		formData.append('runName', process.env.RUN_NAME)
// 		formData.append('task', 'IMAGE_CLASSIFICATION')

// 		const url = `${process.env.REACT_APP_SERVING_URL}/deploy`

// 		const options = {
// 			method: 'POST',
// 			body: formData,
// 		}

// 		fetchWithTimeout(url, options, 60000)
// 			.then((data) => {
// 				console.log(data)
// 				console.log('Model deploy successfully')
// 			})
// 			.catch((error) => {
// 				console.error('Fetch error:', error.message)
// 			})
// 	}

// 	return (
// 		<>
// 			<div>
// 				<h1>Image</h1>
// 				<form onSubmit={handleExplainSelectedImage}>
// 					<input
// 						type="file"
// 						name="file"
// 						onChange={handleFileChange}
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
// 				<form onSubmit={handleExplainText}>
// 					<input
// 						style={{
// 							border: '2px solid #ccc',
// 							borderRadius: '4px',
// 							padding: '10px',
// 							width: '100%',
// 							boxSizing: 'border-box',
// 						}}
// 						type="text"
// 						name="sentence"
// 						value={sentence}
// 						onChange={handleTextChange}
// 					/>
// 					<button type="submit">Submit</button>
// 				</form>
// 				<div>
// 					<button onClick={handleDeploy}>Deploy</button>
// 				</div>
// 				<div
// 					style={{
// 						width: '100%',
// 						maxWidth: '1000px',
// 						padding: '20px',
// 						backgroundColor: '#f9f9f9',
// 						borderRadius: '8px',
// 						overflow: 'auto',
// 					}}
// 					dangerouslySetInnerHTML={{ __html: explainTextHTML }}
// 				></div>
// 			</div>
// 		</>
// 	)
// }

// export default Explain
