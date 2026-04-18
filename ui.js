import { WebGLParticleSandbox, createDefaultImageDataUrl } from './engine.js';
import { fetchWithRetry } from './utils.js';

const GEMINI_API_KEY = "";

window.addEventListener('load', () => {

            function safeAddListener(el, event, handler, options) {
                if (el) el.addEventListener(event, handler, options);
            }

            function escapeHTML(str) {
                if (typeof str !== 'string') return str;
                return str.replace(/[&<>"']/g, (m) => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                })[m]);
            }

            let engine = null;
            let activeTab = '3d';
            let isLightMode = false;

            const configs = {
                '2d': {
                    morphMode: 'none', shape: 'circle', count: 40000, size: 2.0, speed: 1.0, opacity: 0.9,
                    theme: 'vaporwave_26', customColors: ['#06b6d4', '#a855f7'], behavior: 'tornado',
                    mouseAction: 'attract', clickAction: 'shockwave', mouseRadius: 250,
                    textMorph: 'SUPREME\n2D', fontFamily: "'Space Grotesk', sans-serif",
                    theme: 'vaporwave_26', customColors: ['#06b6d4', '#a855f7'], behavior: 'tornado',
                    mouseAction: 'attract', clickAction: 'shockwave', mouseRadius: 250,
                    textMorph: 'SUPREME\n2D', fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 900, fontSize: 100, textDepth: 80, morphSpeed: 0.05,
                    imageDataUrl: createDefaultImageDataUrl(), imageScale: 100, imageDepth: 80, imageColorMode: 'original',
                    imageBrightness: 100, imageContrast: 100, imageSaturation: 100,
                    modelDataUrl: null, modelScale: 100, modelColorMode: 'original',
                    gSpinX: 0, gSpinY: 0, gSpinZ: 0,
                    spinX: 0, spinY: 0, spinZ: 0, globalDepth: 1.0, cameraZoom: 1200, friction: 0.99, chaos: 0.0,
                    bgMode: 'none', bgImageUrl: null, bgDepth: 500, bgDensity: 150, bgSize: 3.0, bgDistance: -1500,
                    customShapeType: 'torus_knot', customParam1: 50, customParam2: 50, customParam3: 50, customParam4: 50
                },
                '3d': {
                    morphMode: 'none', shape: '3d_cube', count: 10000, size: 4.0, speed: 1.0, opacity: 0.9,
                    theme: 'cyber_gold', customColors: ['#ffaa00', '#06b6d4'], behavior: 'blackhole',
                    mouseAction: 'repel', clickAction: 'implode', mouseRadius: 300,
                    textMorph: 'SUPREME\n3D', fontFamily: "'Inter', sans-serif",
                    theme: 'cyber_gold', customColors: ['#ffaa00', '#06b6d4'], behavior: 'blackhole',
                    mouseAction: 'repel', clickAction: 'implode', mouseRadius: 300,
                    textMorph: 'SUPREME\n3D', fontFamily: "'Inter', sans-serif",
                    fontWeight: 900, fontSize: 100, textDepth: 80, morphSpeed: 0.05,
                    imageDataUrl: createDefaultImageDataUrl(), imageScale: 100, imageDepth: 80, imageColorMode: 'original',
                    imageBrightness: 100, imageContrast: 100, imageSaturation: 100,
                    modelDataUrl: null, modelScale: 100, modelColorMode: 'original',
                    gSpinX: 0.0, gSpinY: 0.0, gSpinZ: 0.0,
                    spinX: 0.02, spinY: 0.05, spinZ: 0.00, globalDepth: 1.0, cameraZoom: 1200, friction: 0.90, chaos: 0.0,
                    bgMode: 'none', bgImageUrl: null, bgDepth: 500, bgDensity: 150, bgSize: 3.0, bgDistance: -1500,
                    customShapeType: 'torus_knot', customParam1: 50, customParam2: 50, customParam3: 50, customParam4: 50,
                    savedCustomShapes: JSON.parse(localStorage.getItem('webgl_saved_shapes') || '[]')
                }
            };

            const shapeOptions = {
                '2d': `
                    <optgroup label="2D Maps (Billboards)">
                        <option value="circle">Soft Circle</option>
                        <option value="square">Solid Square</option>
                        <option value="ring">Hollow Ring</option>
                        <option value="triangle">Solid Triangle</option>
                        <option value="star">5-Point Star</option>
                        <option value="hexagon">Hexagon</option>
                        <option value="heart">Heart</option>
                    </optgroup>
                `,
                '3d': `
                    <optgroup label="Custom Shape Creator">
                        <option value="custom_parametric">✨ Build Custom Shape...</option>
                    </optgroup>
                    <optgroup label="Optimized for Crisp Morphing">
                        <option value="3d_crisp_plane">3D Crisp Plane (Best for Images)</option>
                        <option value="3d_crisp_voxel">3D Crisp Voxel (Best for Text)</option>
                        <option value="3d_rounded_voxel">3D Rounded Voxel (Best for Images + Reflections)</option>
                    </optgroup>
                    <optgroup label="Special / Complex">
                        <option value="3d_cake">🎂 3D Cake</option>
                        <option value="3d_dog">🐕 3D Dog</option>
                        <option value="3d_goblin">👹 3D Goblin</option>
                        <option value="3d_monkey">🐵 3D Abstract Monkey</option>
                        <option value="uploaded_model">⭐ Uploaded Model Shape</option>
                    </optgroup>
                    <optgroup label="True 3D Objects (Instanced)">
                        <option value="3d_custom_crazy_wire">Crazy wire</option>
                        <option value="3d_cube">3D Cube</option>
                        <option value="3d_sphere">3D Sphere</option>
                        <option value="3d_pyramid">3D Pyramid</option>
                        <option value="3d_diamond">3D Diamond</option>
                        <option value="3d_icosahedron">3D Icosahedron</option>
                        <option value="3d_dodecahedron">3D Dodecahedron</option>
                        <option value="3d_torus">3D Torus Ring</option>
                        <option value="3d_cylinder">3D Cylinder</option>
                        <option value="3d_tube">3D Pen / Tube</option>
                        <option value="3d_tetrahedron">3D Tetrahedron</option>
                        <option value="3d_star">3D Star</option>
                        <option value="3d_letter">3D Letter 'A'</option>
                        <option value="3d_capsule">3D Capsule</option>
                        <option value="3d_cone">3D Cone</option>
                        <option value="3d_torusknot">3D Torus Knot</option>
                        <option value="3d_cross">3D Cross</option>
                        <option value="3d_heart">3D Heart</option>
                        <option value="3d_gear">3D Gear</option>
                        <option value="3d_prism">3D Triangular Prism</option>
                        <option value="3d_gem">3D Faceted Gem</option>
                    </optgroup>
                `
            };

            const mobileToggleBtn = document.getElementById('mobileControlsToggle');
            const controlsWrapper = document.getElementById('controls-wrapper');
            safeAddListener(mobileToggleBtn, 'click', () => {
                if (controlsWrapper) controlsWrapper.classList.toggle('show');
            });

            const tab2D = document.getElementById('tab2D');
            const tab3D = document.getElementById('tab3D');
            const modeFree = document.getElementById('modeFree');
            const modeText = document.getElementById('modeText');
            const modeImage = document.getElementById('modeImage');
            const modeModel = document.getElementById('modeModel');
            const themeToggle = document.getElementById('themeToggle');

            const textOnlyGroup = document.getElementById('textOnlyGroup');
            const imageOnlyGroup = document.getElementById('imageOnlyGroup');
            const modelOnlyGroup = document.getElementById('modelOnlyGroup');
            const customShapeGroup = document.getElementById('customShapeGroup');

            const spinControlsGroup = document.getElementById('spinControlsGroup');
            const customColorsContainer = document.getElementById('customColorsContainer');
            const colorStops = document.getElementById('colorStops');
            const addColorBtn = document.getElementById('addColorBtn');
            const particleShape = document.getElementById('particleShape');
            const imageUpload = document.getElementById('imageUpload');
            const modelUpload = document.getElementById('modelUpload');

            const bgUpload = document.getElementById('bgUpload');
            const bgMode = document.getElementById('bgMode');
            const bgDepth = document.getElementById('bgDepth');
            const bgDensity = document.getElementById('bgDensity');
            const bgSize = document.getElementById('bgSize');
            const bgDistance = document.getElementById('bgDistance');

            const inputs = {
                textString: document.getElementById('textString'),
                fontFamily: document.getElementById('fontFamily'),
                fontWeight: document.getElementById('fontWeight'),
                fontSize: document.getElementById('fontSize'),
                textDepth: document.getElementById('textDepth'),
                imageScale: document.getElementById('imageScale'),
                imageDepth: document.getElementById('imageDepth'),
                imageBrightness: document.getElementById('imageBrightness'),
                imageContrast: document.getElementById('imageContrast'),
                imageSaturation: document.getElementById('imageSaturation'),
                imageColorMode: document.getElementById('imageColorMode'),
                modelScale: document.getElementById('modelScale'),
                modelColorMode: document.getElementById('modelColorMode'),
                colorTheme: document.getElementById('colorTheme'),
                behaviorSelect: document.getElementById('behaviorSelect'),
                particleShape: particleShape,
                gSpinX: document.getElementById('gSpinX'),
                gSpinY: document.getElementById('gSpinY'),
                gSpinZ: document.getElementById('gSpinZ'),
                spinX: document.getElementById('spinX'),
                spinY: document.getElementById('spinY'),
                spinZ: document.getElementById('spinZ'),
                mouseAction: document.getElementById('mouseAction'),
                clickAction: document.getElementById('clickAction'),
                mouseRadius: document.getElementById('mouseRadius'),
                globalDepth: document.getElementById('globalDepth'),
                cameraZoom: document.getElementById('cameraZoom'),
                particleCount: document.getElementById('particleCount'),
                particleSize: document.getElementById('particleSize'),
                particleSpeed: document.getElementById('particleSpeed'),
                particleOpacity: document.getElementById('particleOpacity'),
                friction: document.getElementById('friction'),
                chaos: document.getElementById('chaos'),
                bgMode: bgMode,
                bgDepth: bgDepth,
                bgDensity: bgDensity,
                bgSize: bgSize,
                bgDistance: bgDistance,
                customShapeType: document.getElementById('customShapeType'),
                customParam1: document.getElementById('customParam1'),
                customParam2: document.getElementById('customParam2'),
                customParam3: document.getElementById('customParam3'),
                customParam4: document.getElementById('customParam4')
            };

            const labels = {
                count: document.getElementById('countVal'),
                size: document.getElementById('sizeVal'),
                speed: document.getElementById('speedVal'),
                opacity: document.getElementById('opacityVal'),
                radius: document.getElementById('radiusVal'),
                depth: document.getElementById('depthVal'),
                cameraZoom: document.getElementById('cameraZoomVal'),
                fontWeight: document.getElementById('fontWeightVal'),
                fontSize: document.getElementById('fontSizeVal'),
                textDepth: document.getElementById('textDepthVal'),
                imageScale: document.getElementById('imageScaleVal'),
                imageDepth: document.getElementById('imageDepthVal'),
                imageBrightness: document.getElementById('imageBrightnessVal'),
                imageContrast: document.getElementById('imageContrastVal'),
                imageSaturation: document.getElementById('imageSaturationVal'),
                modelScale: document.getElementById('modelScaleVal'),
                gSpinX: document.getElementById('gSpinXVal'),
                gSpinY: document.getElementById('gSpinYVal'),
                gSpinZ: document.getElementById('gSpinZVal'),
                spinX: document.getElementById('spinXVal'),
                spinY: document.getElementById('spinYVal'),
                spinZ: document.getElementById('spinZVal'),
                friction: document.getElementById('frictionVal'),
                chaos: document.getElementById('chaosVal'),
                bgDepth: document.getElementById('bgDepthVal'),
                bgDensity: document.getElementById('bgDensityVal'),
                bgSize: document.getElementById('bgSizeVal'),
                bgDistance: document.getElementById('bgDistanceVal'),
                customParam1: document.getElementById('customParam1Val'),
                customParam2: document.getElementById('customParam2Val'),
                customParam3: document.getElementById('customParam3Val'),
                customParam4: document.getElementById('customParam4Val')
            };

            safeAddListener(themeToggle, 'click', () => {
                isLightMode = !isLightMode;
                document.body.classList.toggle('light-theme', isLightMode);
                if (engine) engine.setThemeMode(isLightMode);
            });

            function renderColorStops() {
                if (!colorStops || !addColorBtn) return;
                const arr = configs[activeTab].customColors;
                colorStops.innerHTML = '';
                arr.forEach((col, idx) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = "flex items-center gap-1 bg-slate-800 p-1 rounded border border-slate-600";

                    const inp = document.createElement('input');
                    inp.type = 'color'; inp.value = col;
                    inp.className = "w-5 h-5 rounded cursor-pointer";
                    safeAddListener(inp, 'input', (e) => {
                        configs[activeTab].customColors[idx] = e.target.value;
                        engine.updateConfig(configs[activeTab]);
                    });
                    wrapper.appendChild(inp);

                    if (arr.length > 1) {
                        const rem = document.createElement('button');
                        rem.innerHTML = '×';
                        rem.className = "text-red-400 hover:text-red-300 font-bold px-1 text-xs";
                        safeAddListener(rem, 'click', () => {
                            configs[activeTab].customColors.splice(idx, 1);
                            renderColorStops();
                            engine.updateConfig(configs[activeTab]);
                        });
                        wrapper.appendChild(rem);
                    }
                    colorStops.appendChild(wrapper);
                });
                addColorBtn.style.display = arr.length >= 10 ? 'none' : 'block';
            }

            safeAddListener(addColorBtn, 'click', () => {
                if(configs[activeTab].customColors.length < 10) {
                    configs[activeTab].customColors.push('#ffffff');
                    renderColorStops();
                    engine.updateConfig(configs[activeTab]);
                }
            });

            function populateUIFromConfig() {
                const cfg = configs[activeTab];

                if (modeFree && modeText && modeImage && modeModel && textOnlyGroup && imageOnlyGroup && modelOnlyGroup) {
                    modeFree.classList.remove('active');
                    modeText.classList.remove('active');
                    modeImage.classList.remove('active');
                    modeModel.classList.remove('active');

                    textOnlyGroup.classList.add('hidden');
                    imageOnlyGroup.classList.add('hidden');
                    modelOnlyGroup.classList.add('hidden');

                    if (cfg.morphMode === 'text') {
                        modeText.classList.add('active');
                        textOnlyGroup.classList.remove('hidden');
                        if (inputs.behaviorSelect) {
                            inputs.behaviorSelect.value = 'morph';
                            inputs.behaviorSelect.disabled = true;
                        }
                    } else if (cfg.morphMode === 'image') {
                        modeImage.classList.add('active');
                        imageOnlyGroup.classList.remove('hidden');
                        if (inputs.behaviorSelect) {
                            inputs.behaviorSelect.value = 'morph';
                            inputs.behaviorSelect.disabled = true;
                        }
                    } else if (cfg.morphMode === 'model') {
                        modeModel.classList.add('active');
                        modelOnlyGroup.classList.remove('hidden');
                        if (inputs.behaviorSelect) {
                            inputs.behaviorSelect.value = 'morph';
                            inputs.behaviorSelect.disabled = true;
                        }
                    } else {
                        modeFree.classList.add('active');
                        if (inputs.behaviorSelect) {
                            inputs.behaviorSelect.value = cfg.behavior;
                            inputs.behaviorSelect.disabled = false;
                        }
                    }
                }

                let currentShapeOptions = shapeOptions[activeTab];
                if (activeTab === '3d' && cfg.savedCustomShapes && cfg.savedCustomShapes.length > 0) {
                    let savedGroup = `<optgroup label="Saved Custom Shapes">`;
                    cfg.savedCustomShapes.forEach(s => {
                        savedGroup += `<option value="${s.id}">⭐ ${s.name}</option>`;
                    });
                    savedGroup += `</optgroup>`;
                    currentShapeOptions = currentShapeOptions.replace('</optgroup>', '</optgroup>' + savedGroup);
                }
                if (particleShape) particleShape.innerHTML = currentShapeOptions;

                if (customShapeGroup) {
                    if (cfg.shape === 'custom_parametric') {
                        customShapeGroup.classList.remove('hidden');
                        customShapeGroup.classList.add('flex');

                        const type = cfg.customShapeType;
                        const lbl1 = document.getElementById('lblCustom1');
                        const lbl2 = document.getElementById('lblCustom2');
                        const lbl3 = document.getElementById('lblCustom3');
                        const lbl4 = document.getElementById('lblCustom4');
                        if (lbl1) {
                            // Reset visibility for standard params first to prevent trapped states
                            lbl3.parentElement.parentElement.classList.remove('hidden');
                            lbl4.parentElement.parentElement.classList.remove('hidden');
                            document.getElementById('customParticleImageContainer').classList.add('hidden');

                            if (type === 'image_extrusion') {
                                lbl1.innerText = 'Extrusion Depth'; lbl2.innerText = 'Voxel Res (Quality)';
                                lbl3.parentElement.parentElement.classList.add('hidden');
                                lbl4.parentElement.parentElement.classList.add('hidden');
                                document.getElementById('customParticleImageContainer').classList.remove('hidden');
                            } else if (type === 'torus_knot' || type === '3d_torusknot') {
                                lbl1.innerText = 'Radius / Detail'; lbl2.innerText = 'Tube Thick'; lbl3.innerText = 'P-Windings'; lbl4.innerText = 'Q-Windings';
                            } else if (type === 'flower') {
                                lbl1.innerText = 'Petal Count'; lbl2.innerText = 'Core Radius'; lbl3.innerText = '3D Depth'; lbl4.innerText = 'Bevel Intensity';
                            } else if (type === 'prism' || type === '3d_cylinder' || type === '3d_tube') {
                                lbl1.innerText = 'Top Radius'; lbl2.innerText = 'Bottom Radius'; lbl3.innerText = 'Height'; lbl4.innerText = 'Sides / Segs';
                            } else if (type === '3d_cube') {
                                lbl1.innerText = 'Width'; lbl2.innerText = 'Height'; lbl3.innerText = 'Depth'; lbl4.innerText = 'Segments';
                            } else if (type === '3d_sphere') {
                                lbl1.innerText = 'Radius'; lbl2.innerText = 'Width Segments'; lbl3.innerText = 'Height Segs'; lbl4.innerText = 'Flatten (Scale Z)';
                            } else if (type === '3d_pyramid' || type === '3d_cone') {
                                lbl1.innerText = 'Radius'; lbl2.innerText = 'Height'; lbl3.innerText = 'Radial Segments'; lbl4.innerText = 'Height Segs';
                            } else if (type === '3d_diamond' || type === '3d_tetrahedron' || type === '3d_icosahedron' || type === '3d_dodecahedron' || type === '3d_gem') {
                                lbl1.innerText = 'Radius'; lbl2.innerText = 'Detail Level'; lbl3.innerText = 'Scale Y'; lbl4.innerText = 'Scale Z';
                            } else if (type === '3d_torus') {
                                lbl1.innerText = 'Radius'; lbl2.innerText = 'Tube Thick'; lbl3.innerText = 'Radial Segs'; lbl4.innerText = 'Tubular Segs';
                            } else if (type === '3d_capsule') {
                                lbl1.innerText = 'Radius'; lbl2.innerText = 'Stretch Y'; lbl3.innerText = 'Width Segs'; lbl4.innerText = 'Height Segs';
                            } else if (type === '3d_star') {
                                lbl1.innerText = 'Outer Radius'; lbl2.innerText = 'Inner Radius'; lbl3.innerText = 'Points'; lbl4.innerText = '3D Depth';
                            } else if (type === '3d_gear') {
                                lbl1.innerText = 'Outer Radius'; lbl2.innerText = 'Inner Radius'; lbl3.innerText = 'Teeth Count'; lbl4.innerText = 'Hole Size';
                            } else if (type === '3d_cross' || type === '3d_heart' || type === '3d_letter') {
                                lbl1.innerText = 'Base Scale'; lbl2.innerText = '3D Depth'; lbl3.innerText = 'Bevel Size'; lbl4.innerText = 'Bevel Thick';
                            } else {
                                lbl1.innerText = 'Param 1'; lbl2.innerText = 'Param 2'; lbl3.innerText = 'Param 3'; lbl4.innerText = 'Param 4';
                            }
                        }
                    } else {
                        customShapeGroup.classList.remove('flex');
                        customShapeGroup.classList.add('hidden');
                    }
                }

                for (const key in inputs) {
                    if (inputs[key] && cfg[key] !== undefined) {
                        inputs[key].value = cfg[key];
                    }
                }

                if (inputs.textString) inputs.textString.value = cfg.textMorph;
                if (inputs.colorTheme) inputs.colorTheme.value = cfg.theme;
                if (inputs.particleShape) inputs.particleShape.value = cfg.shape;
                if (inputs.imageColorMode) inputs.imageColorMode.value = cfg.imageColorMode;
                if (inputs.modelColorMode) inputs.modelColorMode.value = cfg.modelColorMode;
                if (inputs.customShapeType) inputs.customShapeType.value = cfg.customShapeType;

                if (labels.count) labels.count.innerText = cfg.count.toLocaleString();
                if (labels.size) labels.size.innerText = cfg.size.toFixed(1);
                if (labels.speed) labels.speed.innerText = cfg.speed.toFixed(2) + 'x';
                if (labels.opacity) labels.opacity.innerText = cfg.opacity.toFixed(2);
                if (labels.radius) labels.radius.innerText = cfg.mouseRadius;
                if (labels.depth) labels.depth.innerText = cfg.globalDepth.toFixed(1) + 'x';
                if (labels.cameraZoom) labels.cameraZoom.innerText = cfg.cameraZoom;
                if (labels.fontWeight) labels.fontWeight.innerText = cfg.fontWeight;
                if (labels.fontSize) labels.fontSize.innerText = cfg.fontSize + '%';
                if (labels.textDepth) labels.textDepth.innerText = cfg.textDepth + 'px';
                if (labels.imageScale) labels.imageScale.innerText = cfg.imageScale + '%';
                if (labels.imageDepth) labels.imageDepth.innerText = cfg.imageDepth + 'px';
                if (labels.imageBrightness) labels.imageBrightness.innerText = cfg.imageBrightness + '%';
                if (labels.imageContrast) labels.imageContrast.innerText = cfg.imageContrast + '%';
                if (labels.imageSaturation) labels.imageSaturation.innerText = cfg.imageSaturation + '%';
                if (labels.modelScale) labels.modelScale.innerText = cfg.modelScale + '%';
                if (labels.gSpinX) labels.gSpinX.innerText = cfg.gSpinX.toFixed(3);
                if (labels.gSpinY) labels.gSpinY.innerText = cfg.gSpinY.toFixed(3);
                if (labels.gSpinZ) labels.gSpinZ.innerText = cfg.gSpinZ.toFixed(3);
                if (labels.spinX) labels.spinX.innerText = cfg.spinX.toFixed(2);
                if (labels.spinY) labels.spinY.innerText = cfg.spinY.toFixed(2);
                if (labels.spinZ) labels.spinZ.innerText = cfg.spinZ.toFixed(2);
                if (labels.friction) labels.friction.innerText = cfg.friction.toFixed(2);
                if (labels.chaos) labels.chaos.innerText = cfg.chaos.toFixed(1);
                if (labels.bgDepth) labels.bgDepth.innerText = cfg.bgDepth + 'px';
                if (labels.bgDensity) labels.bgDensity.innerText = cfg.bgDensity;
                if (labels.bgSize) labels.bgSize.innerText = cfg.bgSize.toFixed(1);
                if (labels.bgDistance) labels.bgDistance.innerText = cfg.bgDistance;
                if (labels.customParam1) labels.customParam1.innerText = cfg.customParam1;
                if (labels.customParam2) labels.customParam2.innerText = cfg.customParam2;
                if (labels.customParam3) labels.customParam3.innerText = cfg.customParam3;
                if (labels.customParam4) labels.customParam4.innerText = cfg.customParam4;

                if (spinControlsGroup) {
                    if (activeTab === '3d') spinControlsGroup.classList.remove('hidden');
                    else spinControlsGroup.classList.add('hidden');
                }

                if (customColorsContainer) {
                    if (cfg.theme && cfg.theme.startsWith('custom_')) {
                        customColorsContainer.classList.remove('hidden');
                        renderColorStops();
                        if(cfg.theme === 'custom_solid' && cfg.customColors.length > 1) {
                            cfg.customColors = [cfg.customColors[0]];
                            renderColorStops();
                        }
                    } else {
                        customColorsContainer.classList.add('hidden');
                    }
                }

                if (engine) engine.updateConfig(cfg);
            }

            function updateConfigFromUI() {
                const cfg = configs[activeTab];

                if (inputs.textString) cfg.textMorph = inputs.textString.value;
                if (inputs.fontFamily) cfg.fontFamily = inputs.fontFamily.value;
                if (inputs.fontWeight) cfg.fontWeight = parseInt(inputs.fontWeight.value);
                if (inputs.fontSize) cfg.fontSize = parseInt(inputs.fontSize.value);
                if (inputs.textDepth) cfg.textDepth = parseInt(inputs.textDepth.value);
                if (inputs.imageScale) cfg.imageScale = parseInt(inputs.imageScale.value);
                if (inputs.imageDepth) cfg.imageDepth = parseInt(inputs.imageDepth.value);
                if (inputs.imageBrightness) cfg.imageBrightness = parseInt(inputs.imageBrightness.value);
                if (inputs.imageContrast) cfg.imageContrast = parseInt(inputs.imageContrast.value);
                if (inputs.imageSaturation) cfg.imageSaturation = parseInt(inputs.imageSaturation.value);
                if (inputs.imageColorMode) cfg.imageColorMode = inputs.imageColorMode.value;
                if (inputs.modelScale) cfg.modelScale = parseInt(inputs.modelScale.value);
                if (inputs.modelColorMode) cfg.modelColorMode = inputs.modelColorMode.value;
                if (inputs.colorTheme) cfg.theme = inputs.colorTheme.value;
                if (inputs.behaviorSelect) cfg.behavior = cfg.morphMode !== 'none' ? 'morph' : inputs.behaviorSelect.value;
                if (inputs.particleShape) cfg.shape = inputs.particleShape.value;
                if (inputs.gSpinX) cfg.gSpinX = parseFloat(inputs.gSpinX.value);
                if (inputs.gSpinY) cfg.gSpinY = parseFloat(inputs.gSpinY.value);
                if (inputs.gSpinZ) cfg.gSpinZ = parseFloat(inputs.gSpinZ.value);
                if (inputs.spinX) cfg.spinX = parseFloat(inputs.spinX.value);
                if (inputs.spinY) cfg.spinY = parseFloat(inputs.spinY.value);
                if (inputs.spinZ) cfg.spinZ = parseFloat(inputs.spinZ.value);
                if (inputs.mouseAction) cfg.mouseAction = inputs.mouseAction.value;
                if (inputs.clickAction) cfg.clickAction = inputs.clickAction.value;
                if (inputs.mouseRadius) cfg.mouseRadius = parseInt(inputs.mouseRadius.value);
                if (inputs.globalDepth) cfg.globalDepth = parseFloat(inputs.globalDepth.value);
                if (inputs.cameraZoom) cfg.cameraZoom = parseInt(inputs.cameraZoom.value);

                if (inputs.particleCount) cfg.count = parseInt(inputs.particleCount.value);
                if (inputs.particleSize) cfg.size = parseFloat(inputs.particleSize.value);
                if (inputs.particleSpeed) cfg.speed = parseFloat(inputs.particleSpeed.value);
                if (inputs.particleOpacity) cfg.opacity = parseFloat(inputs.particleOpacity.value);
                if (inputs.friction) cfg.friction = parseFloat(inputs.friction.value);
                if (inputs.chaos) cfg.chaos = parseFloat(inputs.chaos.value);

                if (inputs.bgMode) cfg.bgMode = inputs.bgMode.value;
                if (inputs.bgDepth) cfg.bgDepth = parseInt(inputs.bgDepth.value);
                if (inputs.bgDensity) cfg.bgDensity = parseInt(inputs.bgDensity.value);
                if (inputs.bgSize) cfg.bgSize = parseFloat(inputs.bgSize.value);
                if (inputs.bgDistance) cfg.bgDistance = parseInt(inputs.bgDistance.value);

                if (inputs.customShapeType) cfg.customShapeType = inputs.customShapeType.value;
                if (inputs.customParam1) cfg.customParam1 = parseInt(inputs.customParam1.value);
                if (inputs.customParam2) cfg.customParam2 = parseInt(inputs.customParam2.value);
                if (inputs.customParam3) cfg.customParam3 = parseInt(inputs.customParam3.value);
                if (inputs.customParam4) cfg.customParam4 = parseInt(inputs.customParam4.value);

                populateUIFromConfig();
            }
            const customParticleImageUpload = document.getElementById('customParticleImageUpload');
            safeAddListener(customParticleImageUpload, 'change', (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        configs[activeTab].customParticleImage = event.target.result;
                        updateConfigFromUI();
                    };
                    reader.readAsDataURL(file);
                }
            });
            safeAddListener(imageUpload, 'change', (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        configs[activeTab].imageDataUrl = event.target.result;
                        if (configs[activeTab].morphMode !== 'image') {
                            configs[activeTab].morphMode = 'image';
                        }
                        updateConfigFromUI();
                    };
                    reader.readAsDataURL(file);
                }
            });

            safeAddListener(bgUpload, 'change', (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        configs[activeTab].bgImageUrl = event.target.result;
                        if (configs[activeTab].bgMode === 'none') {
                            configs[activeTab].bgMode = 'image_3d_particles';
                        }
                        updateConfigFromUI();
                    };
                    reader.readAsDataURL(file);
                }
            });

            safeAddListener(modelUpload, 'change', (e) => {
                const file = e.target.files[0];
                if (file && (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf'))) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        configs[activeTab].modelDataUrl = event.target.result;
                        if (configs[activeTab].morphMode !== 'model') {
                            configs[activeTab].morphMode = 'model';
                        }
                        updateConfigFromUI();
                    };
                    reader.readAsDataURL(file);
                }
            });

            safeAddListener(tab2D, 'click', () => {
                activeTab = '2d';
                if (tab2D) tab2D.classList.add('active');
                if (tab3D) tab3D.classList.remove('active');
                populateUIFromConfig();
            });

            safeAddListener(tab3D, 'click', () => {
                activeTab = '3d';
                if (tab3D) tab3D.classList.add('active');
                if (tab2D) tab2D.classList.remove('active');
                populateUIFromConfig();
            });

            safeAddListener(modeFree, 'click', () => {
                configs[activeTab].morphMode = 'none';
                populateUIFromConfig();
            });

            safeAddListener(modeText, 'click', () => {
                configs[activeTab].morphMode = 'text';
                populateUIFromConfig();
            });

            safeAddListener(modeImage, 'click', () => {
                configs[activeTab].morphMode = 'image';
                populateUIFromConfig();
            });

            safeAddListener(modeModel, 'click', () => {
                configs[activeTab].morphMode = 'model';
                populateUIFromConfig();
            });

            Object.values(inputs).forEach(input => {
                if (input === inputs.particleCount || input === inputs.bgDepth || input === inputs.bgDensity || input === inputs.bgDistance || input === inputs.bgSize || input === inputs.customParam1 || input === inputs.customParam2 || input === inputs.customParam3 || input === inputs.customParam4) {
                    safeAddListener(input, 'change', updateConfigFromUI);
                    safeAddListener(input, 'input', () => {
                        if (input === inputs.particleCount && labels.count) labels.count.innerText = parseInt(input.value).toLocaleString();
                        if (input === inputs.bgDepth && labels.bgDepth) labels.bgDepth.innerText = input.value + 'px';
                        if (input === inputs.bgDensity && labels.bgDensity) labels.bgDensity.innerText = input.value;
                        if (input === inputs.bgSize && labels.bgSize) labels.bgSize.innerText = parseFloat(input.value).toFixed(1);
                        if (input === inputs.bgDistance && labels.bgDistance) labels.bgDistance.innerText = input.value;

                        if (input === inputs.customParam1 && labels.customParam1) labels.customParam1.innerText = input.value;
                        if (input === inputs.customParam2 && labels.customParam2) labels.customParam2.innerText = input.value;
                        if (input === inputs.customParam3 && labels.customParam3) labels.customParam3.innerText = input.value;
                        if (input === inputs.customParam4 && labels.customParam4) labels.customParam4.innerText = input.value;
                    });
                } else {
                    safeAddListener(input, 'input', updateConfigFromUI);
                }
            });

            const saveShapeBtn = document.getElementById('saveCustomShapeBtn');
            const shapeNameInput = document.getElementById('customShapeName');

            safeAddListener(saveShapeBtn, 'click', () => {
                let name = shapeNameInput.value.trim();
                if (!name) name = "Custom Shape " + (configs['3d'].savedCustomShapes.length + 1);

                const newShape = {
                    id: 'saved_custom_' + Date.now(),
                    name: name,
                    type: configs['3d'].customShapeType,
                    p1: configs['3d'].customParam1,
                    p2: configs['3d'].customParam2,
                    p3: configs['3d'].customParam3,
                    p4: configs['3d'].customParam4,
                    imgData: configs['3d'].customParticleImage
                };

                configs['3d'].savedCustomShapes.push(newShape);
                localStorage.setItem('webgl_saved_shapes', JSON.stringify(configs['3d'].savedCustomShapes));

                configs['3d'].shape = newShape.id;
                shapeNameInput.value = '';

                populateUIFromConfig();
                updateConfigFromUI();
            });

            engine = new WebGLParticleSandbox('canvas-container');
            populateUIFromConfig();

            const exportBtn = document.getElementById('exportBtn');
            const exportCustomShapeBtn = document.getElementById('exportCustomShapeBtn');
            const exportModeFull = document.getElementById('exportModeFull');
            const exportModeShape = document.getElementById('exportModeShape');
            let currentExportMode = 'full';

            const setExportMode = (mode) => {
                currentExportMode = mode;
                if (mode === 'full') {
                    exportModeFull.className = "px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded bg-indigo-600 text-white transition-colors w-1/2 sm:w-auto";
                    exportModeShape.className = "px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded text-slate-400 hover:text-white transition-colors w-1/2 sm:w-auto";
                } else {
                    exportModeShape.className = "px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded bg-indigo-600 text-white transition-colors w-1/2 sm:w-auto";
                    exportModeFull.className = "px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded text-slate-400 hover:text-white transition-colors w-1/2 sm:w-auto";
                }
                updateExportText();
            };

            safeAddListener(exportModeFull, 'click', () => setExportMode('full'));
            safeAddListener(exportModeShape, 'click', () => setExportMode('shape'));

            const updateExportText = () => {
                const codeOutput = document.getElementById('codeOutput');
                if (!codeOutput) return;

                if (currentExportMode === 'full') {
                    const cfgExport = JSON.stringify(configs[activeTab], null, 4).replace(/</g, '\\u003c');
                    const exportStr = `<!-- WebGL Particle Engine V16.2 Drop-in -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Audiowide&family=Bebas+Neue&family=Cinzel:wght@900&family=Inter:wght@100;400;900&family=Manrope:wght@800&family=Montserrat:wght@900&family=Orbitron:wght@900&family=Outfit:wght@900&family=Playfair+Display:wght@900&family=Poppins:wght@900&family=Rajdhani:wght@700&family=Righteous&family=Roboto:wght@900&family=Space+Grotesk:wght@700&family=Syne:wght@800&family=Syncopate:wght@700&family=VT323&family=Plus+Jakarta+Sans:wght@800&family=Clash+Display:wght@700&family=Cabinet+Grotesk:wght@800&family=Anton&family=Bungee+Shade&family=Monoton&family=Rampart+One&family=Tourney:wght@900&family=Rubik+Glitch&family=Silkscreen&family=Bangers&family=Creepster&family=Press+Start+2P&display=swap');
#webgl-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background-color: #020617; touch-action: none; }
body.light-theme #webgl-bg { background-color: #f1f5f9; }
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/BufferGeometryUtils.js"><\/script>
<canvas id="webgl-bg"></canvas>
<script>
    ${WebGLParticleSandbox.toString()}

    window.addEventListener('DOMContentLoaded', () => {
        const engine = new WebGLParticleSandbox('webgl-bg');
        engine.updateConfig(${cfgExport});
    });
<\/script>`;
                    codeOutput.value = exportStr;
                } else {
                    let rawName = shapeNameInput.value.trim() || "My Custom Shape";
                    let name = escapeHTML(rawName);
                    // Also escape for JS comments to prevent breakout
                    let safeNameForComment = name.replace(/\*\//g, '* /');
                    let id = rawName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    if (!id) id = 'custom_shape_' + Date.now().toString().slice(-4);
                    if (!id.startsWith('3d_')) id = '3d_custom_' + id;

                    const type = configs['3d'].customShapeType;
                    const p1 = configs['3d'].customParam1;
                    const p2 = configs['3d'].customParam2;
                    const p3 = configs['3d'].customParam3;
                    const p4 = configs['3d'].customParam4;

                    codeOutput.value = `<!-- SHAPE SNIPPET FOR: ${name} -->\n\n/* \nTo permanently add "${safeNameForComment}" to your particle engine's source code,\nfollow these two steps in your index.html file:\n*/\n\n/* STEP 1: Add this HTML to the shapeOptions['3d'] string (around line 1115) */\n<option value="${id}">⭐ ${name}</option>\n\n/* STEP 2: Add this JS to the get3DGeometry(shape) function inside the else-if chain (around line 1250) */\nelse if (shape === '${id}') {\n    geo = this.createParametricGeometry('${type}', ${p1}, ${p2}, ${p3}, ${p4}, r);\n}`;
                }
            };

            safeAddListener(exportBtn, 'click', () => {
                setExportMode('full');
                const codeModal = document.getElementById('codeModal');
                if (codeModal) codeModal.classList.replace('modal-enter', 'modal-active');
            });

            safeAddListener(exportCustomShapeBtn, 'click', () => {
                setExportMode('shape');
                const codeModal = document.getElementById('codeModal');
                if (codeModal) codeModal.classList.replace('modal-enter', 'modal-active');
            });

            // GEMINI AI INTEGRATION ==================================

            const aiBtn = document.getElementById('aiGenerateBtn');
            const aiInput = document.getElementById('aiPromptInput');
            const aiErrorMsg = document.getElementById('aiErrorMsg');

            safeAddListener(aiBtn, 'click', async () => {
                const prompt = aiInput.value.trim();
                if (!prompt) return;

                if (aiBtn) {
                    aiBtn.innerHTML = "✨ Weaving...";
                    aiBtn.disabled = true;
                }
                if (aiErrorMsg) aiErrorMsg.classList.add('hidden');
                if (aiInput) aiInput.disabled = true;

                try {
                    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
                    const systemPrompt = `You are an expert WebGL visual designer. The user will give you a vibe, concept, or description.
Your task is to return a JSON configuration for a particle sandbox that perfectly represents this vibe.

Guidelines:
- textMorph: 1-3 thematic words separated by \\n (e.g., "NEON\\nNIGHTS").
- customColors: 2 to 5 hex codes matching the vibe.
- tab: choose "2d" or "3d".
- shape: If tab is "2d", choose from: circle, square, ring, triangle, star, hexagon, heart. If tab is "3d", choose from: custom_parametric, 3d_cube, 3d_sphere, 3d_pyramid, 3d_diamond, 3d_tetrahedron, 3d_icosahedron, 3d_dodecahedron, 3d_torus, 3d_cylinder, 3d_tube, 3d_capsule, 3d_crisp_plane, 3d_crisp_voxel, 3d_rounded_voxel, 3d_cone, 3d_torusknot, 3d_prism, 3d_gem, 3d_star, 3d_letter, 3d_cross, 3d_heart, 3d_gear, 3d_cake, 3d_dog, 3d_goblin, 3d_monkey, uploaded_model.
- behavior: choose from: swarm, galaxy, vortex, cube, rain, explode, blackhole, dna_helix, tornado, fireworks, quantum_tunnel, meteor_shower, lissajous, heart_beat, pulse_sphere, neutron_star, crystal_growth, ocean_waves, matrix_rain, snowfall, fire_sparks, magnetic_field, hyperspace, wormhole, brownian_motion, string_theory, cellular.
- mouseAction: choose from: none, repel, attract, vortex, blackhole_hover, trail, paint, magnify, freeze, jitter, orbit, whip, dodge, glitch, slowmo.
- clickAction: choose from: none, shockwave, implode, shatter, teleport, color_splash, gravity_slam, time_freeze, vortex_burst, repel_wave, blackhole_suck, size_pop, scatter_frenzy, reverse_flow.
- mode: "none" for physics free-roam, "text" to form the textMorph.
- speed: 0.1 to 5.0
- friction: 0.80 to 1.00
- chaos: 0.0 to 5.0`;

                    const payload = {
                        contents: [{ parts: [{ text: prompt }] }],
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        generationConfig: {
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: "OBJECT",
                                properties: {
                                    tab: { type: "STRING" },
                                    mode: { type: "STRING" },
                                    textMorph: { type: "STRING" },
                                    customColors: { type: "ARRAY", items: { type: "STRING" } },
                                    behavior: { type: "STRING" },
                                    shape: { type: "STRING" },
                                    speed: { type: "NUMBER" },
                                    friction: { type: "NUMBER" },
                                    chaos: { type: "NUMBER" },
                                    mouseAction: { type: "STRING" },
                                    clickAction: { type: "STRING" }
                                }
                            }
                        }
                    };

                    const data = await fetchWithRetry(endpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!resultText) throw new Error("No content returned from AI.");

                    const aiConfig = JSON.parse(resultText);

                    activeTab = aiConfig.tab === '2d' ? '2d' : '3d';

                    let safeShape = aiConfig.shape || '3d_cube';
                    if (activeTab === '2d' && safeShape.startsWith('3d_')) safeShape = 'circle';
                    if (activeTab === '3d' && !safeShape.startsWith('3d_')) safeShape = '3d_cube';

                    configs[activeTab].morphMode = aiConfig.mode === 'text' ? 'text' : 'none';
                    if (aiConfig.textMorph) configs[activeTab].textMorph = aiConfig.textMorph.replace(/\\n/g, '\n');

                    configs[activeTab].theme = 'custom_gradient';
                    if (aiConfig.customColors && aiConfig.customColors.length) {
                        configs[activeTab].customColors = aiConfig.customColors.slice(0, 10);
                    }

                    if (aiConfig.behavior) configs[activeTab].behavior = aiConfig.behavior;
                    configs[activeTab].shape = safeShape;
                    if (aiConfig.speed !== undefined) configs[activeTab].speed = Math.max(0.01, Math.min(10.0, aiConfig.speed));
                    if (aiConfig.friction !== undefined) configs[activeTab].friction = Math.max(0.8, Math.min(1.0, aiConfig.friction));
                    if (aiConfig.chaos !== undefined) configs[activeTab].chaos = Math.max(0.0, Math.min(5.0, aiConfig.chaos));
                    if (aiConfig.mouseAction) configs[activeTab].mouseAction = aiConfig.mouseAction;
                    if (aiConfig.clickAction) configs[activeTab].clickAction = aiConfig.clickAction;

                    const tab2DBtn = document.getElementById('tab2D');
                    const tab3DBtn = document.getElementById('tab3D');
                    if (activeTab === '2d') {
                        if(tab2DBtn) tab2DBtn.classList.add('active');
                        if(tab3DBtn) tab3DBtn.classList.remove('active');
                    } else {
                        if(tab3DBtn) tab3DBtn.classList.add('active');
                        if(tab2DBtn) tab2DBtn.classList.remove('active');
                    }

                    populateUIFromConfig();

                } catch (err) {
                    console.error(err);
                    if (aiErrorMsg) {
                        aiErrorMsg.innerText = "Error communicating with AI. Please check console or try again.";
                        aiErrorMsg.classList.remove('hidden');
                    }
                } finally {
                    if (aiBtn) {
                        aiBtn.innerHTML = "✨ Generate";
                        aiBtn.disabled = false;
                    }
                    if (aiInput) aiInput.disabled = false;
                }
            });

            const closeModalBtn = document.getElementById('closeModalBtn');
            safeAddListener(closeModalBtn, 'click', () => {
                const codeModal = document.getElementById('codeModal');
                if (codeModal) codeModal.classList.replace('modal-active', 'modal-enter');
            });

            const copyCodeBtn = document.getElementById('copyCodeBtn');
            safeAddListener(copyCodeBtn, 'click', () => {
                const codeOutput = document.getElementById('codeOutput');
                if (codeOutput) {
                    codeOutput.select();
                    document.execCommand('copy');
                    copyCodeBtn.innerText = 'Copied!';
                    copyCodeBtn.classList.replace('bg-cyan-600', 'bg-green-600');
                    setTimeout(() => {
                        copyCodeBtn.innerText = 'Copy to Clipboard';
                        copyCodeBtn.classList.replace('bg-green-600', 'bg-cyan-600');
                    }, 2000);
                }
            });
        });
