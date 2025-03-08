

export function fetchWithTimeout(url, options, timeout) {
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeout)
    );

    const fetchPromise = fetch(url, options)
        .then(response => {
            return response.json();
        });

    return Promise.race([fetchPromise, timeoutPromise]);
};

