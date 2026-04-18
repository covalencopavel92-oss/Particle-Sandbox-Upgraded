export function createDefaultImageDataUrl() {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 200;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0,0,200,200);
    grad.addColorStop(0, '#00f2fe');
    grad.addColorStop(1, '#4facfe');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IMG', 100, 100);
    return c.toDataURL();
}

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
