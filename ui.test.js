import { test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Mock DOM
global.window = {
    addEventListener: (event, handler) => {
        if (event === 'DOMContentLoaded') {
            global.window.domContentLoadedHandler = handler;
        }
    },
    innerWidth: 800,
    innerHeight: 600,
    requestAnimationFrame: () => {}
};
global.requestAnimationFrame = () => {};

class ElementMock {
    constructor(id) {
        this.id = id;
        this.classList = {
            add: mock.fn(),
            remove: mock.fn(),
            toggle: mock.fn(),
            replace: mock.fn()
        };
        this.addEventListener = (event, handler) => {
            if (!this.handlers) this.handlers = {};
            this.handlers[event] = handler;
        };
        this.innerText = '';
        this.innerHTML = '';
        this.value = '';
        this.disabled = false;
        this.style = {};
    }

    click() {
        if (this.handlers && this.handlers['click']) {
            return this.handlers['click']();
        }
    }
}

global.document = {
    createElement: () => ({
        getContext: () => ({
            createLinearGradient: () => ({ addColorStop: () => {} }),
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            fillText: () => {}
        }),
        toDataURL: () => 'data:image/png;base64,'
    }),
    getElementById: (id) => {
        if (!global.document.elements) global.document.elements = {};
        if (!global.document.elements[id]) {
            global.document.elements[id] = new ElementMock(id);
        }
        return global.document.elements[id];
    },
    body: new ElementMock('body'),
    addEventListener: () => {},
    execCommand: () => {}
};

global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

global.fetch = mock.fn();

// Better THREE mock that doesn't break
global.THREE = {
    WebGLRenderer: class { setSize() {} setPixelRatio() {} render() {} get domElement() { return new ElementMock('canvas'); } },
    Scene: class { constructor() { this.rotation = new global.THREE.Euler(); } add() {} remove() {} worldToLocal(v) { return v; } background = null; },
    PerspectiveCamera: class { constructor() { this.position = new global.THREE.Vector3(); } lookAt() {} updateProjectionMatrix() {} },
    AmbientLight: class {},
    DirectionalLight: class { constructor() { this.position = new global.THREE.Vector3(); } },
    TextureLoader: class { load() { return {}; } },
    Vector3: class { constructor() { this.x = 0; this.y = 0; this.z = 0; } set() { return this; } copy() { return this; } add() { return this; } sub() { return this; } normalize() { return this; } multiplyScalar() { return this; } distanceTo() { return 1; } applyMatrix4() { return this; } length() { return 1; } clone() { return this; } },
    Vector2: class { constructor() { this.x = 0; this.y = 0; } set() { return this; } },
    Color: class { constructor() {} set() { return this; } setHex() { return this; } setStyle() { return this; } copy() { return this; } },
    Object3D: class { constructor() { this.position = new global.THREE.Vector3(); this.rotation = new global.THREE.Euler(); this.scale = new global.THREE.Vector3(); this.updateMatrix = () => {}; } },
    PlaneGeometry: class { constructor() { this.parameters = { width: 1, height: 1 }; } },
    BoxGeometry: class {},
    SphereGeometry: class {},
    ConeGeometry: class {},
    CylinderGeometry: class {},
    TorusGeometry: class {},
    TorusKnotGeometry: class {},
    IcosahedronGeometry: class {},
    DodecahedronGeometry: class {},
    TetrahedronGeometry: class {},
    InstancedMesh: class { constructor() { this.count = 0; } setMatrixAt() {} setColorAt() {} dispose() {} instanceMatrix = { setUsage: () => {}, needsUpdate: false, array: [] }; instanceColor = { setUsage: () => {}, needsUpdate: false }; },
    MeshPhysicalMaterial: class {},
    MeshStandardMaterial: class {},
    MeshBasicMaterial: class {},
    PointsMaterial: class { constructor() { this.color = new global.THREE.Color(); } },
    Points: class { constructor() { this.geometry = new global.THREE.BufferGeometry(); this.material = new global.THREE.PointsMaterial(); } },
    BufferGeometry: class { constructor() { this.attributes = { position: { array: [] }, color: { array: [] } }; } setAttribute() {} },
    Float32BufferAttribute: class { constructor() { this.count = 0; this.array = []; } setUsage() {} },
    BufferAttribute: class { setUsage() {} },
    Matrix4: class { constructor() {} makeTranslation() { return this; } makeRotationFromEuler() { return this; } scale() { return this; } multiply() { return this; } copy() { return this; } },
    Euler: class { constructor() { this.x = 0; this.y = 0; this.z = 0; } set() { return this; } },
    Quaternion: class { constructor() {} setFromEuler() { return this; } },
    MathUtils: { randFloat: () => 0, randFloatSpread: () => 0, lerp: () => 0, smoothstep: () => 0 },
    Clock: class { getDelta() { return 0.01; } getElapsedTime() { return 1; } },
    Raycaster: class {},
    Plane: class {},
    GLTFLoader: class {},
    FogExp2: class {},
    DynamicDrawUsage: 1,
    AdditiveBlending: 2,
    DoubleSide: 3
};

// Now load ui.js
await import('./ui.js');

test('AI generation error handling displays error message', async () => {
    // We suppress console.error during the test to avoid test output clutter
    const originalConsoleError = console.error;
    console.error = () => {};

    // Call DOMContentLoaded handler to initialize UI
    global.window.domContentLoadedHandler();

    const aiBtn = global.document.getElementById('aiGenerateBtn');
    const aiInput = global.document.getElementById('aiPromptInput');
    const aiErrorMsg = global.document.getElementById('aiErrorMsg');

    aiInput.value = 'test prompt';

    // Mock fetch to fail
    let fetchCallCount = 0;
    global.fetch.mock.mockImplementation(() => {
        fetchCallCount++;
        return Promise.reject(new Error('API Error'));
    });

    // We must stub setTimeout globally so fetchWithRetry resolves immediately
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (cb) => cb();

    try {
        // Trigger AI click
        const promise = aiBtn.click();

        // Check loading state
        assert.strictEqual(aiBtn.disabled, true);
        assert.strictEqual(aiBtn.innerHTML, '✨ Weaving...');

        await promise;

        // Check error state
        assert.strictEqual(aiErrorMsg.classList.remove.mock.callCount(), 1);
        assert.strictEqual(aiErrorMsg.innerText, 'Error communicating with AI. Please check console or try again.');

        // Check reset state
        assert.strictEqual(aiBtn.disabled, false);
        assert.strictEqual(aiBtn.innerHTML, '✨ Generate');
        assert.strictEqual(aiInput.disabled, false);
    } finally {
        global.setTimeout = originalSetTimeout;
        console.error = originalConsoleError;
    }
});
