/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useCallback, useState } from 'react'
import { ImageConfig, TextConfig, INTERFACES } from './Config'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { trainModel, autoLabel } from 'src/api/project'
import { message } from 'antd'
import { useLibrary } from 'src/utils/LibProvider'
import { updateLabel } from 'src/api/images'
import Loading from 'src/components/Loading'
import * as projectAPI from 'src/api/project'
import 'src/assets/css/card.css'
import CreateLabel from 'src/pages/project/build/labelData/createLabel/index'

const LabelingTextClassification = ({
	datas,
	pagination,
	labelsWithID,
	type,
	next,
	updateFields,
}) => {
	const currentLabelWithID = useRef(labelsWithID)
	const savedLabels = currentLabelWithID.current.map((v, i) => v.value)
	const [currentSavedLabel, setCurrentSavedLabel] = useState(savedLabels)
	let [searchParams, setSearchParams] = useSearchParams()
	const [isLoading, setIsLoading] = useState(false)
	const location = useLocation()
	// get info about project id
	const { id: projectId } = useParams()
	// for create label
	const [createLabel, setCreateLabel] = useState(savedLabels.length <= 0)
	// for labeling
	const LabelStudio = useLibrary('lsf')
	const rootRef = useRef()
	const lsf = useRef(null)
	const [currentIndex, setIndex] = useState(0)

	const updateData = (labelWithID) => {
		currentLabelWithID.current = labelWithID
		const savedLabels = currentLabelWithID.current.map((v, i) => v.value)
		setConfig(TextConfig(savedLabels))
		setCurrentSavedLabel(savedLabels)
	}

	const [currentConfig, setConfig] = useState(TextConfig(currentSavedLabel))
	console.log(currentConfig)

	useEffect(() => {
		setConfig(TextConfig(currentSavedLabel))
	}, [])

	let tempIndex = 0

	const getTask = (index) => {
		const text = datas[index]
		let annotations = []
		if (text?.label && text.label.length > 0) {
			annotations = [
				{
					result: [
						{
							value: {
								choices: [text.label],
							},
							from_name: 'choice',
							to_name: 'text',
							type: 'choices',
							origin: 'manual',
						},
					],
				},
			]
		}

		return {
			id: index,
			annotations: annotations,
			data: {
				text: text.data['data-TXT-text'],
			},
		}
	}

	const updateLabelTask = async (text, newLabel) => {
		if (text.id.length <= 0) {
			return
		}
		return await projectAPI.updateAnnotation(projectId, text.id, {
			choice: newLabel,
		})
	}

	const HandleEndLoop = () => {
		for (let img of datas) {
			if (img.label.length <= 0) {
				setIndex(0)
				return
			}
		}
		window.location.reload()
	}

	const increase = async (index) => {
		const ICR = 1
		if (index < datas.length - ICR) {
			setIndex((a) => a + ICR)
		} else {
			const { data } = await projectAPI.getProjectFullDataset(projectId)
			if (!data.files) return
			datas = data.files
			pagination = data.meta
			if (data.files.length && index < data.files.length - ICR)
				setIndex((a) => a + 1) //TODO: have new data
			else {
				HandleEndLoop()
			}
		}
	}

	const initLabelStudio = useCallback(
		(config, index) => {
			if (!LabelStudio) return
			const task = getTask(index)
			if (!task?.data) return
			console.info('Initializing LSF preview', { config, task })

			const onUpdate = async (ls, annotations) => {
				const at = annotations.serializeAnnotation()
				if (at.length > 0)
					console.log('value', at[0]['value']['choices'])
				else {
					message.error('Please annotating', 3)
					return
				}

				const newLabel = at[0]['value']['choices'][0]
				datas[index].label = newLabel
				const resultUpdate = await updateLabelTask(
					datas[index],
					newLabel
				)
				console.log('result update', resultUpdate)
				increase(index)
				message.success('Successfully Updated', 3)
			}

			const onSubmit = async (ls, annotations) => {
				const at = annotations.serializeAnnotation()
				tempIndex += 1
				if (at.length > 0)
					console.log('value', at[0]['value']['choices'])
				else {
					message.error('Please annotating', 3)
					return
				}

				const newLabel = at[0]['value']['choices'][0]
				datas[index].label = newLabel
				console.log(datas[index])
				const resultUpdate = await updateLabelTask(
					datas[index],
					newLabel
				)
				console.log('result update', resultUpdate)
				increase(index)
				message.success('Successfully Submitted', 3)
			}

			const onloadAnnotation = (LS) => {
				var c = LS.annotationStore.addAnnotation({
					userGenerate: true,
				})
				LS.annotationStore.selectAnnotation(c.id)
			}

			const onSkip = (ls, annotations) => {
				increase(index)
			}

			try {
				const lsf = new window.LabelStudio(rootRef.current, {
					config,
					task,
					interfaces: INTERFACES,
					onUpdateAnnotation: onUpdate,
					onSubmitAnnotation: onSubmit,
					onSkipTask: onSkip,
					onLabelStudioLoad: onloadAnnotation,
				})
				return lsf
			} catch (err) {
				console.error(err)
				return null
			}
		},
		[LabelStudio]
	)

	useEffect(() => {
		if (!lsf.current) {
			lsf.current = initLabelStudio(currentConfig, currentIndex)
		}
		return () => {
			if (lsf.current) {
				console.info('Destroying LSF')
				try {
					lsf.current.destroy()
				} catch (e) {}
				lsf.current = null
			}
		}
	}, [initLabelStudio, currentIndex, currentConfig])

	useEffect(() => {
		if (lsf.current?.store) {
			const store = lsf.current.store
			store.resetState()
			store.assignTask(getTask(currentIndex))
			store.initializeStore(getTask(currentIndex))
			const c = store.annotationStore.addAnnotation({
				userGenerate: true,
			})
			store.annotationStore.selectAnnotation(c.id)
			console.log('LSF task updated')
		}
	}, [currentIndex])

	useEffect(() => {
		if (lsf.current?.store) {
			lsf.current.store.assignConfig(currentConfig)
			console.log('LSF config updated')
		}
	}, [currentConfig])

	const checkData = () => {
		const currentLabeled = new Set()
		if (!datas) {
			return false
		}
		for (let index = 0; index < datas.length; index++) {
			const element = datas[index]
			const lb_tmp = element['label']
			if (lb_tmp && lb_tmp.length) currentLabeled.add(lb_tmp)
		}
		const fullLabel = new Set(currentSavedLabel)
		if (currentLabeled.size !== fullLabel.size) {
			message.error('you must label more')
			return false
		}
		return true
	}

	const handleTrain = async () => {
		if (!checkData()) return
		try {
			const { data } = await trainModel(projectId)
			const searchParams = new URLSearchParams(location.search)
			searchParams.get('experiment_name') ??
				setSearchParams((pre) =>
					pre.toString().concat(`&experiment_name=${data.task_id}`)
				)
			updateFields({ experiment_name: data.task_id })
			next()
		} catch (error) {
			console.error(error)
		}
	}

	const handleAutoLabeling = async () => {
		if (!checkData()) return
		setIsLoading(true)
		const result = await autoLabel(projectId)
		console.log(result)
		if (result.status === 200) {
			message.success('auto label successfully')
			window.location.reload()
			return
		}
		message.error("Can't auto labeling", result)
		setIsLoading(false)
	}

	return (
		<div className="label-editor-container" id="label-editor-container">
			{isLoading && <Loading />}
			<div
				className="group-hover/item:block flex 
                top-full right-0 py-4 px-3 bg-white w-[100%] rounded-md shadow-md "
			>
				<div className="relative h-full pt-4">
					<button
						onClick={() => {
							handleAutoLabeling()
						}}
						className="flex text-white bg-orange-600 rounded-lg text-sm font-bold px-3 py-2.5 text-center me-2 mb-2"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="size-4 mr-2"
						>
							<path
								fillRule="evenodd"
								d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z"
								clip-rule="evenodd"
							/>
						</svg>{' '}
						Auto Label
					</button>
				</div>

				<div className="ml-auto relative h-full pt-3">
					<button
						onClick={() => {
							handleTrain()
						}}
						className=" text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-2 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
					>
						Train Model
					</button>
				</div>
			</div>

			<div id="label-studio" ref={rootRef} />

			{/* ADD LABELS */}
			{createLabel && (
				<CreateLabel
					updateData={updateData}
					setCreateLabel={setCreateLabel}
				/>
			)}
		</div>
	)
}

export default LabelingTextClassification
