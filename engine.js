import { createDefaultImageDataUrl } from './utils.js';

export class WebGLParticleSandbox {
            constructor(containerId) {
                this.canvas = document.getElementById(containerId);

                this.config = {
                    count: 30000,
                    size: 5.0,
                    speed: 1.0,
                    opacity: 0.9,
                    friction: 1.00,
                    chaos: 0.0,
                    theme: 'cyber_gold',
                    customColors: ['#ffaa00', '#06b6d4'],
                    behavior: 'blackhole',
                    shape: '3d_cube',
                    mouseAction: 'repel',
                    clickAction: 'shockwave',
                    mouseRadius: 250,
                    textMorph: 'SUPREME\nWEBGL',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 900,
                    fontSize: 100,
                    textDepth: 80,
                    imageScale: 100,
                    imageDepth: 80,
                    imageBrightness: 100,
                    imageContrast: 100,
                    imageSaturation: 100,
                    imageDataUrl: createDefaultImageDataUrl(),
                    imageColorMode: 'original',
                    modelScale: 100,
                    modelDataUrl: null,
                    modelColorMode: 'original',
                    morphSpeed: 0.05,
                    morphMode: 'none',
                    gSpinX: 0.0,
                    gSpinY: 0.0,
                    gSpinZ: 0.0,
                    spinX: 0.02,
                    spinY: 0.05,
                    spinZ: 0.00,
                    globalDepth: 1.0,
                    cameraZoom: 1200,
                    bgMode: 'none',
                    bgImageUrl: null,
                    bgDepth: 500,
                    bgDensity: 150,
                    bgSize: 3.0,
                    bgDistance: -1500,
                    customShapeType: 'torus_knot',
                    customParam1: 50,
                    customParam2: 50,
                    customParam3: 50,
                    customParam4: 50,
                    customParticleImage: null,
                    savedCustomShapes: []
                };

                this.palettes = {
                    cyber_gold: [0xffd700, 0xffaa00, 0x8b6508, 0xffe4b5],
                    synth_chrome: [0xe0e5ec, 0xffffff, 0x8892b0, 0xccd6f6],
                    obsidian_glow: [0x111111, 0x222222, 0xff0055, 0x444444],
                    ruby_laser: [0xff0000, 0x8b0000, 0xff4500, 0x3e0000],
                    neon_plastic: [0xff1493, 0x00ffff, 0x39ff14, 0xff00ff],
                    frosted_glass: [0xffffff, 0xe0ffff, 0xadd8e6, 0xf0f8ff],
                    toxic_mutant: [0x39ff14, 0x00ff00, 0x2e8b57, 0x006400],
                    deep_space: [0x000000, 0x0b3d91, 0x1e2761, 0x7a2048],
                    pearl_iridescent: [0xfffafa, 0xffb6c1, 0xadd8e6, 0x98fb98],
                    plasma_storm: [0x9400d3, 0x4b0082, 0xff00ff, 0x00ffff],
                    bioluminescence: [0x00f2fe, 0x4facfe, 0x002244, 0x00ff9f],
                    vaporwave_26: [0xff00ff, 0x00ffff, 0x8a2be2, 0xffb6c1],
                    holographic: [0xe0e5ec, 0xffa07a, 0x87cefa, 0xdda0dd, 0x98fb98],
                    solar_flare: [0xffea00, 0xff8c00, 0xff0000, 0x8b0000],
                    cyber_jade: [0x00ffcc, 0x00b386, 0x00664d, 0x003326],
                    stardust: [0xffffff, 0xf0f8ff, 0xe6e6fa, 0xb0e0e6],
                };

                this.mouse = new THREE.Vector3(-9999, -9999, 0);
                this.mouseTarget = new THREE.Vector3(-9999, -9999, 0);
                this.clickPos = new THREE.Vector3(-9999, -9999, 0);
                this.isClicking = false;
                this.processClick = false;

                this.raycaster = new THREE.Raycaster();
                this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

                this.gltfLoader = new THREE.GLTFLoader();

                this.time = 0;
                this.shapeCache = {};
                this.geoCache = {};
                this.lastTapTime = 0;

                this.savedImageTargets = null;
                this.savedImageColors = null;
                this.hasSavedImage = false;

                this.isLightMode = false;
                this.uploadedModelGeometry = null;

                // Cache state tracking
                this.cachedModelUrl = null;
                this.cachedValidVertices = null;
                this.cachedModelW = 0;
                this.cachedModelH = 0;
                this.cachedModelD = 0;
                this.cachedMinX = 0;
                this.cachedMinY = 0;
                this.cachedMinZ = 0;

                this.bgPoints = null;
                this.bgPlane = null;

                // Pre-allocated objects for performance optimization in the render loop
                this._reusableVector = new THREE.Vector3();
                this._reusableColor = new THREE.Color();
                this._reusableObject3D = new THREE.Object3D();

                this.init();
            }

            getShapeTexture(shape) {
                if (this.shapeCache[shape]) return this.shapeCache[shape];
                const canvas = document.createElement('canvas');
                canvas.width = 128; canvas.height = 128;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 10; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
                const cx = 64, cy = 64, r = 50;
                ctx.translate(cx, cy); ctx.beginPath();
                if (shape === 'square') { ctx.fillRect(-r, -r, r*2, r*2); }
                else if (shape === 'circle') { ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); }
                else if (shape === 'ring') { ctx.arc(0, 0, r, 0, Math.PI*2); ctx.stroke(); }
                else if (shape === 'triangle') { ctx.moveTo(0,-r); ctx.lineTo(r*0.866, r*0.5); ctx.lineTo(-r*0.866, r*0.5); ctx.fill(); }
                else if (shape === 'star') {
                    for(let i=0;i<5;i++){ ctx.lineTo(Math.cos((18+i*72)*Math.PI/180)*r, -Math.sin((18+i*72)*Math.PI/180)*r); ctx.lineTo(Math.cos((54+i*72)*Math.PI/180)*r*0.4, -Math.sin((54+i*72)*Math.PI/180)*r*0.4); } ctx.fill();
                }
                else if (shape === 'hexagon') { for(let i=0;i<6;i++){ ctx.lineTo(Math.cos(i*Math.PI/3)*r, Math.sin(i*Math.PI/3)*r); } ctx.fill(); }
                else if (shape === 'heart') {
                    ctx.moveTo(0, r*0.3); ctx.bezierCurveTo(r, -r*0.5, r*1.8, r*0.2, 0, r); ctx.bezierCurveTo(-r*1.8, r*0.2, -r, -r*0.5, 0, r*0.3); ctx.fill();
                }
                const tex = new THREE.CanvasTexture(canvas);
                this.shapeCache[shape] = tex;
                return tex;
            }

            createParametricGeometry(type, param1, param2, param3, param4, r) {
                const p1 = param1 / 100;
                const p2 = param2 / 100;
                const p3 = param3 / 100;
                const p4 = param4 / 100;
                let geo;

                if (type === 'torus_knot' || type === '3d_torusknot') {
                    const radius = r * 0.2 + (p1 * r * 1.5);
                    const tube = r * 0.05 + (p2 * r * 0.8);
                    const p = Math.floor(p3 * 10) + 1;
                    const q = Math.floor(p4 * 10) + 1;
                    geo = new THREE.TorusKnotGeometry(radius, tube, 64, 16, p, q);
                } else if (type === 'flower') {
                    const shape2d = new THREE.Shape();
                    const pts = Math.floor(p1 * 17) + 3;
                    const inner = r * 0.1 + (p2 * r * 0.8);
                    const outer = r * 1.5;
                    for(let i=0; i<pts*2; i++){
                        const l = i%2===0 ? outer : inner;
                        const a = (i/(pts*2))*Math.PI*2;
                        if(i===0) shape2d.moveTo(Math.cos(a)*l, Math.sin(a)*l);
                        else shape2d.lineTo(Math.cos(a)*l, Math.sin(a)*l);
                    }
                    const depth = r * 0.1 + (p3 * r * 2.0);
                    const bevelThickness = p4 * r * 0.3;
                    geo = new THREE.ExtrudeGeometry(shape2d, { depth: depth, bevelEnabled: p4 > 0.05, bevelThickness: bevelThickness, bevelSize: bevelThickness, bevelSegments: 2 });
                    geo.center();
                } else if (type === 'prism' || type === '3d_cylinder' || type === '3d_tube') {
                    const radTop = p1 * r * 2;
                    const radBot = p2 * r * 2;
                    const height = r * 0.5 + (p3 * r * 4);
                    const segments = Math.floor(p4 * 32) + 3;
                    geo = new THREE.CylinderGeometry(radTop, radBot, height, segments);
                    geo.center();
                } else if (type === '3d_cube') {
                    const seg = Math.max(1, Math.floor(p4 * 10));
                    geo = new THREE.BoxGeometry(p1 * r * 3 || 0.1, p2 * r * 3 || 0.1, p3 * r * 3 || 0.1, seg, seg, seg);
                } else if (type === '3d_sphere') {
                    const wSeg = Math.max(3, Math.floor(p2 * 32));
                    const hSeg = Math.max(2, Math.floor(p3 * 32));
                    geo = new THREE.SphereGeometry(p1 * r * 2 || 0.1, wSeg, hSeg);
                    geo.scale(1, 1, p4 * 2 || 0.01);
                } else if (type === '3d_pyramid' || type === '3d_cone') {
                    const radSeg = Math.max(3, Math.floor(p3 * 32));
                    const hSeg = Math.max(1, Math.floor(p4 * 10));
                    geo = new THREE.ConeGeometry(p1 * r * 2 || 0.1, p2 * r * 4 || 0.1, radSeg, hSeg);
                } else if (type === '3d_diamond' || type === '3d_tetrahedron' || type === '3d_icosahedron' || type === '3d_dodecahedron' || type === '3d_gem') {
                    const detail = Math.floor(p2 * 5);
                    if (type === '3d_tetrahedron') geo = new THREE.TetrahedronGeometry(p1 * r * 2 || 0.1, detail);
                    else if (type === '3d_icosahedron') geo = new THREE.IcosahedronGeometry(p1 * r * 2 || 0.1, detail);
                    else if (type === '3d_dodecahedron') geo = new THREE.DodecahedronGeometry(p1 * r * 2 || 0.1, detail);
                    else geo = new THREE.OctahedronGeometry(p1 * r * 2 || 0.1, detail);
                    geo.scale(1, p3 * 2 || 0.01, p4 * 2 || 0.01);
                } else if (type === '3d_torus') {
                    const rad = p1 * r * 2 || 0.1;
                    const tub = p2 * r || 0.1;
                    const rSeg = Math.max(3, Math.floor(p3 * 32));
                    const tSeg = Math.max(3, Math.floor(p4 * 100));
                    geo = new THREE.TorusGeometry(rad, tub, rSeg, tSeg);
                } else if (type === '3d_capsule') {
                    const wSeg = Math.max(3, Math.floor(p3 * 32));
                    const hSeg = Math.max(2, Math.floor(p4 * 32));
                    geo = new THREE.SphereGeometry(p1 * r * 2 || 0.1, wSeg, hSeg);
                    geo.scale(1, 1 + p2 * 4, 1);
                } else if (type === '3d_star') {
                    const shape2d = new THREE.Shape();
                    const pts = Math.max(3, Math.floor(p3 * 16));
                    const outer = p1 * r * 3 || 0.1;
                    const inner = p2 * r * 2 || 0.05;
                    for(let i=0; i<pts*2; i++){
                        const l = i%2===0 ? outer : inner;
                        const a = (i/(pts*2))*Math.PI*2;
                        if(i===0) shape2d.moveTo(Math.sin(a)*l, Math.cos(a)*l);
                        else shape2d.lineTo(Math.sin(a)*l, Math.cos(a)*l);
                    }
                    geo = new THREE.ExtrudeGeometry(shape2d, { depth: p4 * r * 2 || 0.1, bevelEnabled: true, bevelThickness: r*0.05, bevelSize: r*0.05, bevelSegments: 1 });
                    geo.center();
                } else if (type === '3d_gear') {
                    const shape2d = new THREE.Shape();
                    const teeth = Math.max(3, Math.floor(p3 * 32));
                    const outer = p1 * r * 2 || 0.1;
                    const inner = p2 * r * 1.5 || 0.05;
                    for(let i=0; i<teeth*2; i++){
                        const a = (i/(teeth*2)) * Math.PI * 2;
                        const dist = i%2===0 ? outer : inner;
                        if(i===0) shape2d.moveTo(Math.cos(a)*dist, Math.sin(a)*dist);
                        else shape2d.lineTo(Math.cos(a)*dist, Math.sin(a)*dist);
                    }
                    if (p4 > 0) {
                        const holePath = new THREE.Path();
                        holePath.absarc(0, 0, p4 * r || 0.01, 0, Math.PI*2, false);
                        shape2d.holes.push(holePath);
                    }
                    geo = new THREE.ExtrudeGeometry(shape2d, { depth: r*0.5, bevelEnabled: true, bevelThickness: r*0.05, bevelSize: r*0.05, bevelSegments: 1 });
                    geo.center();
                } else if (type === '3d_cross' || type === '3d_heart' || type === '3d_letter') {
                    const shape2d = new THREE.Shape();
                    if (type === '3d_cross') {
                        const w = r*0.4, l = r;
                        shape2d.moveTo(-w, l); shape2d.lineTo(w, l); shape2d.lineTo(w, w);
                        shape2d.lineTo(l, w); shape2d.lineTo(l, -w); shape2d.lineTo(w, -w);
                        shape2d.lineTo(w, -l); shape2d.lineTo(-w, -l); shape2d.lineTo(-w, -w);
                        shape2d.lineTo(-l, -w); shape2d.lineTo(-l, w); shape2d.lineTo(-w, w); shape2d.lineTo(-w, l);
                    } else if (type === '3d_heart') {
                        shape2d.moveTo(0, r*0.3); shape2d.bezierCurveTo(r, -r*0.5, r*1.8, r*0.2, 0, r); shape2d.bezierCurveTo(-r*1.8, r*0.2, -r, -r*0.5, 0, r*0.3);
                    } else {
                        shape2d.moveTo(0, r); shape2d.lineTo(r*0.6, -r); shape2d.lineTo(r*0.2, -r);
                        shape2d.lineTo(r*0.1, -r*0.3); shape2d.lineTo(-r*0.1, -r*0.3);
                        shape2d.lineTo(-r*0.2, -r); shape2d.lineTo(-r*0.6, -r); shape2d.lineTo(0, r);
                        const hole = new THREE.Path();
                        hole.moveTo(0, r*0.4); hole.lineTo(r*0.15, -r*0.1); hole.lineTo(-r*0.15, -r*0.1); hole.lineTo(0, r*0.4);
                        shape2d.holes.push(hole);
                    }
                    geo = new THREE.ExtrudeGeometry(shape2d, { depth: p2 * r * 2 || 0.1, bevelEnabled: p3 > 0, bevelSize: p3 * r * 0.5, bevelThickness: p4 * r * 0.5, bevelSegments: 2 });
                    geo.center();
                    const scale = p1 * 2 || 0.1;
                    geo.scale(scale, scale, scale);
                    if (type === '3d_heart') geo.rotateZ(Math.PI);
                } else {
                    geo = new THREE.BoxGeometry(r, r, r);
                }
                return geo;
            }

            get3DGeometry(shape) {
                let cacheKey = shape;
                    if (shape === 'custom_parametric') {
                        cacheKey = `custom_${this.config.customShapeType}_${this.config.customParam1}_${this.config.customParam2}_${this.config.customParam3}_${this.config.customParam4}`;
                        if (this.config.customShapeType === 'image_extrusion' && this.config.customParticleImage) {
                             cacheKey += '_' + this.config.customParticleImage.substring(0, 50); // Hash part of base64
                        }
                    } else if (shape.startsWith('saved_custom_')) {
                        const savedShape = this.config.savedCustomShapes?.find(s => s.id === shape);
                        if (savedShape && savedShape.type === 'image_extrusion' && savedShape.imgData) {
                            cacheKey += '_' + savedShape.imgData.substring(0, 50);
                        }
                    }

                if (this.geoCache[cacheKey]) return this.geoCache[cacheKey];
                let geo;
                const r = 5;

                const safeMerge = (geos) => {
                    const cleanGeos = geos.map(g => {
                        let geom = g.clone();
                        if (geom.index) geom = geom.toNonIndexed();
                        geom.computeVertexNormals();
                        const cleanGeo = new THREE.BufferGeometry();
                        cleanGeo.setAttribute('position', geom.attributes.position);
                        cleanGeo.setAttribute('normal', geom.attributes.normal);
                        return cleanGeo;
                    });
                    const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(cleanGeos);
                    return merged || new THREE.BoxGeometry(r, r, r);
                };

                if (shape === '3d_cube') geo = new THREE.BoxGeometry(r*1.5, r*1.5, r*1.5);
                else if (shape === '3d_sphere') geo = new THREE.IcosahedronGeometry(r, 1);
                else if (shape === '3d_pyramid') geo = new THREE.ConeGeometry(r, r*2, 4);
                else if (shape === '3d_diamond') geo = new THREE.OctahedronGeometry(r, 0);
                else if (shape === '3d_tetrahedron') geo = new THREE.TetrahedronGeometry(r, 0);
                else if (shape === '3d_icosahedron') geo = new THREE.IcosahedronGeometry(r, 0);
                else if (shape === '3d_dodecahedron') geo = new THREE.DodecahedronGeometry(r, 0);
                else if (shape === '3d_torus') geo = new THREE.TorusGeometry(r, r*0.4, 8, 16);
                else if (shape === '3d_cylinder') geo = new THREE.CylinderGeometry(r, r, r*2, 8);
                else if (shape === '3d_tube') geo = new THREE.CylinderGeometry(r*0.3, r*0.3, r*4, 6);
                else if (shape === '3d_capsule') {
                    geo = new THREE.SphereGeometry(r, 12, 12);
                    geo.scale(0.6, 1.5, 0.6);
                }
                else if (shape === '3d_crisp_plane') geo = new THREE.PlaneGeometry(r*1.8, r*1.8);
                else if (shape === '3d_crisp_voxel') geo = new THREE.BoxGeometry(r*1.8, r*1.8, r*1.8);
                else if (shape === '3d_rounded_voxel') {
                    const shape2d = new THREE.Shape();
                    const w = r*1.6, h = r*1.6, rad = r*0.4;
                    const x = -w/2, y = -h/2;
                    shape2d.moveTo(x, y + rad);
                    shape2d.lineTo(x, y + h - rad);
                    shape2d.quadraticCurveTo(x, y + h, x + rad, y + h);
                    shape2d.lineTo(x + w - rad, y + h);
                    shape2d.quadraticCurveTo(x + w, y + h, x + w, y + h - rad);
                    shape2d.lineTo(x + w, y + rad);
                    shape2d.quadraticCurveTo(x + w, y, x + w - rad, y);
                    shape2d.lineTo(x + rad, y);
                    shape2d.quadraticCurveTo(x, y, x, y + rad);
                    geo = new THREE.ExtrudeGeometry(shape2d, { depth: r*1.2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: r*0.15, bevelThickness: r*0.15 });
                    geo.center();
                }
                else if (shape === '3d_cone') geo = new THREE.ConeGeometry(r, r*2, 16);
                else if (shape === '3d_torusknot') geo = new THREE.TorusKnotGeometry(r*0.8, r*0.25, 64, 8);
                else if (shape === '3d_prism') geo = new THREE.CylinderGeometry(r, r, r*2, 3);
                else if (shape === '3d_gem') geo = new THREE.OctahedronGeometry(r, 1);
                else if (shape === '3d_star') {
                    const shape2d = new THREE.Shape();
                    const pts = 5, outer = r*1.5, inner = r*0.6;
                    for(let i=0; i<pts*2; i++){
                        const l = i%2==0 ? outer : inner;
                        const a = (i/pts)*Math.PI;
                        if(i==0) shape2d.moveTo(Math.sin(a)*l, Math.cos(a)*l);
                        else shape2d.lineTo(Math.sin(a)*l, Math.cos(a)*l);
                    }
                    geo = new THREE.ExtrudeGeometry(shape2d, { depth: r*0.5, bevelEnabled: true, bevelThickness: r*0.1, bevelSize: r*0.1, bevelSegments: 1 });
                    geo.center();
                }
                else if (shape === '3d_letter') {
                    const shape2d = new THREE.Shape();
                    shape2d.moveTo(0, r); shape2d.lineTo(r*0.6, -r); shape2d.lineTo(r*0.2, -r);
                    shape2d.lineTo(r*0.1, -r*0.3); shape2d.lineTo(-r*0.1, -r*0.3);
                    shape2d.lineTo(-r*0.2, -r); shape2d.lineTo(-r*0.6, -r); shape2d.lineTo(0, r);
                    const hole = new THREE.Path();
                    hole.moveTo(0, r*0.4); hole.lineTo(r*0.15, -r*0.1); hole.lineTo(-r*0.15, -r*0.1); hole.lineTo(0, r*0.4);
                    shape2d.holes.push(hole);
                    geo = new THREE.ExtrudeGeometry(shape2d, { depth: r*0.5, bevelEnabled: true, bevelThickness: r*0.05, bevelSize: r*0.05, bevelSegments: 1 });
                    geo.center();
                }
                else if (shape === '3d_cross') {
                    const shape2d = new THREE.Shape();
                    const w = r*0.4, l = r;
                    shape2d.moveTo(-w, l); shape2d.lineTo(w, l); shape2d.lineTo(w, w);
                    shape2d.lineTo(l, w); shape2d.lineTo(l, -w); shape2d.lineTo(w, -w);
                    shape2d.lineTo(w, -l); shape2d.lineTo(-w, -l); shape2d.lineTo(-w, -w);
                    shape2d.lineTo(-l, -w); shape2d.lineTo(-l, w); shape2d.lineTo(-w, w); shape2d.lineTo(-w, l);
                    geo = new THREE.ExtrudeGeometry(shape2d, { depth: r*0.5, bevelEnabled: true, bevelThickness: r*0.1, bevelSize: r*0.1, bevelSegments: 1 });
                    geo.center();
                }
                else if (shape === '3d_heart') {
                    const shape2d = new THREE.Shape();
                    shape2d.moveTo(0, r*0.3); shape2d.bezierCurveTo(r, -r*0.5, r*1.8, r*0.2, 0, r); shape2d.bezierCurveTo(-r*1.8, r*0.2, -r, -r*0.5, 0, r*0.3);
                    geo = new THREE.ExtrudeGeometry(shape2d, { depth: r*0.5, bevelEnabled: true, bevelThickness: r*0.1, bevelSize: r*0.1, bevelSegments: 1 });
                    geo.center();
                    geo.rotateZ(Math.PI);
                }
                else if (shape === '3d_gear') {
                    const shape2d = new THREE.Shape();
                    const teeth = 8, outer = r*1.2, inner = r*0.9, hole = r*0.4;
                    for(let i=0; i<teeth*2; i++){
                        const a = (i/(teeth*2)) * Math.PI * 2;
                        const dist = i%2==0 ? outer : inner;
                        if(i==0) shape2d.moveTo(Math.cos(a)*dist, Math.sin(a)*dist);
                        else shape2d.lineTo(Math.cos(a)*dist, Math.sin(a)*dist);
                    }
                    const holePath = new THREE.Path();
                    holePath.absarc(0, 0, hole, 0, Math.PI*2, false);
                    shape2d.holes.push(holePath);
                    geo = new THREE.ExtrudeGeometry(shape2d, { depth: r*0.5, bevelEnabled: true, bevelThickness: r*0.1, bevelSize: r*0.1, bevelSegments: 1 });
                    geo.center();
                }
                else if (shape === '3d_cake') {
                    if (THREE.BufferGeometryUtils) {
                        const g1 = new THREE.CylinderGeometry(r, r, r*0.8, 16);
                        const g2 = new THREE.CylinderGeometry(r*0.7, r*0.7, r*0.8, 16); g2.translate(0, r*0.8, 0);
                        const g3 = new THREE.CylinderGeometry(r*0.1, r*0.1, r*0.6, 8); g3.translate(0, r*1.5, 0);
                        geo = safeMerge([g1, g2, g3]);
                        geo.center();
                    } else geo = new THREE.BoxGeometry(r, r, r);
                }
                else if (shape === '3d_dog') {
                    if (THREE.BufferGeometryUtils) {
                        const body = new THREE.BoxGeometry(r*0.8, r*0.6, r*1.4);
                        const head = new THREE.BoxGeometry(r*0.6, r*0.6, r*0.6); head.translate(0, r*0.5, r*0.8);
                        const snout = new THREE.BoxGeometry(r*0.3, r*0.3, r*0.4); snout.translate(0, r*0.4, r*1.2);
                        const leg1 = new THREE.BoxGeometry(r*0.2, r*0.6, r*0.2); leg1.translate(r*0.3, -r*0.6, r*0.5);
                        const leg2 = new THREE.BoxGeometry(r*0.2, r*0.6, r*0.2); leg2.translate(-r*0.3, -r*0.6, r*0.5);
                        const leg3 = new THREE.BoxGeometry(r*0.2, r*0.6, r*0.2); leg3.translate(r*0.3, -r*0.6, -r*0.5);
                        const leg4 = new THREE.BoxGeometry(r*0.2, r*0.6, r*0.2); leg4.translate(-r*0.3, -r*0.6, -r*0.5);
                        const tail = new THREE.BoxGeometry(r*0.1, r*0.6, r*0.1); tail.rotateX(Math.PI/4); tail.translate(0, r*0.2, -r*0.8);
                        geo = safeMerge([body, head, snout, leg1, leg2, leg3, leg4, tail]);
                        geo.center();
                    } else geo = new THREE.BoxGeometry(r, r, r);
                }
                else if (shape === '3d_goblin') {
                    if (THREE.BufferGeometryUtils) {
                        const head = new THREE.IcosahedronGeometry(r*0.7, 1);
                        const earL = new THREE.ConeGeometry(r*0.2, r*1.0, 4); earL.rotateZ(Math.PI/2.5); earL.translate(-r*0.8, r*0.1, 0);
                        const earR = new THREE.ConeGeometry(r*0.2, r*1.0, 4); earR.rotateZ(-Math.PI/2.5); earR.translate(r*0.8, r*0.1, 0);
                        const nose = new THREE.ConeGeometry(r*0.15, r*0.6, 4); nose.rotateX(Math.PI/2); nose.translate(0, 0, r*0.7);
                        geo = safeMerge([head, earL, earR, nose]);
                        geo.center();
                    } else geo = new THREE.BoxGeometry(r, r, r);
                }
                else if (shape === '3d_monkey') {
                    if (THREE.BufferGeometryUtils) {
                        const head = new THREE.IcosahedronGeometry(r*0.6, 2);
                        const jaw = new THREE.BoxGeometry(r*0.5, r*0.4, r*0.4); jaw.translate(0, -r*0.3, r*0.4);
                        const earL = new THREE.TorusGeometry(r*0.25, r*0.08, 8, 12); earL.translate(-r*0.65, 0, 0);
                        const earR = new THREE.TorusGeometry(r*0.25, r*0.08, 8, 12); earR.translate(r*0.65, 0, 0);
                        const brow = new THREE.BoxGeometry(r*0.8, r*0.15, r*0.2); brow.translate(0, r*0.2, r*0.5);
                        geo = safeMerge([head, jaw, earL, earR, brow]);
                        geo.center();
                    } else geo = new THREE.BoxGeometry(r, r, r);
                }
                else if (shape === '3d_custom_crazy_wire') {
                        geo = this.createParametricGeometry('torus_knot', 100, 1, 7, 50, r);
                }
                else if (shape === 'uploaded_model') {
                    if (this.uploadedModelGeometry) {
                        geo = this.uploadedModelGeometry.clone();
                        geo.computeBoundingBox();
                        const size = new THREE.Vector3();
                        if (geo.boundingBox) {
                            geo.boundingBox.getSize(size);
                        } else {
                            size.set(r, r, r);
                        }
                        const maxDim = Math.max(size.x, size.y, size.z) || 1;
                        const scale = (r * 2.5) / maxDim;
                        geo.scale(scale, scale, scale);
                    } else {
                        geo = new THREE.BoxGeometry(r, r, r);
                    }
                }
                else if (shape === 'custom_parametric' && this.config.customShapeType === 'image_extrusion') {
                    geo = this._buildImageExtrusionGeo(this.config.customParticleImage, this.config.customParam1, this.config.customParam2, r, cacheKey);
                }
                else if (shape === 'custom_parametric') {
                    geo = this.createParametricGeometry(this.config.customShapeType, this.config.customParam1, this.config.customParam2, this.config.customParam3, this.config.customParam4, r);
                }
                else if (shape.startsWith('saved_custom_')) {
                    const savedShape = this.config.savedCustomShapes?.find(s => s.id === shape);
                    if (savedShape) {
                        if (savedShape.type === 'image_extrusion') {
                           geo = this._buildImageExtrusionGeo(savedShape.imgData, savedShape.p1, savedShape.p2, r, cacheKey);
                        } else {
                           geo = this.createParametricGeometry(savedShape.type, savedShape.p1, savedShape.p2, savedShape.p3, savedShape.p4, r);
                        }
                    } else {
                        geo = new THREE.BoxGeometry(r, r, r);
                    }
                }
                else geo = new THREE.BoxGeometry(r, r, r);

                this.geoCache[cacheKey] = geo;
                return geo;
            }

            _buildImageExtrusionGeo(imgUrl, depthParam, resParam, targetR, cacheKey) {
    if (!imgUrl) return new THREE.BoxGeometry(targetR, targetR, targetR);

    // Return a temporary box while the image loads asynchronously
    if (!this.geoCache[cacheKey + '_loading']) {
        this.geoCache[cacheKey + '_loading'] = true;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // Map parameter to a resolution between 8 and 32 to cap performance costs
            const res = Math.max(8, Math.floor((resParam / 100) * 32));
            canvas.width = res; canvas.height = res;

            ctx.clearRect(0, 0, res, res);
            ctx.drawImage(img, 0, 0, res, res);
            const data = ctx.getImageData(0, 0, res, res).data;

            const geos = [];
            const d = (depthParam / 100) * targetR * 2 + 0.1;
            const size = targetR * 2 / res;

            for(let y=0; y<res; y++) {
                for(let x=0; x<res; x++) {
                    const alpha = data[(y*res + x)*4 + 3];
                    if(alpha > 128) { // Only extrude non-transparent pixels
                        const box = new THREE.BoxGeometry(size, size, d);
                        box.translate((x - res/2)*size, -(y - res/2)*size, 0);
                        geos.push(box);
                    }
                }
            }

            if(geos.length > 0 && THREE.BufferGeometryUtils) {
                let finalGeo = THREE.BufferGeometryUtils.mergeBufferGeometries(geos);
                finalGeo.center();

                finalGeo.computeBoundingBox();
                const bBox = finalGeo.boundingBox;
                const maxDim = Math.max(bBox.max.x - bBox.min.x, bBox.max.y - bBox.min.y) || 1;
                const scale = (targetR * 2.5) / maxDim;
                finalGeo.scale(scale, scale, 1);

                this.geoCache[cacheKey] = finalGeo;
            } else {
                this.geoCache[cacheKey] = new THREE.BoxGeometry(targetR, targetR, targetR);
            }

            // Re-apply shape to canvas once generated
            if (this.activeMesh && (this.config.shape === 'custom_parametric' || this.config.shape.startsWith('saved_custom_'))) {
                this.applyShape();
            }
        };
        img.src = imgUrl;
    }

    return new THREE.BoxGeometry(targetR, targetR, targetR); // Placeholder until load finishes
}

            init() {
                this.scene = new THREE.Scene();
                this.scene.fog = new THREE.FogExp2(0x020617, 0.0005);
                this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
                this.camera.position.z = this.config.cameraZoom;

                this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

                this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
                this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
                this.dirLight.position.set(500, 1000, 500);
                this.backLight = new THREE.DirectionalLight(0xaaaaff, 0.8);
                this.backLight.position.set(-500, -500, -500);
                this.scene.add(this.ambientLight, this.dirLight, this.backLight);

                this.geometry = new THREE.BufferGeometry();
                this.material = new THREE.PointsMaterial({
                    size: this.config.size, vertexColors: true, transparent: true,
                    opacity: this.config.opacity, alphaTest: 0.1, blending: this.isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending,
                    sizeAttenuation: true, depthWrite: false
                });
                this.points = new THREE.Points(this.geometry, this.material);

                this.activeMesh = null;

                this.buildBuffers();
                this.generateBackground();
                this.bindEvents();
                this.animate();
            }

            setThemeMode(isLightMode) {
                this.isLightMode = isLightMode;
                this.scene.fog.color.setHex(isLightMode ? 0xf1f5f9 : 0x020617);

                if (this.material) {
                    this.material.blending = isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
                    this.material.needsUpdate = true;
                }

                if (this.instancedMesh && this.instancedMesh.material) {
                    this.instancedMesh.material.roughness = isLightMode ? 0.5 : 0.2;
                    this.instancedMesh.material.metalness = isLightMode ? 0.3 : 0.8;
                    this.instancedMesh.material.needsUpdate = true;
                }

                if (this.bgPoints && this.bgPoints.material) {
                    this.bgPoints.material.blending = isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
                    this.bgPoints.material.needsUpdate = true;
                }
            }

            buildBuffers() {
                const count = this.config.count;
                this.positions = new Float32Array(count * 3);
                this.colors = new Float32Array(count * 3);
                this.targets = new Float32Array(count * 3);
                this.velocities = new Float32Array(count * 3);
                this.rotations = new Float32Array(count * 3);
                this.phases = new Float32Array(count);

                for (let i = 0; i < count; i++) {
                    const i3 = i * 3;
                    const radius = 1000 * Math.cbrt(Math.random());
                    const theta = Math.random() * 2 * Math.PI;
                    const phi = Math.acos(2 * Math.random() - 1);

                    this.positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                    this.positions[i3+1] = radius * Math.sin(phi) * Math.sin(theta);
                    this.positions[i3+2] = radius * Math.cos(phi);

                    this.velocities[i3] = (Math.random() - 0.5) * 4;
                    this.velocities[i3+1] = (Math.random() - 0.5) * 4;
                    this.velocities[i3+2] = (Math.random() - 0.5) * 4;

                    this.rotations[i3] = Math.random() * Math.PI * 2;
                    this.rotations[i3+1] = Math.random() * Math.PI * 2;
                    this.rotations[i3+2] = Math.random() * Math.PI * 2;

                    this.phases[i] = Math.random() * Math.PI * 2;
                }

                this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
                this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

                this.applyShape();
                this.triggerMorphUpdate();
            }

            applyColors() {
                const count = this.config.count;
                const cObj = new THREE.Color();

                const isCustom = this.config.theme.startsWith('custom_');
                const isSolid = this.config.theme === 'custom_solid';
                const isSavedImage = this.config.theme === 'saved_image';
                const customColors = this.config.customColors || ['#ffffff'];
                const palette = this.palettes[this.config.theme];

                for (let i = 0; i < count; i++) {
                    if (isSavedImage && this.hasSavedImage && this.savedImageColors && this.savedImageColors.length === count * 3) {
                        cObj.setRGB(this.savedImageColors[i*3], this.savedImageColors[i*3+1], this.savedImageColors[i*3+2]);
                    } else if (isSolid) {
                        cObj.set(customColors[0]);
                    } else if (isCustom && customColors.length > 1) {
                        const ratio = i / count;
                        const scaled = ratio * (customColors.length - 1);
                        const idx = Math.floor(scaled);
                        const t = scaled - idx;
                        cObj.set(customColors[idx]).lerp(new THREE.Color(customColors[Math.min(idx+1, customColors.length-1)]), t);
                    } else if (palette) {
                        cObj.setHex(palette[Math.floor(Math.random() * palette.length)]);
                    } else {
                        cObj.setHex(0xffffff);
                    }

                    this.colors[i*3] = cObj.r; this.colors[i*3+1] = cObj.g; this.colors[i*3+2] = cObj.b;
                    if (this.instancedMesh) this.instancedMesh.setColorAt(i, cObj);
                }

                if(this.geometry.attributes.color) this.geometry.attributes.color.needsUpdate = true;
                if(this.instancedMesh && this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;
            }

            applyShape() {
                const is3D = this.config.shape.startsWith('3d_') || this.config.shape === 'uploaded_model' || this.config.shape.startsWith('custom_') || this.config.shape.startsWith('saved_custom_');
                if (this.activeMesh) this.scene.remove(this.activeMesh);

                if (is3D) {
                    if (this.instancedMesh) this.instancedMesh.dispose();
                    const geo = this.get3DGeometry(this.config.shape);
                    const mat = new THREE.MeshStandardMaterial({
                        color: 0xffffff, roughness: this.isLightMode ? 0.5 : 0.2, metalness: this.isLightMode ? 0.3 : 0.8,
                        transparent: true, opacity: this.config.opacity
                    });
                    this.instancedMesh = new THREE.InstancedMesh(geo, mat, this.config.count);
                    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                    this.applyColors();
                    this.activeMesh = this.instancedMesh;
                } else {
                    this.material.size = this.config.size;
                    this.material.opacity = this.config.opacity;
                    this.material.blending = this.isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
                    this.material.map = this.getShapeTexture(this.config.shape);
                    this.material.needsUpdate = true;
                    this.activeMesh = this.points;
                }
                this.scene.add(this.activeMesh);
            }

            updateConfig(newConfig) {
                const needsRebuild = newConfig.count !== this.config.count;
                const needsRecolor = needsRebuild || newConfig.theme !== this.config.theme || JSON.stringify(newConfig.customColors) !== JSON.stringify(this.config.customColors);
                const modeSwitched = newConfig.morphMode !== this.config.morphMode;
                const shapeSwitched = newConfig.shape !== this.config.shape;
                const opacitySwitched = newConfig.opacity !== this.config.opacity;

                const textChanged = newConfig.textMorph !== this.config.textMorph ||
                                    newConfig.fontFamily !== this.config.fontFamily ||
                                    newConfig.fontWeight !== this.config.fontWeight ||
                                    newConfig.fontSize !== this.config.fontSize ||
                                    newConfig.textDepth !== this.config.textDepth;

                const imageChanged = newConfig.imageDataUrl !== this.config.imageDataUrl ||
                                     newConfig.imageScale !== this.config.imageScale ||
                                     newConfig.imageDepth !== this.config.imageDepth ||
                                     newConfig.imageBrightness !== this.config.imageBrightness ||
                                     newConfig.imageContrast !== this.config.imageContrast ||
                                     newConfig.imageSaturation !== this.config.imageSaturation ||
                                     newConfig.imageColorMode !== this.config.imageColorMode;

                const modelChanged = newConfig.modelDataUrl !== this.config.modelDataUrl ||
                                     newConfig.modelScale !== this.config.modelScale ||
                                     newConfig.modelColorMode !== this.config.modelColorMode;

                const bgChanged = newConfig.bgMode !== this.config.bgMode ||
                                  newConfig.bgImageUrl !== this.config.bgImageUrl ||
                                  newConfig.bgDepth !== this.config.bgDepth ||
                                  newConfig.bgDensity !== this.config.bgDensity ||
                                  newConfig.bgSize !== this.config.bgSize ||
                                  newConfig.bgDistance !== this.config.bgDistance;

                const customShapeChanged = newConfig.customShapeType !== this.config.customShapeType ||
                                           newConfig.customParam1 !== this.config.customParam1 ||
                                           newConfig.customParam2 !== this.config.customParam2 ||
                                           newConfig.customParam3 !== this.config.customParam3 ||
                                           newConfig.customParam4 !== this.config.customParam4;

                this.config = { ...this.config, ...newConfig };

                if (bgChanged) this.generateBackground();

                if (needsRebuild) {
                    this.buildBuffers();
                } else {
                    if (shapeSwitched || customShapeChanged || (newConfig.size !== this.material.size && !newConfig.shape.startsWith('3d_') && newConfig.shape !== 'uploaded_model' && !newConfig.shape.startsWith('custom_') && !newConfig.shape.startsWith('saved_custom_')) || opacitySwitched) {
                        this.applyShape();
                        if (this.config.morphMode === 'image') this.generateImageTargets();
                        else if (this.config.morphMode === 'text') this.generateTextTargets();
                        else if (this.config.morphMode === 'model') this.generateModelTargets();
                        else this.applyColors();
                    } else {
                        if (this.config.morphMode === 'text' && (modeSwitched || textChanged || needsRecolor)) {
                            this.generateTextTargets();
                        } else if (this.config.morphMode === 'image' && (modeSwitched || imageChanged)) {
                            this.generateImageTargets();
                        } else if (this.config.morphMode === 'model' && (modeSwitched || modelChanged)) {
                            this.generateModelTargets();
                        } else if (this.config.morphMode === 'none' && (needsRecolor || modeSwitched)) {
                            this.applyColors();
                        }
                    }
                }
            }

            generateBackground() {
                this.bgGeneration = (this.bgGeneration || 0) + 1;
                const currentGen = this.bgGeneration;

                if (this.bgPoints) {
                    this.scene.remove(this.bgPoints);
                    if (this.bgPoints.geometry) this.bgPoints.geometry.dispose();
                    if (this.bgPoints.material) this.bgPoints.material.dispose();
                    this.bgPoints = null;
                }
                if (this.bgPlane) {
                    this.scene.remove(this.bgPlane);
                    if (this.bgPlane.geometry) this.bgPlane.geometry.dispose();
                    if (this.bgPlane.material) this.bgPlane.material.dispose();
                    this.bgPlane = null;
                }

                if (this.config.bgMode === 'none' || !this.config.bgImageUrl) return;

                const img = new Image();
                img.onload = () => {
                    if (currentGen !== this.bgGeneration) return;

                    const aspect = img.height / img.width;

                    if (this.config.bgMode === 'image_2d') {
                        const tex = new THREE.Texture(img);
                        tex.needsUpdate = true;
                        const w = Math.abs(this.config.bgDistance) * 2.5;
                        const h = w * aspect;
                        const geo = new THREE.PlaneGeometry(w, h);
                        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.7, depthWrite: false });
                        this.bgPlane = new THREE.Mesh(geo, mat);
                        this.bgPlane.position.z = this.config.bgDistance;
                        this.bgPlane.renderOrder = -1;
                        this.scene.add(this.bgPlane);
                    } else if (this.config.bgMode === 'image_3d_particles') {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d', { willReadFrequently: true });
                        const maxDim = this.config.bgDensity;
                        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
                        canvas.width = Math.floor(img.width * scale);
                        canvas.height = Math.floor(img.height * scale);

                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

                        const validPixels = [];
                        for (let y = 0; y < canvas.height; y++) {
                            for (let x = 0; x < canvas.width; x++) {
                                const idx = (y * canvas.width + x) * 4;
                                if (imgData[idx + 3] > 10) {
                                    validPixels.push({
                                        x: x, y: y,
                                        r: imgData[idx]/255, g: imgData[idx+1]/255, b: imgData[idx+2]/255
                                    });
                                }
                            }
                        }

                        const pointsCount = validPixels.length;
                        if(pointsCount === 0) return;

                        const positions = new Float32Array(pointsCount * 3);
                        const colors = new Float32Array(pointsCount * 3);

                        const w = Math.abs(this.config.bgDistance) * 2.5;
                        const h = w * (canvas.height / canvas.width);
                        const startX = -w/2;
                        const startY = h/2;
                        const stepX = w / canvas.width;
                        const stepY = h / canvas.height;

                        for (let i = 0; i < pointsCount; i++) {
                            const i3 = i * 3;
                            const p = validPixels[i];

                            const lum = 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;

                            positions[i3] = startX + (p.x * stepX);
                            positions[i3+1] = startY - (p.y * stepY);
                            positions[i3+2] = this.config.bgDistance + (lum * this.config.bgDepth);

                            colors[i3] = p.r;
                            colors[i3+1] = p.g;
                            colors[i3+2] = p.b;
                        }

                        const geo = new THREE.BufferGeometry();
                        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

                        const mat = new THREE.PointsMaterial({
                            size: this.config.bgSize * (Math.abs(this.config.bgDistance)/1000),
                            vertexColors: true,
                            transparent: true,
                            opacity: 0.9,
                            sizeAttenuation: true,
                            blending: this.isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending,
                            depthWrite: false
                        });

                        this.bgPoints = new THREE.Points(geo, mat);
                        this.bgPoints.renderOrder = -1;
                        this.scene.add(this.bgPoints);
                    }
                };
                img.src = this.config.bgImageUrl;
            }

            triggerMorphUpdate() {
                if (this.config.morphMode === 'text') this.generateTextTargets();
                else if (this.config.morphMode === 'image') this.generateImageTargets();
                else if (this.config.morphMode === 'model') this.generateModelTargets();
                else this.applyColors();
            }

            generateTextTargets() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                const lines = this.config.textMorph.replace(/\\n/g, '\n').split('\n');

                const baseRes = 150;
                ctx.font = `${this.config.fontWeight} ${baseRes}px ${this.config.fontFamily}`;
                let maxWidth = 1;
                lines.forEach(l => maxWidth = Math.max(maxWidth, ctx.measureText(l).width));

                canvas.width = maxWidth + (baseRes);
                canvas.height = (lines.length * (baseRes*1.2)) + (baseRes);

                ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#fff';
                ctx.font = `${this.config.fontWeight} ${baseRes}px ${this.config.fontFamily}`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

                const startY = (canvas.height / 2) - ((lines.length * (baseRes*1.2)) / 2) + (baseRes*0.6);
                lines.forEach((line, i) => { ctx.fillText(line, canvas.width / 2, startY + (i * (baseRes*1.2))); });

                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                const validPixels = [];
                let minX = Infinity; let maxX = -Infinity;

                for (let y = 0; y < canvas.height; y += 2) {
                    for (let x = 0; x < canvas.width; x += 2) {
                        if (imgData[(y * canvas.width + x) * 4] > 128) {
                            const px = x - canvas.width/2;
                            validPixels.push({ x: px, y: -(y - canvas.height/2) });
                            if (px < minX) minX = px; if (px > maxX) maxX = px;
                        }
                    }
                }
                if (validPixels.length === 0) validPixels.push({x:0, y:0});

                const textW = maxX - minX;
                const targetW = window.innerWidth * 0.8;

                const fitScale = Math.min(targetW / (textW || 1), 5.0);
                const finalScale = fitScale * (this.config.fontSize / 100);

                const cObj = new THREE.Color();
                const palette = this.palettes[this.config.theme];
                const isCustom = this.config.theme.startsWith('custom_');
                const isSolid = this.config.theme === 'custom_solid';
                const customColors = this.config.customColors || ['#ffffff'];

                for (let i = 0; i < this.config.count; i++) {
                    const i3 = i * 3;
                    const p = validPixels[i % validPixels.length];

                    this.targets[i3] = (p.x * finalScale);
                    this.targets[i3+1] = (p.y * finalScale);
                    this.targets[i3+2] = (Math.random() - 0.5) * this.config.textDepth;

                    const ratio = Math.max(0, Math.min(1, (p.x - minX) / (maxX - minX)));

                    if (isSolid) {
                        cObj.set(customColors[0]);
                    } else if (isCustom && customColors.length > 1) {
                        const scaled = ratio * (customColors.length - 1);
                        const idx = Math.floor(scaled);
                        const t = scaled - idx;
                        cObj.set(customColors[idx]).lerp(new THREE.Color(customColors[Math.min(idx+1, customColors.length-1)]), t);
                    } else if (palette) {
                        const scaled = ratio * (palette.length - 1);
                        const idx = Math.floor(scaled);
                        const t = scaled - idx;
                        cObj.setHex(palette[idx]).lerp(new THREE.Color(palette[Math.min(idx+1, palette.length-1)]), t);
                    }

                    this.colors[i3] = cObj.r; this.colors[i3+1] = cObj.g; this.colors[i3+2] = cObj.b;
                    if (this.instancedMesh) this.instancedMesh.setColorAt(i, cObj);
                }
                this.geometry.attributes.color.needsUpdate = true;
                if(this.instancedMesh && this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;
            }

            generateImageTargets() {
                if (!this.config.imageDataUrl) return;
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    const maxDim = 500;
                    const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
                    canvas.width = Math.floor(img.width * scale);
                    canvas.height = Math.floor(img.height * scale);

                    const brightness = this.config.imageBrightness / 100;
                    const contrast = this.config.imageContrast / 100;
                    const saturate = this.config.imageSaturation / 100;
                    ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    const validPixels = [];
                    let minX = Infinity; let maxX = -Infinity;
                    let minY = Infinity; let maxY = -Infinity;

                    for (let y = 0; y < canvas.height; y += 2) {
                        for (let x = 0; x < canvas.width; x += 2) {
                            const idx = (y * canvas.width + x) * 4;
                            if (imgData[idx + 3] > 64) {
                                const px = x - canvas.width/2;
                                const py = -(y - canvas.height/2);
                                validPixels.push({
                                    x: px, y: py,
                                    r: imgData[idx]/255, g: imgData[idx+1]/255, b: imgData[idx+2]/255
                                });
                                if (px < minX) minX = px; if (px > maxX) maxX = px;
                                if (py < minY) minY = py; if (py > maxY) maxY = py;
                            }
                        }
                    }

                    if (validPixels.length === 0) validPixels.push({x:0, y:0, r:1, g:1, b:1});

                    const imgW = maxX - minX;
                    const targetW = window.innerWidth * 0.8;
                    const fitScale = Math.min(targetW / (imgW || 1), 5.0);
                    const finalScale = fitScale * (this.config.imageScale / 100);

                    const cObj = new THREE.Color();
                    const palette = this.palettes[this.config.theme];
                    const isCustom = this.config.theme.startsWith('custom_');
                    const isSolid = this.config.theme === 'custom_solid';
                    const customColors = this.config.customColors || ['#ffffff'];

                    for (let i = 0; i < this.config.count; i++) {
                        const i3 = i * 3;
                        const p = validPixels[i % validPixels.length];

                        this.targets[i3] = (p.x * finalScale);
                        this.targets[i3+1] = (p.y * finalScale);
                        this.targets[i3+2] = (Math.random() - 0.5) * this.config.imageDepth;

                        if (this.config.imageColorMode === 'theme') {
                            const ratio = Math.max(0, Math.min(1, (p.x - minX) / (imgW || 1)));
                            if (isSolid) {
                                cObj.set(customColors[0]);
                            } else if (isCustom && customColors.length > 1) {
                                const scaled = ratio * (customColors.length - 1);
                                const idx = Math.floor(scaled);
                                const t = scaled - idx;
                                cObj.set(customColors[idx]).lerp(new THREE.Color(customColors[Math.min(idx+1, customColors.length-1)]), t);
                            } else if (palette) {
                                const scaled = ratio * (palette.length - 1);
                                const idx = Math.floor(scaled);
                                const t = scaled - idx;
                                cObj.setHex(palette[idx]).lerp(new THREE.Color(palette[Math.min(idx+1, palette.length-1)]), t);
                            }
                        } else {
                            cObj.setRGB(p.r, p.g, p.b);
                        }

                        this.colors[i3] = cObj.r; this.colors[i3+1] = cObj.g; this.colors[i3+2] = cObj.b;
                        if (this.instancedMesh) this.instancedMesh.setColorAt(i, cObj);
                    }
                    this.geometry.attributes.color.needsUpdate = true;
                    if(this.instancedMesh && this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;

                    // STATE PRESERVATION
                    this.savedImageTargets = new Float32Array(this.targets);
                    this.savedImageColors = new Float32Array(this.colors);
                    this.hasSavedImage = true;
                };
                img.src = this.config.imageDataUrl;
            }

            // --- 3D GLB/GLTF MODEL PARSER ---
            generateModelTargets() {
                if (!this.config.modelDataUrl) return;

                if (this.cachedModelUrl === this.config.modelDataUrl && this.cachedValidVertices) {
                    this._applyModelTargets(this.cachedValidVertices, this.cachedModelW, this.cachedModelH, this.cachedModelD, this.cachedMinX, this.cachedMinY, this.cachedMinZ);
                    return;
                }

                this.gltfLoader.load(this.config.modelDataUrl, (gltf) => {
                    const validVertices = [];
                    let minX = Infinity, maxX = -Infinity;
                    let minY = Infinity, maxY = -Infinity;
                    let minZ = Infinity, maxZ = -Infinity;

                    const vec3 = new THREE.Vector3();
                    const col3 = new THREE.Color(1, 1, 1);

                    const geometriesToMerge = [];

                    gltf.scene.traverse((child) => {
                        if (child.isMesh && child.geometry && child.geometry.attributes.position) {
                            const posAttr = child.geometry.attributes.position;
                            const colorAttr = child.geometry.attributes.color;

                            let matColor = col3;
                            if (child.material && child.material.color) {
                                matColor = child.material.color;
                            }

                            child.updateMatrixWorld(true);
                            const matrix = child.matrixWorld;

                            let geom = child.geometry.clone();
                            if (geom.index) geom = geom.toNonIndexed();
                            geom.applyMatrix4(matrix);

                            const cleanGeo = new THREE.BufferGeometry();
                            cleanGeo.setAttribute('position', geom.attributes.position);

                            if (!geom.attributes.normal) geom.computeVertexNormals();
                            if (geom.attributes.normal) {
                                cleanGeo.setAttribute('normal', geom.attributes.normal);
                            } else {
                                const dummyNormals = new Float32Array(geom.attributes.position.count * 3);
                                cleanGeo.setAttribute('normal', new THREE.BufferAttribute(dummyNormals, 3));
                            }

                            geometriesToMerge.push(cleanGeo);

                            for (let i = 0; i < posAttr.count; i++) {
                                vec3.fromBufferAttribute(posAttr, i);

                                let r = matColor.r, g = matColor.g, b = matColor.b;
                                if (colorAttr) {
                                    r = colorAttr.getX(i);
                                    g = colorAttr.getY(i);
                                    b = colorAttr.getZ(i);
                                }

                                validVertices.push({ x: vec3.x, y: vec3.y, z: vec3.z, r, g, b });

                                if (vec3.x < minX) minX = vec3.x; if (vec3.x > maxX) maxX = vec3.x;
                                if (vec3.y < minY) minY = vec3.y; if (vec3.y > maxY) maxY = vec3.y;
                                if (vec3.z < minZ) minZ = vec3.z; if (vec3.z > maxZ) maxZ = vec3.z;
                            }
                        }
                    });

                    if (validVertices.length === 0) validVertices.push({x:0, y:0, z:0, r:1, g:1, b:1});

                    if (geometriesToMerge.length > 0 && THREE.BufferGeometryUtils) {
                        try {
                            this.uploadedModelGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometriesToMerge);
                            if(this.uploadedModelGeometry) this.uploadedModelGeometry.center();
                            if (this.config.shape === 'uploaded_model') this.applyShape();
                        } catch(e) {
                            console.warn("Could not merge uploaded model geometries:", e);
                            this.uploadedModelGeometry = geometriesToMerge[0];
                            if(this.uploadedModelGeometry) this.uploadedModelGeometry.center();
                            if (this.config.shape === 'uploaded_model') this.applyShape();
                        }
                    }

                    const w = maxX - minX;
                    const h = maxY - minY;
                    const d = maxZ - minZ;

                    this.cachedModelUrl = this.config.modelDataUrl;
                    this.cachedValidVertices = validVertices;
                    this.cachedModelW = w;
                    this.cachedModelH = h;
                    this.cachedModelD = d;
                    this.cachedMinX = minX;
                    this.cachedMinY = minY;
                    this.cachedMinZ = minZ;

                    this._applyModelTargets(validVertices, w, h, d, minX, minY, minZ);

                }, undefined, (error) => {
                    console.error("Error loading GLTF model:", error);
                });
            }

            _applyModelTargets(validVertices, w, h, d, minX, minY, minZ) {
                const maxDim = Math.max(w, h, d, 1);
                const targetSize = window.innerWidth * 0.4 * (this.config.modelScale / 100);
                const scale = targetSize / maxDim;

                const cObj = new THREE.Color();
                const palette = this.palettes[this.config.theme];
                const isCustom = this.config.theme.startsWith('custom_');
                const isSolid = this.config.theme === 'custom_solid';
                const customColors = this.config.customColors || ['#ffffff'];

                for (let i = 0; i < this.config.count; i++) {
                    const i3 = i * 3;
                    const p = validVertices[i % validVertices.length];

                    this.targets[i3] = (p.x - (minX + w/2)) * scale;
                    this.targets[i3+1] = (p.y - (minY + h/2)) * scale;
                    this.targets[i3+2] = (p.z - (minZ + d/2)) * scale;

                    this.targets[i3] += (Math.random()-0.5)*2;
                    this.targets[i3+1] += (Math.random()-0.5)*2;
                    this.targets[i3+2] += (Math.random()-0.5)*2;

                    if (this.config.modelColorMode === 'theme') {
                        const ratio = Math.max(0, Math.min(1, (p.x - minX) / (w || 1)));
                        if (isSolid) {
                            cObj.set(customColors[0]);
                        } else if (isCustom && customColors.length > 1) {
                            const scaled = ratio * (customColors.length - 1);
                            const idx = Math.floor(scaled);
                            const t = scaled - idx;
                            cObj.set(customColors[idx]).lerp(new THREE.Color(customColors[Math.min(idx+1, customColors.length-1)]), t);
                        } else if (palette) {
                            const scaled = ratio * (palette.length - 1);
                            const idx = Math.floor(scaled);
                            const t = scaled - idx;
                            cObj.setHex(palette[idx]).lerp(new THREE.Color(palette[Math.min(idx+1, palette.length-1)]), t);
                        }
                    } else {
                        cObj.setRGB(p.r, p.g, p.b);
                    }

                    this.colors[i3] = cObj.r; this.colors[i3+1] = cObj.g; this.colors[i3+2] = cObj.b;
                    if (this.instancedMesh) this.instancedMesh.setColorAt(i, cObj);
                }

                this.geometry.attributes.color.needsUpdate = true;
                if(this.instancedMesh && this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;

                // STATE PRESERVATION
                this.savedImageTargets = new Float32Array(this.targets);
                this.savedImageColors = new Float32Array(this.colors);
                this.hasSavedImage = true;
            }

            bindEvents() {
                window.addEventListener('resize', () => {
                    this.camera.aspect = window.innerWidth / window.innerHeight;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(window.innerWidth, window.innerHeight);
                });

                // Shared Interaction Helper (Mouse + Touch)
                const getRayCastFromEvent = (clientX, clientY, targetVec) => {
                    const ndcX = (clientX / window.innerWidth) * 2 - 1;
                    const ndcY = -(clientY / window.innerHeight) * 2 + 1;
                    this.raycaster.setFromCamera({x: ndcX, y: ndcY}, this.camera);

                    if (this.raycaster.ray.intersectPlane(this.plane, this._reusableVector)) {
                        targetVec.copy(this._reusableVector);
                    } else {
                        targetVec.set(-9999, -9999, 0);
                    }
                };

                // ---- MOUSE EVENTS ----
                window.addEventListener('mousemove', (e) => { getRayCastFromEvent(e.clientX, e.clientY, this.mouseTarget); });
                document.addEventListener('mouseleave', (e) => {
                    if (e.relatedTarget === null) this.mouseTarget.set(-9999, -9999, 0);
                });
                window.addEventListener('mousedown', (e) => {
                    if(e.target.tagName === 'CANVAS') {
                        getRayCastFromEvent(e.clientX, e.clientY, this.clickPos);
                        this.isClicking = true;
                        this.processClick = true;
                    }
                });
                window.addEventListener('mouseup', () => { this.isClicking = false; });

                // MOUSE WHEEL ZOOM
                window.addEventListener('wheel', (e) => {
                    if (e.target.tagName !== 'CANVAS') return;
                    this.config.cameraZoom += e.deltaY * 0.5;
                    this.config.cameraZoom = Math.max(200, Math.min(3000, this.config.cameraZoom));

                    const zoomSlider = document.getElementById('cameraZoom');
                    const zoomLabel = document.getElementById('cameraZoomVal');
                    if(zoomSlider) zoomSlider.value = this.config.cameraZoom;
                    if(zoomLabel) zoomLabel.innerText = Math.floor(this.config.cameraZoom);
                }, { passive: false });

                // ---- TOUCH EVENTS (MOBILE / TABLET) ----
                this.renderer.domElement.addEventListener('touchstart', (e) => {
                    e.preventDefault();

                    const controlsWrapper = document.getElementById('controls-wrapper');
                    if (window.innerWidth <= 768 && controlsWrapper && controlsWrapper.classList.contains('show')) {
                        controlsWrapper.classList.remove('show');
                    }

                    if (e.touches.length === 2) {
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        this.initialPinchDist = Math.sqrt(dx*dx + dy*dy);
                        this.initialZoom = this.config.cameraZoom;
                        return;
                    }

                    const touch = e.touches[0];
                    getRayCastFromEvent(touch.clientX, touch.clientY, this.mouseTarget);

                    const currentTime = Date.now();
                    const tapLength = currentTime - this.lastTapTime;

                    if (tapLength < 300 && tapLength > 0) {
                        getRayCastFromEvent(touch.clientX, touch.clientY, this.clickPos);
                        this.isClicking = true;
                        this.processClick = true;
                    }
                    this.lastTapTime = currentTime;

                }, { passive: false });

                this.renderer.domElement.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    if (e.touches.length === 2 && this.initialPinchDist !== null) {
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        const delta = this.initialPinchDist - dist;
                        this.config.cameraZoom = this.initialZoom + delta * 2.0;
                        this.config.cameraZoom = Math.max(200, Math.min(3000, this.config.cameraZoom));

                        const zoomSlider = document.getElementById('cameraZoom');
                        const zoomLabel = document.getElementById('cameraZoomVal');
                        if(zoomSlider) zoomSlider.value = this.config.cameraZoom;
                        if(zoomLabel) zoomLabel.innerText = Math.floor(this.config.cameraZoom);
                        return;
                    }
                    const touch = e.touches[0];
                    getRayCastFromEvent(touch.clientX, touch.clientY, this.mouseTarget);
                }, { passive: false });

                this.renderer.domElement.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    if (e.touches.length < 2) {
                        this.initialPinchDist = null;
                    }
                    if (e.touches.length === 0) {
                        this.mouseTarget.set(-9999, -9999, 0);
                        this.isClicking = false;
                    }
                }, { passive: false });
            }

            animate() {
                requestAnimationFrame(() => this.animate());

                const speed = this.config.speed;
                this.time += 0.01 * speed;
                const t = this.time;

                this.camera.position.z += (this.config.cameraZoom - this.camera.position.z) * 0.05;

                this.scene.rotation.x += this.config.gSpinX * speed;
                this.scene.rotation.y += this.config.gSpinY * speed;
                this.scene.rotation.z += this.config.gSpinZ * speed;

                const positions = this.geometry.attributes.position.array;
                const colors = this.geometry.attributes.color.array;
                const count = this.config.count;

                let mx = -9999, my = -9999, mz = -9999;
                if (this.mouseTarget.x !== -9999) {
                    this._reusableVector.copy(this.mouseTarget);
                    this.scene.worldToLocal(this._reusableVector);
                    mx = this._reusableVector.x; my = this._reusableVector.y; mz = this._reusableVector.z;
                }

                let cx = -9999, cy = -9999, cz = -9999;
                if (this.clickPos.x !== -9999) {
                    this._reusableVector.copy(this.clickPos);
                    this.scene.worldToLocal(this._reusableVector);
                    cx = this._reusableVector.x; cy = this._reusableVector.y; cz = this._reusableVector.z;
                }

                const interactionRadius = this.config.mouseRadius;
                const is3D = this.config.shape.startsWith('3d_') || this.config.shape === 'uploaded_model' || this.config.shape.startsWith('custom_') || this.config.shape.startsWith('saved_custom_');

                const depthScale = this.config.globalDepth;
                const friction = this.config.friction;
                const dummy = is3D ? this._reusableObject3D : null;
                const pScale = this.config.size / 5.0;

                const maxVel = 50 * Math.max(1, speed);
                let colorNeedsPush = false;
                const isMorph = this.config.morphMode !== 'none';

                for (let i = 0; i < count; i++) {
                    const i3 = i * 3;
                    let px = positions[i3]; let py = positions[i3+1]; let pz = positions[i3+2];
                    let vx = this.velocities[i3]; let vy = this.velocities[i3+1]; let vz = this.velocities[i3+2];

                    if (this.config.chaos > 0) {
                        vx += (Math.random() - 0.5) * this.config.chaos * speed;
                        vy += (Math.random() - 0.5) * this.config.chaos * speed;
                        vz += (Math.random() - 0.5) * this.config.chaos * speed;
                    }

                    if (isMorph) {
                        const tx = this.targets[i3]; const ty = this.targets[i3+1]; const tz = this.targets[i3+2];
                        vx += (tx - px) * this.config.morphSpeed * speed;
                        vy += (ty - py) * this.config.morphSpeed * speed;
                        vz += (tz - pz) * this.config.morphSpeed * speed;
                    } else {
                        const behavior = this.config.behavior;

                        if (behavior === 'reconstruct_image') {
                            if (this.hasSavedImage && this.savedImageTargets && this.savedImageTargets.length === count * 3) {
                                const tx = this.savedImageTargets[i3];
                                const ty = this.savedImageTargets[i3+1];
                                const tz = this.savedImageTargets[i3+2];
                                vx += (tx - px) * this.config.morphSpeed * speed;
                                vy += (ty - py) * this.config.morphSpeed * speed;
                                vz += (tz - pz) * this.config.morphSpeed * speed;
                            }
                        }
                        else if (behavior === 'swarm') {
                            if (Math.random() < 0.02) { vx += (Math.random()-0.5)*speed; vy += (Math.random()-0.5)*speed; vz += (Math.random()-0.5)*speed; }
                            if (Math.abs(px) > 1500) vx *= -1; if (Math.abs(py) > 1000) vy *= -1; if (Math.abs(pz) > 1000) vz *= -1;
                        }
                        else if (behavior === 'vortex') {
                            const angle = 0.02 * speed; const cosA = Math.cos(angle); const sinA = Math.sin(angle);
                            const nx = px * cosA - pz * sinA; const nz = px * sinA + pz * cosA;
                            vx = (nx - px) * 0.1; vz = (nz - pz) * 0.1; vy -= 0.5 * speed;
                            if (py < -800) { py = 800; px = (Math.random()-0.5)*1000; pz = (Math.random()-0.5)*1000; }
                        }
                        else if (behavior === 'galaxy') {
                            const dist = Math.sqrt(px*px + pz*pz); const angle = Math.atan2(pz, px) + (0.01 * speed * (2000 / (dist + 100)));
                            vx = (Math.cos(angle) * dist - px) * 0.1; vz = (Math.sin(angle) * dist - pz) * 0.1;
                            if (Math.abs(py) > 10) vy += -Math.sign(py) * 0.1 * speed;
                        }
                        else if (behavior === 'cube') {
                            const size = 600; let tx = px, ty = py, tz = pz;
                            if (Math.abs(px) > Math.abs(py) && Math.abs(px) > Math.abs(pz)) tx = Math.sign(px) * size;
                            else if (Math.abs(py) > Math.abs(pz)) ty = Math.sign(py) * size; else tz = Math.sign(pz) * size;
                            vx += (tx - px) * 0.01 * speed; vy += (ty - py) * 0.01 * speed; vz += (tz - pz) * 0.01 * speed;
                        }
                        else if (behavior === 'rain') {
                            vy -= 0.5 * speed; vx = 0; vz = 0;
                            if (py < -1000) { py = 1000; px = (Math.random()-0.5)*2000; pz = (Math.random()-0.5)*2000; }
                        }
                        else if (behavior === 'explode') {
                            px *= (1.0 + (0.01 * speed)); py *= (1.0 + (0.01 * speed)); pz *= (1.0 + (0.01 * speed));
                            if (px*px+py*py+pz*pz > 9000000) { px=(Math.random()-0.5)*10; py=(Math.random()-0.5)*10; pz=(Math.random()-0.5)*10; }
                            vx=0; vy=0; vz=0;
                        }
                        else if (behavior === 'blackhole') {
                            const dist = Math.sqrt(px*px + py*py + pz*pz) || 1;
                            vx -= (px/dist) * 2 * speed; vy -= (py/dist) * 2 * speed; vz -= (pz/dist) * 2 * speed;
                            vx += (py/dist)*1.5*speed; vy -= (px/dist)*1.5*speed;
                            if (dist < 20) { px=(Math.random()-0.5)*3000; py=(Math.random()-0.5)*3000; pz=(Math.random()-0.5)*3000; vx=0;vy=0;vz=0; }
                        }
                        else if (behavior === 'dna_helix') {
                            py += 2 * speed; if (py > 1000) py = -1000;
                            const ang = py * 0.01 + t;
                            const offset = (i % 2 === 0) ? 0 : Math.PI;
                            const tx = Math.cos(ang + offset) * 300; const tz = Math.sin(ang + offset) * 300;
                            vx += (tx - px) * 0.05 * speed; vz += (tz - pz) * 0.05 * speed;
                        }
                        else if (behavior === 'tornado') {
                            py += 5 * speed; if (py > 1000) { py = -1000; px=(Math.random()-0.5)*100; pz=(Math.random()-0.5)*100; }
                            const radius = 50 + ((py + 1000) / 2000) * 800;
                            const ang = Math.atan2(pz, px) + 0.1 * speed;
                            vx += (Math.cos(ang)*radius - px) * 0.1; vz += (Math.sin(ang)*radius - pz) * 0.1;
                        }
                        else if (behavior === 'fireworks') {
                            vy -= 0.3 * speed;
                            if (this.phases[i] < 0 || py < -1500) {
                                px = (Math.random()-0.5)*300; py = -800; pz = (Math.random()-0.5)*300;
                                const theta = Math.random()*Math.PI*2; const phi = Math.acos(2*Math.random()-1);
                                const r = Math.random()*20+15;
                                vx = r*Math.sin(phi)*Math.cos(theta); vy = r*Math.cos(phi) + 20; vz = r*Math.sin(phi)*Math.sin(theta);
                                this.phases[i] = 70 + Math.random()*50;
                            }
                            this.phases[i] -= 1 * speed;
                        }
                        else if (behavior === 'quantum_tunnel') {
                            pz -= 15 * speed;
                            if (pz < -1000) { pz = 1000; px = (Math.random()-0.5)*1000; py = (Math.random()-0.5)*1000; }
                            vx += Math.sin(pz*0.01 + t)*2; vy += Math.cos(pz*0.01 + t)*2;
                        }
                        else if (behavior === 'meteor_shower') {
                            vx -= 10*speed; vy -= 10*speed; vz -= 10*speed;
                            if (px < -1000 || py < -1000) { px = 1000+Math.random()*1000; py = 1000+Math.random()*1000; pz = 1000+Math.random()*1000; }
                        }
                        else if (behavior === 'lissajous') {
                            vx += (Math.sin(3*t)*800 - px)*0.01*speed; vy += (Math.sin(2*t)*800 - py)*0.01*speed; vz += (Math.sin(4*t)*800 - pz)*0.01*speed;
                        }
                        else if (behavior === 'heart_beat') {
                            const pulse=1+Math.sin(t*5)*0.2; const ang=this.phases[i];
                            const hx=16*Math.pow(Math.sin(ang),3)*15;
                            const hy=(13*Math.cos(ang)-5*Math.cos(2*ang)-2*Math.cos(3*ang)-Math.cos(4*ang))*15;
                            vx+=(hx*pulse-px)*0.05*speed; vy+=(hy*pulse-py)*0.05*speed; vz+=(0-pz)*0.05*speed;
                        }
                        else if (behavior === 'pulse_sphere') {
                            const radius=600+Math.sin(t*2+this.phases[i])*100; const dist=Math.sqrt(px*px+py*py+pz*pz)||1;
                            vx+=(px/dist*radius-px)*0.05*speed; vy+=(py/dist*radius-py)*0.05*speed; vz+=(pz/dist*radius-pz)*0.05*speed;
                        }
                        else if (behavior === 'neutron_star') {
                            const dist=Math.sqrt(px*px+pz*pz); const ang=Math.atan2(pz,px)+(0.5*speed);
                            vx=Math.cos(ang)*dist-px; vz=Math.sin(ang)*dist-pz; vy-=Math.sign(py)*2*speed;
                        }
                        else if (behavior === 'crystal_growth') {
                            px+=Math.sign(px)*0.1*speed; py+=Math.sign(py)*0.1*speed; pz+=Math.sign(pz)*0.1*speed; vx=0;vy=0;vz=0;
                            if(px*px+py*py+pz*pz>2000000){px=(Math.random()-0.5)*10;py=(Math.random()-0.5)*10;pz=(Math.random()-0.5)*10;}
                        }
                        else if (behavior === 'ocean_waves') {
                            const wave=Math.sin(px*0.005+t)*100+Math.cos(pz*0.005+t)*100;
                            vy+=(wave-py)*0.05*speed; vx=Math.sin(pz*0.01)*0.5; vz=Math.cos(px*0.01)*0.5;
                        }
                        else if (behavior === 'matrix_rain') {
                            vy-=2*speed; vx=0;vz=0;
                            if(py<-1000){py=1000;px=Math.round((Math.random()-0.5)*40)*50;pz=Math.round((Math.random()-0.5)*40)*50;}
                        }
                        else if (behavior === 'snowfall') {
                            vy-=0.2*speed; vx+=Math.sin(t+this.phases[i])*0.05; vz+=Math.cos(t+this.phases[i])*0.05;
                            if(py<-1000){py=1000;px=(Math.random()-0.5)*2000;pz=(Math.random()-0.5)*2000;}
                        }
                        else if (behavior === 'fire_sparks') {
                            vy+=(Math.random()*2+1)*speed; vx+=(Math.random()-0.5)*2; vz+=(Math.random()-0.5)*2;
                            if(py>1000){py=-1000;px=(Math.random()-0.5)*400;pz=(Math.random()-0.5)*400;}
                        }
                        else if (behavior === 'magnetic_field') {
                            const a=Math.atan2(pz,px); const r=Math.sqrt(px*px+pz*pz); const d=r-500;
                            vx+=(Math.cos(a)*d-px)*0.05*speed; vz+=(Math.sin(a)*d-pz)*0.05*speed; vy+=Math.sin(t+this.phases[i])*2*speed;
                        }
                        else if (behavior === 'hyperspace') {
                            pz += 20 * speed; if(pz>1000){pz=-1000; px=(Math.random()-0.5)*2000; py=(Math.random()-0.5)*2000;}
                        }
                        else if (behavior === 'wormhole') {
                            const a=Math.atan2(py,px)+0.05*speed; const r=400+Math.sin(pz*0.01+t)*100; pz+=10*speed;
                            if(pz>1000)pz=-1000; vx+=(Math.cos(a)*r-px)*0.1*speed; vy+=(Math.sin(a)*r-py)*0.1*speed;
                        }
                        else if (behavior === 'brownian_motion') {
                            vx+=(Math.random()-0.5)*2*speed; vy+=(Math.random()-0.5)*2*speed; vz+=(Math.random()-0.5)*2*speed;
                        }
                        else if (behavior === 'string_theory') {
                            const a=px*0.01+t; vy+=Math.sin(a*this.phases[i]%5)*5*speed;
                        }
                        else if (behavior === 'cellular') {
                            const id=i%100; const tx=Math.sin(id)*800; const ty=Math.cos(id)*800; const tz=Math.sin(id*1.5)*800;
                            vx+=(tx-px)*0.01*speed; vy+=(ty-py)*0.01*speed; vz+=(tz-pz)*0.01*speed;
                        }
                    }

                    vx *= friction; vy *= friction; vz *= friction;

                    if (this.config.mouseAction !== 'none' && mx !== -9999) {
                        const dx = mx - px; const dy = my - py; const dz = mz - pz;
                        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;

                        if (dist < interactionRadius) {
                            const f = (interactionRadius - dist) / interactionRadius;
                            const hAction = this.config.mouseAction;

                            if (hAction === 'repel') { vx -= (dx/dist)*f*10*speed; vy -= (dy/dist)*f*10*speed; vz -= (dz/dist)*f*10*speed; }
                            else if (hAction === 'attract') { vx += (dx/dist)*f*5*speed; vy += (dy/dist)*f*5*speed; vz += (dz/dist)*f*5*speed; }
                            else if (hAction === 'vortex') { vx += (dy/dist)*f*10*speed; vy -= (dx/dist)*f*10*speed; }
                            else if (hAction === 'blackhole_hover') { vx += (dx/dist)*f*8*speed; vy += (dy/dist)*f*8*speed; px *= 0.99; py *= 0.99; pz *= 0.99; }
                            else if (hAction === 'trail') { vx += dx*0.01*speed; vy += dy*0.01*speed; vz += dz*0.01*speed; }
                            else if (hAction === 'paint') {
                                this.colors[i3]=1; this.colors[i3+1]=1; this.colors[i3+2]=1; colorNeedsPush=true;
                                if(this.instancedMesh) {
                                    this._reusableColor.setRGB(1, 1, 1);
                                    this.instancedMesh.setColorAt(i, this._reusableColor);
                                }
                            }
                            else if (hAction === 'magnify') { vz += f*5*speed; }
                            else if (hAction === 'freeze') { vx*=0.1; vy*=0.1; vz*=0.1; }
                            else if (hAction === 'jitter') { vx+=(Math.random()-0.5)*20*f; vy+=(Math.random()-0.5)*20*f; }
                            else if (hAction === 'orbit') { const a=Math.atan2(dy,dx)+0.1*speed; px=mx-Math.cos(a)*dist; py=my-Math.sin(a)*dist; }
                            else if (hAction === 'whip') { vx-=(dx/dist)*f*30*speed; vy-=(dy/dist)*f*30*speed; }
                            else if (hAction === 'dodge') { vx-=(dy/dist)*f*15*speed; vy+=(dx/dist)*f*15*speed; }
                            else if (hAction === 'glitch') { if(Math.random()<0.1){px+=Math.random()*100-50; py+=Math.random()*100-50;} }
                            else if (hAction === 'slowmo') { vx*=0.8; vy*=0.8; vz*=0.8; }
                        }
                    }

                    if (this.processClick && this.config.clickAction !== 'none') {
                        const cdx = cx - px; const cdy = cy - py; const cdz = cz - pz;
                        const cdist = Math.sqrt(cdx*cdx + cdy*cdy + cdz*cdz) || 1;
                        const cAction = this.config.clickAction;
                        const clickRad = interactionRadius * 1.5;

                        if (cAction === 'shockwave' && cdist < clickRad) { const f=1-(cdist/clickRad); vx -= (cdx/cdist)*f*50; vy -= (cdy/cdist)*f*50; vz -= (cdz/cdist)*f*50; }
                        else if (cAction === 'implode' && cdist < clickRad*1.2) { vx += (cdx/cdist)*40; vy += (cdy/cdist)*40; vz += (cdz/cdist)*40; }
                        else if (cAction === 'shatter' && cdist < clickRad) { vx += (Math.random()-0.5)*80; vy += (Math.random()-0.5)*80; vz += (Math.random()-0.5)*80; }
                        else if (cAction === 'teleport' && cdist < clickRad) { px=cx+(Math.random()-0.5)*100; py=cy+(Math.random()-0.5)*100; }
                        else if (cAction === 'color_splash' && cdist < clickRad) {
                            this._reusableColor.setHSL(Math.random(), 1, 0.5);
                            this.colors[i3]=this._reusableColor.r; this.colors[i3+1]=this._reusableColor.g; this.colors[i3+2]=this._reusableColor.b; colorNeedsPush=true;
                            if(this.instancedMesh) this.instancedMesh.setColorAt(i, this._reusableColor);
                        }
                        else if (cAction === 'gravity_slam' && cdist < clickRad) { vy-=60; }
                        else if (cAction === 'time_freeze' && cdist < clickRad*1.2) { vx=0; vy=0; vz=0; }
                        else if (cAction === 'vortex_burst' && cdist < clickRad) { const f=1-(cdist/clickRad); vx+=(cdy/cdist)*f*60; vy-=(cdx/cdist)*f*60; }
                        else if (cAction === 'repel_wave' && cdist < clickRad*1.5) { const f=Math.sin((cdist/(clickRad*1.5))*Math.PI); vx-=(cdx/cdist)*f*30; vy-=(cdy/cdist)*f*30; }
                        else if (cAction === 'blackhole_suck') { vx+=(cdx/cdist)*20; vy+=(cdy/cdist)*20; }
                        else if (cAction === 'size_pop' && cdist < clickRad) { pz+=200; }
                        else if (cAction === 'scatter_frenzy' && cdist < clickRad*0.8) { px=(Math.random()-0.5)*2000; py=(Math.random()-0.5)*2000; pz=(Math.random()-0.5)*2000; }
                        else if (cAction === 'reverse_flow' && cdist < clickRad*1.2) { vx*=-1.5;vy*=-1.5;vz*=-1.5; }
                    }

                    vx = Math.max(-maxVel, Math.min(maxVel, vx));
                    vy = Math.max(-maxVel, Math.min(maxVel, vy));
                    vz = Math.max(-maxVel, Math.min(maxVel, vz));

                    positions[i3] = px + vx; positions[i3+1] = py + vy; positions[i3+2] = pz + vz;
                    this.velocities[i3] = vx; this.velocities[i3+1] = vy; this.velocities[i3+2] = vz;

                    if (is3D) {
                        this.rotations[i3] += this.config.spinX * speed;
                        this.rotations[i3+1] += this.config.spinY * speed;
                        this.rotations[i3+2] += this.config.spinZ * speed;

                        dummy.position.set(positions[i3], positions[i3+1], positions[i3+2] * depthScale);
                        dummy.rotation.set(this.rotations[i3], this.rotations[i3+1], this.rotations[i3+2]);
                        dummy.scale.set(pScale, pScale, pScale);
                        dummy.updateMatrix();
                        this.instancedMesh.setMatrixAt(i, dummy.matrix);
                    } else {
                        positions[i3+2] = (pz + vz) * depthScale;
                    }
                }

                if (colorNeedsPush) {
                    this.geometry.attributes.color.needsUpdate = true;
                    if(this.instancedMesh) this.instancedMesh.instanceColor.needsUpdate = true;
                }

                this.processClick = false;

                if (is3D) {
                    this.instancedMesh.instanceMatrix.needsUpdate = true;
                } else {
                    this.geometry.attributes.position.needsUpdate = true;
                }

                // Handle static Background Plane/Points rendering
                if (this.bgPoints) {
                    this.bgPoints.rotation.copy(this.scene.rotation);
                }
                if (this.bgPlane) {
                    this.bgPlane.rotation.copy(this.scene.rotation);
                }

                this.renderer.render(this.scene, this.camera);
            }
        }
