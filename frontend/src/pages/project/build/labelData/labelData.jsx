import { listData } from 'src/api/project'
import { useLocation } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import React, { memo, useEffect } from 'react'
import Loading from 'src/components/Loading'
import config from '../config'

const LabelData = ({
	files,
	labels,
	pagination,
	updateFields,
	projectInfo,
}) => {
	/*------------------------------------- OLD CODE ----------------------------------------*/
	/*
	let [searchParams, setSearchParams] = useSearchParams()
	const location = useLocation()
	useEffect(() => {
		const searchParams = new URLSearchParams(location.search)
		searchParams.get('step') ??
			setSearchParams((pre) => pre.toString().concat('&step=1'))
	}, [])

	if (files && projectInfo) {
		let isUnlabelledData = false
		for (let i = 0; i < files.length; i++) {
			if (
				!files[i]?.data ||
				!files[i].data?.label ||
				files[i].data.label.length <= 0
			) {
				isUnlabelledData = true
				break
			}
		}
		if (isUnlabelledData) {
			const LabelComponent = config[projectInfo.type].labelingView
			return (
				<div>
					<LabelComponent
						datas={files}
						labelsWithID={labels}
						updateFields={updateFields}
						type={projectInfo.type}
						next={() => {
							updateFields({
								isDoneLabelData: true,
							})
						}}
						pagination={pagination}
					/>
				</div>
			)
		}

		const PreviewComponent = config[projectInfo.type].trainPreview

		return (
			<div>
				<PreviewComponent
					datas={files}
					updateFields={updateFields}
					next={() => {
						updateFields({
							isDoneLabelData: true,
						})
					}}
					pagination={pagination}
				/>
			</div>
		)
	}
	*/
	/*------------------------------------- OLD CODE ----------------------------------------*/

	return (
		<div>
			<p>Config your instance</p>
		</div>
	)
}

export default memo(LabelData)
