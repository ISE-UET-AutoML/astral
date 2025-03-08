// import axios from 'axios';
// import React, { Fragment, useReducer, useState } from 'react';
// import * as projectAPI from 'src/api/project';

// const TrainGraph = (props) => {
// 	const [graph_data, setGraphData] = useState('');

// 	const handleGetGraph = async (event) => {
//         event.preventDefault();
//         console.log("Executing");
//         try {
//             console.log('Fetching');
//             const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/experiments/train-history?experiment_name=lastest`, {
//                 headers: {
//                     'Content-Type': 'multipart/form-data'
//                 }
//             });
//             setGraphData(data);

//         } catch(err) {
//             console.log(err);
//         }

//     }

// 	return <>
//         <h1>Test</h1>
//         <form onSubmit={handleGetGraph}>
//             <button type="submit">Submit</button>
//         </form>
//         <div>
//             {JSON.stringify(graph_data)}

//         </div>
//     </>
// }

// export default TrainGraph;
