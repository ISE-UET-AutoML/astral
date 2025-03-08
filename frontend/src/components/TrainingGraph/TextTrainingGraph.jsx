import LineGraph from 'src/components/LineGraph'

const TextTrainingGraph = (props) => {
	const { trainLossGraph, val_lossGraph, val_roc_aucGraph, updateProjState } =
		props

	return (
		<div className="w-full h-max">
			<div className="relative grid gap-3 grid-cols-4 grid-rows-1 max-w-full text-gray-500 py-2.5">
				<div className="relative col-span-2 overflow-hidden  p-2 m-auto w-full h-full">
					<h1 className="mb-2 text-[7.5rem] font-extrabold leading-none tracking-tight text-gray-900">
						Training{' '}
					</h1>
					<h1 className="right-0 ml-5 mb-4 text-6xl font-extrabold leading-none tracking-tight text-gray-900 underline-draw">
						outcomes
					</h1>
				</div>
				<div className="col-span-2 overflow-hidden flex relative rounded-md bg-white border border-gray-200 shadow-lg">
					<div className=" m-auto relative flex justify-center">
						<LineGraph data={trainLossGraph} label="Train Loss" />
					</div>
				</div>
				<div className="col-span-2 overflow-hidden flex relative p-2 rounded-md bg-white border border-gray-200 shadow-lg">
					<div className="size-fit m-auto relative flex justify-center">
						<LineGraph
							data={val_lossGraph}
							label="Validation loss"
						/>
					</div>
				</div>
				<div className="col-span-2 overflow-hidden flex relative p-2 rounded-md bg-white border border-gray-200 shadow-lg">
					<div className="size-fit m-auto relative flex justify-center">
						<LineGraph
							data={val_roc_aucGraph}
							label="Validation ROC AUC"
						/>
					</div>
				</div>
			</div>

			<div className="justify-center flex w-full items-center mt-5">
				<button
					className="btn"
					onClick={() => {
						updateProjState.updateFields({
							isDoneRenderGraph: true,
						})
					}}
				>
					<svg
						height="24"
						width="24"
						fill="#FFFFFF"
						viewBox="0 0 24 24"
						data-name="Layer 1"
						id="Layer_1"
						className="sparkle"
					>
						<path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z"></path>
					</svg>

					<span className="text">Deploy Model</span>
				</button>
			</div>
		</div>
	)
}

export default TextTrainingGraph
