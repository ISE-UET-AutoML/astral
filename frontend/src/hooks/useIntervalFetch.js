import { useEffect, useState, useRef, useCallback } from 'react';

function useIntervalFetch(
	endpointUrl, // end point url
	intervalTime, // interval time in milliseconds
	fetchOptions = {}, // fetch options
	trigger = true, // if true, the fetch will be triggered on mount and on every interval
	terminateWhenDone = false // if true, the fetch will be triggered only once
) {
	const [data, setData] = useState(null);
	const [isFetching, setIsFetching] = useState(false);
	const shouldFetchData = useRef(trigger);

	const fetchData = useCallback(async () => {
		setIsFetching(true);

		try {
			const response = await fetch(endpointUrl, fetchOptions);
			const responseData = await response.json();
			setData(responseData);

			if (terminateWhenDone) {
				shouldFetchData.current = false;
			}
		} catch (error) {
			console.error(error);
		}

		setIsFetching(false);
	}, [endpointUrl, fetchOptions, terminateWhenDone]);

	useEffect(() => {
		shouldFetchData.current = trigger;
	}, [trigger]);

	useEffect(() => {
		const fetchDataInterval = setInterval(() => {
			if (shouldFetchData.current) {
				fetchData();
			}
		}, intervalTime);

		if (shouldFetchData.current) {
			fetchData();
		}

		return () => clearInterval(fetchDataInterval);
	}, [fetchData, intervalTime]);

	const refetchData = useCallback(() => {
		shouldFetchData.current = true;
		fetchData();
	}, [fetchData]);

	return { data, isFetching, refetchData };
}

export default useIntervalFetch;
