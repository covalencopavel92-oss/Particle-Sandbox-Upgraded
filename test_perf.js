import * as THREE from 'three';
import { performance } from 'perf_hooks';

const count = 500000;
const customColors = ['#ff0000', '#00ff00', '#0000ff'];
const colors = new Float32Array(count * 3);

function benchmarkOld() {
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const cObj = new THREE.Color();
        const ratio = i / count;
        const scaled = ratio * (customColors.length - 1);
        const idx = Math.floor(scaled);
        const t = scaled - idx;
        cObj.set(customColors[idx]).lerp(new THREE.Color(customColors[Math.min(idx+1, customColors.length-1)]), t);

        colors[i3] = cObj.r; colors[i3+1] = cObj.g; colors[i3+2] = cObj.b;
    }
}

function benchmarkNew() {
    const tempColor = new THREE.Color();
    const targetColor = new THREE.Color();
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const ratio = i / count;
        const scaled = ratio * (customColors.length - 1);
        const idx = Math.floor(scaled);
        const t = scaled - idx;
        tempColor.set(customColors[idx]).lerp(targetColor.set(customColors[Math.min(idx+1, customColors.length-1)]), t);

        colors[i3] = tempColor.r; colors[i3+1] = tempColor.g; colors[i3+2] = tempColor.b;
    }
}

function run() {
    console.log("Warming up...");
    benchmarkOld();
    benchmarkNew();

    const iterations = 20;

    let totalOld = 0;
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        benchmarkOld();
        totalOld += performance.now() - start;
    }
    const avgOld = totalOld / iterations;

    let totalNew = 0;
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        benchmarkNew();
        totalNew += performance.now() - start;
    }
    const avgNew = totalNew / iterations;

    console.log(`Average Old: ${avgOld.toFixed(2)}ms`);
    console.log(`Average New: ${avgNew.toFixed(2)}ms`);
    console.log(`Improvement: ${((avgOld - avgNew) / avgOld * 100).toFixed(2)}%`);
}

run();
