/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable no-unused-vars */
import React, { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { message } from 'antd'
import { createLabels } from 'src/api/project'
import Logo from 'src/assets/images/logoIcon.png'
import Labelling from 'src/assets/images/Labeling.png'
import 'src/assets/css/card.css'

const CreateLabel = ({ setCreateLabel, updateData }) => {
	const currentLabelWithID = useRef([])
	const { id: projectId } = useParams()
	const [labelText, setLabelText] = useState('')
	const [labelsEditing, setLabelEdit] = useState([])

	const handleAddLabel = () => {
		const text = labelText.trim()
		if (text.length <= 0) return
		const lbs = text
			.split(/\r?\n|\r|\n/g)
			.map((e) => e.toString().trim())
			.filter((e) => e.length > 0)
		if (lbs.length <= 0) return
		setLabelEdit((le) => [...le, ...lbs])
		document.getElementById('edt-label').value = ''
		setLabelText('')
	}

	const deleteLabel = (index) => {
		setLabelEdit((le) => le.filter((v, i) => i !== index))
	}

	const saveLabel = async () => {
		if (labelsEditing.length > 0) {
			const body = {
				label_choices: labelsEditing,
			}
			const res = await createLabels(projectId, body)
			currentLabelWithID.current = labelsEditing.map((v, i) => {
				return {
					id: i,
					value: v,
				}
			})
			console.log('assign label with id ', currentLabelWithID.current)
			if (currentLabelWithID.current.length >= 0) {
				setCreateLabel(false)
				updateData(currentLabelWithID.current)
			}
		} else {
			message.error('Error: label is empty!', 2)
		}
	}

	return (
		<div className="label-editor-container" id="label-editor-container">
			<div
				className={`top-0 bottom-full z-[1000] opacity-100 left-0 mb-8 fixed h-full w-full bg-white transition-all duration-500 ease flex`}
			>
				<section className="flex h-full w-4/12 flex-col overflow-y-auto bg-gray-50 pt-3">
					<h1 className="mt-10 mb-4 text-3xl text-center font-extrabold leading-none tracking-tight text-gray-900">
						Your{' '}
						<mark className="px-2 text-white bg-blue-600 rounded">
							Labels
						</mark>{' '}
						here!!!
					</h1>

					<ul className="mt-6 space-y-3 pl-10 pr-10">
						{labelsEditing.map((label, index) => (
							<li
								key={index}
								className="flex items-center justify-between px-4 py-4 bg-white rounded-lg shadow transition duration-200 ease-in-out hover:bg-gray-50"
							>
								<span className="text-lg font-semibold text-blue-600 hover:text-indigo-800">
									{label}
								</span>
								<button
									type="button"
									onClick={() => deleteLabel(index)}
									aria-label="delete label"
									className="p-2 text-red-600 transition-colors duration-200 ease-in-out hover:text-red-800"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="w-6 h-6"
										fill="currentColor"
										viewBox="0 0 30 30"
									>
										<path d="M 14.984375 2.4863281 A 1.0001 1.0001 0 0 0 14 3.5 L 14 4 L 8.5 4 A 1.0001 1.0001 0 0 0 7.4863281 5 L 6 5 A 1.0001 1.0001 0 1 0 6 7 L 24 7 A 1.0001 1.0001 0 1 0 24 5 L 22.513672 5 A 1.0001 1.0001 0 0 0 21.5 4 L 16 4 L 16 3.5 A 1.0001 1.0001 0 0 0 14.984375 2.4863281 z M 6 9 L 7.7929688 24.234375 C 7.9109687 25.241375 8.7633438 26 9.7773438 26 L 20.222656 26 C 21.236656 26 22.088031 25.241375 22.207031 24.234375 L 24 9 L 6 9 z"></path>
									</svg>
								</button>
							</li>
						))}
					</ul>

					<div className="flex items-center justify-center px-auto w-full">
						<button
							onClick={saveLabel}
							className=" text-white bg-blue-600 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
						>
							Save
						</button>
					</div>

					<div className="w-[80%] shadow-lg mt-4 ml-12 rounded-2xl">
						<img
							src={Labelling}
							loading="lazy"
							className="h-full w-full object-cover rounded-2xl"
						/>
					</div>
				</section>
				<section className="flex w-8/12 flex-col rounded-r-3xl bg-white px-4 h-max">
					<div className="mb-8 flex h-48 items-center justify-between border-b-2">
						<div className="flex items-center space-x-4">
							<div className="h-12 w-12 overflow-hidden rounded-full">
								<img
									src={Logo}
									loading="lazy"
									className="h-full w-full object-cover"
								/>
							</div>
							<div className="flex flex-col">
								<h3 className="text-lg font-semibold">
									Pixel Brain
								</h3>
								<p className="text-light text-gray-400">
									ise_uet@vnu.edu.vn
								</p>
							</div>
						</div>
					</div>
					<section className="h-max">
						<div className="flex h-max">
							<h1 className="text-3xl font-bold text-center">
								Create your labels
							</h1>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								width="24"
								height="24"
							>
								<path
									fillRule="evenodd"
									d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<article className=" leading-7 tracking-wider text-gray-500">
							<p>Dear Automler,</p>
							<p>
								In training a model, accurate labeling of data
								is crucial for achieving reliable outcomes.
								Labels serve as the ground truth that the model
								learns to predict, guiding the algorithm's
								adjustments during training. Poor labeling can
								lead to significant bias, reducing the model's
								ability to generalize to new data. Thus,
								ensuring high-quality, consistent labels is
								essential for developing an effective and robust
								machine learning model
							</p>
							<footer className="mt-12">
								<p>Thanks & Regards,</p>
								<p>Pixel Brain</p>
							</footer>
						</article>
					</section>
					<div className=" mt-12 rounded-xl border-2 border-dashed border-blue-500 bg-gray-50 h-full">
						<textarea
							id="edt-label"
							name="myInput"
							className="mt-4 ml-4 w-[97%] h-full border-0 bg-white rounded-xl p-2 text-lg text-gray-900 focus:ring-0 focus:border-0 focus:border-transparent focus:outline-none"
							placeholder="Adding your labels here!"
							rows="2"
							onChange={(evt) =>
								setLabelText(evt.target.value.toString())
							}
						></textarea>
						<div className="flex items-center justify-end p-2 ml-auto pt-0 ">
							<button
								onClick={handleAddLabel}
								type="submit"
								className="text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:outline-none font-medium rounded-lg text-sm px-5 py-2 text-center me-2"
							>
								Send
							</button>
						</div>
					</div>
				</section>
			</div>
		</div>
	)
}

export default CreateLabel
