import { test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { WebGLParticleSandbox } from './engine.js';

let originalDocument;
let originalConsoleWarn;
let originalRequestAnimationFrame;

// Setup mock THREE before anything else
global.THREE = {
    Scene: class {
        constructor() { this.background = null; this.fog = null; }
        add() {}
        remove() {}
    },
    FogExp2: class { constructor() {} },
    PerspectiveCamera: class {
        constructor() { this.position = { set: () => {}, z: 0 }; this.lookAt = () => {}; }
    },
    WebGLRenderer: class {
        constructor() { this.domElement = { addEventListener: () => {} }; }
        setPixelRatio() {}
        setSize() {}
        render() {}
    },
    Vector3: class {
        constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
        fromBufferAttribute() { return this; }
        copy(v) { this.x = v?.x || 0; this.y = v?.y || 0; this.z = v?.z || 0; return this; }
        sub(v) { this.x -= v?.x || 0; this.y -= v?.y || 0; this.z -= v?.z || 0; return this; }
        length() { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
        normalize() { return this; }
        multiplyScalar() { return this; }
        set(x, y, z) { this.x = x; this.y = y; this.z = z; }
    },
    Color: class {
        constructor(r, g, b) { this.r = r; this.g = g; this.b = b; }
        set() {}
        setRGB() {}
        setHex() {}
        setStyle() {}
    },
    Raycaster: class {
        setFromCamera() {}
        intersectObject() { return []; }
    },
    Plane: class {
        constructor(normal, constant) { this.normal = normal; this.constant = constant; }
        intersectLine() { return new global.THREE.Vector3(0,0,0); }
    },
    GLTFLoader: class {
        load(url, callback) { this.callback = callback; }
    },
    Object3D: class {
        constructor() { this.matrix = {}; }
        updateMatrix() {}
    },
    InstancedMesh: class {
        constructor() { this.instanceMatrix = { needsUpdate: false }; this.instanceColor = { needsUpdate: false }; }
        setMatrixAt() {}
        setColorAt() {}
        computeBoundingSphere() {}
    },
    MeshBasicMaterial: class {},
    BufferGeometry: class {
        constructor() { this.attributes = {}; }
        setAttribute(name, attr) { this.attributes[name] = attr; }
        clone() {
            const cloned = new global.THREE.BufferGeometry();
            for (let key in this.attributes) {
                cloned.setAttribute(key, this.attributes[key]);
            }
            return cloned;
        }
        applyMatrix4() {}
        computeVertexNormals() {}
        toNonIndexed() { return this; }
        center() { return this; }
    },
    BufferAttribute: class {
        constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; this.count = array.length / itemSize; }
        getX(i) { return this.array[i * this.itemSize]; }
        getY(i) { return this.array[i * this.itemSize + 1]; }
        getZ(i) { return this.array[i * this.itemSize + 2]; }
    },
    CanvasTexture: class {
        constructor() { this.needsUpdate = false; }
    },
    PlaneGeometry: class { constructor() {} },
    Mesh: class { constructor() { this.position = { setZ: () => {}, copy: () => {} }; this.lookAt = () => {}; } },
    DynamicDrawUsage: 'DynamicDrawUsage',
    BufferGeometryUtils: {
        mergeBufferGeometries: () => {}
    },
    AmbientLight: class { constructor() {} },
    DirectionalLight: class { constructor() { this.position = { set: () => {} }; } },
    Shape: class {},
    ShapeGeometry: class { constructor() {} },
    EdgesGeometry: class { constructor() {} },
    LineBasicMaterial: class {},
    LineSegments: class { constructor() {} },
    PointsMaterial: class { constructor() {} },
    Points: class { constructor() {} },
    AdditiveBlending: 'AdditiveBlending',
    TextureLoader: class { constructor() { this.load = () => {}; } },
    Matrix4: class {
        makeRotationX() { return this; }
        makeRotationY() { return this; }
        makeRotationZ() { return this; }
        makeScale() { return this; }
        makeTranslation() { return this; }
        multiply() { return this; }
        setPosition() { return this; }
    }
};

beforeEach(() => {
    originalDocument = global.document;
    global.document = {
        createElement: (tag) => {
            if (tag === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: () => ({
                        createLinearGradient: () => ({ addColorStop: () => {} }),
                        beginPath: () => {},
                        arc: () => {},
                        fill: () => {},
                        fillText: () => {}
                    }),
                    toDataURL: () => 'data:image/png;base64,'
                };
            }
            return {};
        },
        getElementById: () => ({ width: 800, height: 600, appendChild: () => {}, offsetWidth: 800, offsetHeight: 600 }),
        addEventListener: () => {}
    };
    originalConsoleWarn = console.warn;
    originalRequestAnimationFrame = global.requestAnimationFrame;

    // global window
    global.window = {
        addEventListener: () => {},
        innerWidth: 800,
        innerHeight: 600,
        devicePixelRatio: 1
    };
    // Mock requestAnimationFrame to NOT loop indefinitely
    let calledOnce = false;
    global.requestAnimationFrame = (cb) => {
        if(!calledOnce) {
            calledOnce = true;
            cb();
        }
    };
});

afterEach(() => {
    global.document = originalDocument;
    console.warn = originalConsoleWarn;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    delete global.window;
});

test('WebGLParticleSandbox instantiates with mocked THREE', () => {
    // Avoid animation loop looping too many times
    WebGLParticleSandbox.prototype.animate = mock.fn();
    WebGLParticleSandbox.prototype.applyShape = mock.fn();
    const sandbox = new WebGLParticleSandbox('test-container');
    assert.ok(sandbox);
});

test('generateModelTargets catches BufferGeometryUtils.mergeBufferGeometries error', () => {
    WebGLParticleSandbox.prototype.animate = mock.fn();
    const sandbox = new WebGLParticleSandbox('test-container');

    // Mock the loader's load method to simulate loading a valid GLTF scene
    const mockGLTF = {
        scene: {
            traverse: (callback) => {
                const child = {
                    isMesh: true,
                    geometry: new global.THREE.BufferGeometry(),
                    material: { color: new global.THREE.Color(1, 0, 0) },
                    matrixWorld: {},
                    updateMatrixWorld: () => {}
                };
                child.geometry.setAttribute('position', new global.THREE.BufferAttribute([0, 0, 0, 1, 1, 1], 3));
                child.geometry.setAttribute('color', new global.THREE.BufferAttribute([1, 0, 0, 0, 1, 0], 3));

                callback(child);
            }
        }
    };

    sandbox.gltfLoader.load = (url, callback) => {
        callback(mockGLTF);
    };

    sandbox.config.shape = 'uploaded_model';
    sandbox.config.modelDataUrl = 'fake-url.gltf';

    let warnMessage = '';
    console.warn = (msg, err) => {
        warnMessage = msg;
    };

    // Setup mergeBufferGeometries to throw
    global.THREE.BufferGeometryUtils.mergeBufferGeometries = () => {
        throw new Error('Test Merge Error');
    };

    let applyShapeCalled = false;
    sandbox.applyShape = () => { applyShapeCalled = true; };

    sandbox.generateModelTargets();

    assert.strictEqual(warnMessage, 'Could not merge uploaded model geometries:');
    assert.ok(sandbox.uploadedModelGeometry);
    assert.strictEqual(applyShapeCalled, true);
});
