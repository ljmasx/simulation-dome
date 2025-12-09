    // --- SCENE SETUP ---
    const container = document.getElementById('canvas-container');
    
    // SAFETY: Ensure container is empty (removes ghost canvas from Save As)
    container.innerHTML = '';

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const sceneL = new THREE.Scene();
    sceneL.background = new THREE.Color(0x111827); 
    const sceneR = new THREE.Scene();
    sceneR.background = new THREE.Color(0x0f172a); 

    const cameraL = new THREE.PerspectiveCamera(35, (window.innerWidth * 0.35) / window.innerHeight, 0.1, 100);
    cameraL.position.set(0, 1, 28);
    cameraL.lookAt(0, -1, 0);

    const cameraR = new THREE.PerspectiveCamera(45, (window.innerWidth * 0.65) / window.innerHeight, 0.1, 100);
    cameraR.position.set(10, 5, 12);
    cameraR.lookAt(2, 0, 0);

    function setupLights(scene, intensity = 1) {
        const amb = new THREE.AmbientLight(0xffffff, 0.6 * intensity);
        scene.add(amb);
        const main = new THREE.DirectionalLight(0xffffff, 1.2 * intensity);
        main.position.set(5, 10, 10);
        main.castShadow = true;
        scene.add(main);
        const rim = new THREE.SpotLight(0x3b82f6, 2 * intensity);
        rim.position.set(-10, 5, -5);
        rim.lookAt(0,0,0);
        scene.add(rim);
    }
    setupLights(sceneL, 1.0);
    setupLights(sceneR, 1.2);

    // --- LEFT SCENE (HANDLES) ---
    const plasticMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.1 });
    const interactables = [];

    function createHandle(xPos, color, name) {
        const group = new THREE.Group();
        group.position.x = xPos;
        
        // Shaft
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 14, 0.4), plasticMat));
        const groove = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 12), new THREE.MeshStandardMaterial({ color: 0x000000 }));
        groove.position.z = 0.21; group.add(groove);
        
        // Marks
        for(let i=0; i<9; i++) {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true }));
            m.position.z = 0.211; m.position.y = -3 + (i * 0.8);
            group.add(m);
        }

        // Thumb
        const thumb = new THREE.Group(); thumb.position.y = -7.5;
        thumb.add(new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.15, 16, 32), plasticMat));
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1, 16), plasticMat);
        neck.position.y = 0.8; thumb.add(neck);
        group.add(thumb);

        // Slider
        const slider = new THREE.Group();
        const hitBox = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.5, 1), new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.userData = { name: name }; slider.add(hitBox); interactables.push(hitBox);

        const block = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.8), new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.2 }));
        slider.add(block);
        const ringGeo = new THREE.TorusGeometry(0.7, 0.14, 16, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.1 });
        const r1 = new THREE.Mesh(ringGeo, ringMat); r1.position.x = -1.1; slider.add(r1);
        const r2 = new THREE.Mesh(ringGeo, ringMat); r2.position.x = 1.1; slider.add(r2);
        
        group.add(slider);
        sceneL.add(group);
        return { slider, group };
    }
    const handleA = createHandle(-2.5, 0xff0000, 'A');
    const handleB = createHandle(2.5, 0x3b82f6, 'B');

    // --- RIGHT SCENE (BASKET) ---
    const basketGroup = new THREE.Group();
    sceneR.add(basketGroup);

    // Sheath
    const sheath = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 12, 32), new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4, transmission: 0.5, roughness: 0.2, metalness: 0.5 }));
    sheath.rotation.z = Math.PI/2; sheath.position.x = -6;
    sceneR.add(sheath);

    // --- ORGANIC POLYP ---
    const polypGeo = new THREE.IcosahedronGeometry(1.2, 8);
    const polypMat = new THREE.MeshPhysicalMaterial({
        color: 0xd46868, emissive: 0x330000,
        roughness: 0.3, metalness: 0.1,
        clearcoat: 0.8, clearcoatRoughness: 0.2
    });
    const pos = polypGeo.attributes.position;
    const v = new THREE.Vector3();
    for(let i=0; i<pos.count; i++){
        v.fromBufferAttribute(pos, i);
        const noise = Math.sin(v.x * 2) * Math.sin(v.y * 2) * Math.sin(v.z * 2);
        const disp = 1 + (noise * 0.15) + (Math.random() * 0.05);
        v.multiplyScalar(disp);
        pos.setXYZ(i, v.x, v.y, v.z);
    }
    polypGeo.computeVertexNormals();
    
    const specimen = new THREE.Mesh(polypGeo, polypMat);
    const specimenGroup = new THREE.Group();
    specimenGroup.position.set(2.7, -6, 0); // Start low (like after release/before capture)
    specimenGroup.visible = false; // Initially hidden if starting withdrawn
    specimenGroup.add(specimen);
    sceneR.add(specimenGroup);

    // --- BASKET STRUCTURES ---
    const archMat = new THREE.MeshStandardMaterial({ 
        color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.4, 
        metalness: 0.9, roughness: 0.1 
    });
    const archMesh = new THREE.Mesh(new THREE.BufferGeometry(), archMat);
    basketGroup.add(archMesh);

    const wireMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 });
    const loopL = new THREE.Mesh(new THREE.BufferGeometry(), wireMat);
    const loopR = new THREE.Mesh(new THREE.BufferGeometry(), wireMat);
    basketGroup.add(loopL); basketGroup.add(loopR);

    // NET MESH
    const netMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, wireframe: true, transparent: true, opacity: 0.4, side: THREE.DoubleSide
    });
    const netMeshL = new THREE.Mesh(new THREE.BufferGeometry(), netMat);
    const netMeshR = new THREE.Mesh(new THREE.BufferGeometry(), netMat);
    basketGroup.add(netMeshL); basketGroup.add(netMeshR);

    // --- STATE & PHYSICS ---
    const state = { hVert: 0, hHoriz: 0, deploy: 0, isEjected: false };
    const REST_Y = 1.3;
    const LOW_Y = -6.0; // Ejected/Low position
    let currentPhase = 5; // Track current phase for CARRY drag feature

    // --- CARRY DRAG SYSTEM ---
    // Groupe pour déplacer ensemble cathéter + DOME + polype
    const catheterAssembly = new THREE.Group();
    sceneR.remove(sheath);
    sceneR.remove(basketGroup);
    sceneR.remove(specimenGroup);
    catheterAssembly.add(sheath);
    catheterAssembly.add(basketGroup);
    catheterAssembly.add(specimenGroup);
    sceneR.add(catheterAssembly);

    // Position initiale de l'assemblage
    const assemblyRestPosition = { x: 0, y: 0, z: 0 };

    // État du drag
    let isDraggingCatheter = false;
    let dragStartMouse = { x: 0, y: 0 };
    let dragStartPosition = { y: 0, z: 0 };

    // Raycaster pour la scène droite (endoscopique)
    const raycasterR = new THREE.Raycaster();

    // Hitbox invisible pour le sheath (plus facile à cliquer)
    const sheathHitbox = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 14, 16),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    sheathHitbox.rotation.z = Math.PI/2;
    sheathHitbox.position.x = -6;
    catheterAssembly.add(sheathHitbox);

    function updateNetGeometry(mesh, curveTop, curveSide, numSegments) {
        const topPoints = curveTop.getPoints(numSegments);
        const sidePoints = curveSide.getPoints(numSegments);
        const vertices = [];
        const indices = [];
        for (let i = 0; i <= numSegments; i++) {
            vertices.push(topPoints[i].x, topPoints[i].y, topPoints[i].z);
            vertices.push(sidePoints[i].x, sidePoints[i].y, sidePoints[i].z);
        }
        for (let i = 0; i < numSegments; i++) {
            const base = i * 2;
            indices.push(base, base + 1, base + 2);
            indices.push(base + 1, base + 3, base + 2);
        }
        mesh.geometry.dispose();
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        mesh.geometry = geo;
    }

    function updateVisuals() {
        handleA.slider.position.y = -3.5 + (state.hVert * 7);
        handleB.slider.position.y = -3.5 + (state.hHoriz * 7);
        basketGroup.position.x = (state.deploy - 1) * 7;

        const L = 5.5; const pts = 30; 
        
        // Arch
        const aH = state.hVert * 4.0;
        const aL = L - (state.hVert * 0.6);
        const aCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0,0,0), new THREE.Vector3(aL*0.2, aH*0.7, 0),
            new THREE.Vector3(aL*0.5, aH, 0), new THREE.Vector3(aL*0.8, aH*0.7, 0), new THREE.Vector3(aL,0,0)
        ]);
        archMesh.geometry.dispose();
        archMesh.geometry = new THREE.TubeGeometry(aCurve, pts*2, 0.12, 12, false);

        // Loops
        const wW = state.hHoriz * 3.5;
        const wL = L - (state.hHoriz * 0.3);
        const cL = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0,0,0), new THREE.Vector3(wL*0.2, 0, wW*0.6),
            new THREE.Vector3(wL*0.5, 0, wW), new THREE.Vector3(wL*0.8, 0, wW*0.6), new THREE.Vector3(wL,0,0)
        ]);
        const cR = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0,0,0), new THREE.Vector3(wL*0.2, 0, -wW*0.6),
            new THREE.Vector3(wL*0.5, 0, -wW), new THREE.Vector3(wL*0.8, 0, -wW*0.6), new THREE.Vector3(wL,0,0)
        ]);
        loopL.geometry.dispose(); loopL.geometry = new THREE.TubeGeometry(cL, pts*2, 0.05, 8, false);
        loopR.geometry.dispose(); loopR.geometry = new THREE.TubeGeometry(cR, pts*2, 0.05, 8, false);

        // Net
        updateNetGeometry(netMeshL, aCurve, cL, 20);
        updateNetGeometry(netMeshR, aCurve, cR, 20);

        // Physics
        if(!state.isEjected) {
            // Push Down Logic (when visible and inside)
            // Only apply if specimen is in "active" zone (REST_Y)
            if (specimenGroup.visible && Math.abs(specimenGroup.position.y - REST_Y) < 0.5) {
                let tY = REST_Y; 
                if(state.deploy > 0.9 && aH < (REST_Y + 0.5)) {
                    tY = Math.min(REST_Y, aH - 0.5); 
                }
                specimenGroup.position.y = tY;
            }

            if(state.deploy > 0.9 && state.hHoriz < 0.5) {
                const s = 1 - (state.hHoriz * 0.15);
                specimen.scale.set(s, 1, s);
            } else {
                specimen.scale.set(1, 1, 1);
            }
        }
    }

    // --- INTERACTION ---
    const raycaster = new THREE.Raycaster();

    // Mousedown - gère les deux viewports
    window.addEventListener('mousedown', (e) => {
        const split = window.innerWidth * 0.35;

        // Viewport gauche - handles
        if(e.clientX <= split) {
            const x = (e.clientX / split) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera({x, y}, cameraL);
            const hits = raycaster.intersectObjects(interactables);
            if(hits.length > 0) handleObjectClick(hits[0].object.userData.name);
            return;
        }

        // Viewport droit - drag cathéter uniquement en phase CARRY (3)
        if(currentPhase === 3) {
            const rightWidth = window.innerWidth - split;
            const x = ((e.clientX - split) / rightWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycasterR.setFromCamera({x, y}, cameraR);
            const hits = raycasterR.intersectObjects([sheathHitbox, sheath, ...basketGroup.children]);
            if(hits.length > 0) {
                isDraggingCatheter = true;
                dragStartMouse = { x: e.clientX, y: e.clientY };
                dragStartPosition = { y: catheterAssembly.position.y, z: catheterAssembly.position.z };
                document.body.style.cursor = 'grabbing';
            }
        }
    });

    // Mousemove - gère hover et drag
    window.addEventListener('mousemove', (e) => {
        const split = window.innerWidth * 0.35;

        // Si on drag le cathéter
        if(isDraggingCatheter) {
            const deltaX = (e.clientX - dragStartMouse.x) * 0.02;
            const deltaY = (e.clientY - dragStartMouse.y) * 0.02;
            catheterAssembly.position.y = dragStartPosition.y - deltaY;
            catheterAssembly.position.z = dragStartPosition.z - deltaX; // Inversé pour correspondre au sens de la main
            // Limiter le mouvement
            catheterAssembly.position.y = Math.max(-3, Math.min(3, catheterAssembly.position.y));
            catheterAssembly.position.z = Math.max(-4, Math.min(4, catheterAssembly.position.z));
            return;
        }

        // Hover viewport gauche
        if(e.clientX <= split) {
            const x = (e.clientX / split) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera({x, y}, cameraL);
            const hits = raycaster.intersectObjects(interactables);
            document.body.style.cursor = hits.length > 0 ? 'pointer' : 'default';
            document.getElementById('tag-A').style.opacity = (hits.length && hits[0].object.userData.name === 'A') ? 1 : 0.6;
            document.getElementById('tag-B').style.opacity = (hits.length && hits[0].object.userData.name === 'B') ? 1 : 0.6;
            return;
        }

        // Hover viewport droit - cursor grab uniquement en phase CARRY
        if(currentPhase === 3) {
            const rightWidth = window.innerWidth - split;
            const x = ((e.clientX - split) / rightWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycasterR.setFromCamera({x, y}, cameraR);
            const hits = raycasterR.intersectObjects([sheathHitbox, sheath, ...basketGroup.children]);
            document.body.style.cursor = hits.length > 0 ? 'grab' : 'default';
        } else {
            document.body.style.cursor = 'default';
        }
    });

    // Mouseup - fin du drag, retour à la position initiale
    window.addEventListener('mouseup', () => {
        if(isDraggingCatheter) {
            isDraggingCatheter = false;
            document.body.style.cursor = 'default';
            // Animation de retour à la position initiale
            gsap.to(catheterAssembly.position, {
                x: assemblyRestPosition.x,
                y: assemblyRestPosition.y,
                z: assemblyRestPosition.z,
                duration: 0.5,
                ease: "back.out(1.5)"
            });
        }
    });

    function handleObjectClick(handle) {
        if (state.deploy < 0.5) { triggerPhase(1); return; }

        // Logique basée sur la phase courante pour des transitions prévisibles
        if (currentPhase === 1) { // DEPLOY
            if (handle === 'A') triggerPhase(2); // → CAPTURE
            else if (handle === 'B') triggerPhase(5); // → WITHDRAW
        }
        else if (currentPhase === 2) { // CAPTURE
            if (handle === 'B') triggerPhase(3); // → CARRY
            else if (handle === 'A') triggerPhase(1); // → DEPLOY (retour)
        }
        else if (currentPhase === 3) { // CARRY
            if (handle === 'A') triggerPhase(4); // → RELEASE
            else if (handle === 'B') triggerPhase(2); // → CAPTURE (retour)
        }
        else if (currentPhase === 4) { // RELEASE
            if (handle === 'A') triggerPhase(1); // → DEPLOY
            else if (handle === 'B') triggerPhase(5); // → WITHDRAW
        }
        else { triggerPhase(1); } // Phase 5 (WITHDRAW) → DEPLOY
    }

    function triggerPhase(n) {
        // Mettre à jour la phase courante
        currentPhase = n;

        // Reset position cathéter si on quitte CARRY
        if(n !== 3) {
            gsap.to(catheterAssembly.position, { x: 0, y: 0, z: 0, duration: 0.3 });
        }

        document.querySelectorAll('.phase-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`btn-${n}`).classList.add('active');
        const title = document.getElementById('status-title');
        const desc = document.getElementById('status-desc');

        // VISIBILITY & POSITION LOGIC
        if (n === 5) {
            // 5. WITHDRAW: Instant Disappear
            specimenGroup.visible = false;
        } else if (n === 1) {
            // 1. DEPLOY: Stay Low (Out of way) but Visible if desired?
            // User asked for "conflict" avoidance -> Put it at LOW_Y
            specimenGroup.visible = true;
            gsap.to(specimenGroup.position, { y: LOW_Y, duration: 0.5 });
        } else if (n === 2) {
            // 2. CAPTURE: Move to Center (REST_Y) to be captured
            specimenGroup.visible = true;
            state.isEjected = false;
            gsap.to(specimenGroup.position, { y: REST_Y, duration: 0.8, ease: "back.out(1.2)" }); // Pop up into basket
        } else if (n === 3) {
            // 3. CARRY: Ensure at REST_Y
            specimenGroup.visible = true;
            state.isEjected = false;
            gsap.to(specimenGroup.position, { y: REST_Y, duration: 0.5 });
        } else if (n === 4) {
            // 4. RELEASE: Logic handled below (Eject)
            specimenGroup.visible = true;
        }

        if(n===1) {
            title.innerHTML = "1. DEPLOY";
            desc.innerHTML = "Device exits catheter. Polyp is below waiting.";
            // Deploy: Vert=0, Horiz=1
            gsap.to(state, { deploy: 1, hVert: 0, hHoriz: 1, duration: 1 });
        } else if(n===2) {
            title.innerHTML = "2. CAPTURE";
            desc.innerHTML = "Red Handle FWD. Arch rises, Polyp enters basket.";
            // Capture: Vert=1, Horiz=1
            gsap.to(state, { deploy: 1, hVert: 1, hHoriz: 1, duration: 1 });
        } else if(n===3) {
            title.innerHTML = "3. CARRY";
            desc.innerHTML = "Blue Handle BACK. Net closes around polyp.<br><span class='text-blue-400 text-xs'>Drag catheter to demonstrate carry motion.</span>";
            // Carry: Vert=1, Horiz=0.15
            gsap.to(state, { deploy: 1, hVert: 1, hHoriz: 0.15, duration: 1 });
        } else if(n===4) {
            title.innerHTML = "4. RELEASE";
            desc.innerHTML = "<b>Action:</b> Red Handle Pulled BACK. Piston Effect.";
            // Release: Vert=0, Horiz=1 (Fast)
            gsap.to(state, { hHoriz: 1, duration: 0.3 });
            gsap.to(state, { hVert: 0, delay: 0, duration: 0.4, ease: "back.in(1.5)", onStart: () => {
                state.isEjected = true;
                // Eject down to LOW_Y
                gsap.to(specimenGroup.position, { y: LOW_Y, duration: 0.6, ease: "power1.in" });
                gsap.to(specimen.rotation, { x: 3, z: 2, duration: 0.6 });
            }});
        } else if(n===5) {
            title.innerHTML = "5. WITHDRAW";
            desc.innerHTML = "System retracted.";
            // Withdraw: All 0
            gsap.to(state, { deploy: 0, hVert: 0, hHoriz: 0, duration: 1 });
        }
    }

    // Download Function
    function downloadSource() {
        const htmlContent = document.documentElement.outerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dome_simulator_final.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Init
    window.addEventListener('resize', () => {
        const w = window.innerWidth; const h = window.innerHeight;
        renderer.setSize(w, h);
        cameraL.aspect = (w*0.35)/h; cameraL.updateProjectionMatrix();
        cameraR.aspect = (w*0.65)/h; cameraR.updateProjectionMatrix();
    });

    setTimeout(() => { document.getElementById('click-hint').style.opacity = 1; }, 1000);
    setTimeout(() => { document.getElementById('click-hint').style.opacity = 0; }, 5000);

    function render() {
        requestAnimationFrame(render);
        updateVisuals();
        if(!state.isEjected) specimen.rotation.y += 0.005;

        const w = window.innerWidth; const h = window.innerHeight; const s = w * 0.35;
        renderer.setViewport(0,0,s,h); renderer.setScissor(0,0,s,h); renderer.setScissorTest(true);
        renderer.render(sceneL, cameraL);
        renderer.setViewport(s,0,w-s,h); renderer.setScissor(s,0,w-s,h); renderer.setScissorTest(true);
        renderer.render(sceneR, cameraR);
    }

    triggerPhase(5); // Start withdrawn
    setTimeout(() => triggerPhase(1), 800);
    render();

