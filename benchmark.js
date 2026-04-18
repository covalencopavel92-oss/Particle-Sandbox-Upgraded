import { WebGLParticleSandbox } from './engine.js';
import { performance } from 'perf_hooks';
import * as THREE from 'three';

// Mock browser APIs
global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: () => {},
    removeEventListener: () => {},
    devicePixelRatio: 1
};
global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') {
            return {
                getContext: () => ({
                    measureText: () => ({ width: 100 }),
                    fillText: () => {},
                    clearRect: () => {},
                    getImageData: () => ({ data: new Uint8ClampedArray(400) }),
                    createLinearGradient: () => ({ addColorStop: () => {} }),
                    fillRect: () => {},
                    beginPath: () => {},
                    arc: () => {},
                    fill: () => {}
                }),
                width: 100,
                height: 100,
                toDataURL: () => 'data:image/png;base64,mock',
                addEventListener: () => {},
                removeEventListener: () => {},
                style: {}
            };
        }
        return {};
    },
    getElementById: () => ({ appendChild: () => {} })
};
global.requestAnimationFrame = () => {};

const ThreeExtended = { ...THREE, GLTFLoader: class {} };
global.THREE = ThreeExtended;

global.Image = class {
    constructor() {
        setTimeout(() => this.onload && this.onload(), 0);
    }
};

const count = 500000;
const sandbox = new WebGLParticleSandbox({ count, container: global.document.createElement('div') });
sandbox.config.theme = 'custom_gradient';
sandbox.config.customColors = ['#ff0000', '#00ff00', '#0000ff'];

function runBenchmark(iterations = 20) {
    const times = [];
    console.log("Warming up...");
    // Warmup
    sandbox.applyColors();

    console.log(`Running benchmark with count=${count} for ${iterations} iterations...`);
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        // Force the color loop
        sandbox.applyColors();
        const end = performance.now();
        times.push(end - start);
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`applyColors average time over ${iterations} iterations: ${avg.toFixed(2)}ms`);
}

runBenchmark();
