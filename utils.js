export async function fetchWithRetry(url, options, retries = 5) {
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (e) {
            if (i === retries - 1) throw e;
            const delay = delays[i] || delays[delays.length - 1];
            await new Promise(res => setTimeout(res, delay));
        }
    }
}
