// Geo-Slash Mini-Game - Vanilla JS Canvas
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('geo-slash-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true }); // Enable transparency for the background grid
    const gameContainer = document.querySelector('.geo-slash-game');
    const flashOverlay = document.querySelector('.slash-flash-overlay');

    // State
    let width = 0;
    let height = 0;
    let isDragging = false;

    // Config
    const GRAVITY = 0.25;
    const SLICE_DIST_THRESHOLD = 40; // Pixels distance to register a hit

    // Game Entities
    let targets = []; // Floating geometric shapes
    let particles = []; // Debris from sliced shapes
    let slashTrail = []; // {x, y, age}

    // Images for Targets
    const isoImages = [];
    // Load specific pre-generated transparent assets
    const imageFiles = [
        'velvet_sphere.png',
        'textured_cone.png',
        'glossy_torus.png',
        'metallic_cylinder.png',
        'polished_bead.png',
        'velvet_pyramid.png',
        'jelly_prism.png',
        'matte_pebble.png',
        'chrome_ribbon.png',
        'split_bowl.png'
    ];

    imageFiles.forEach(src => {
        const img = new Image();
        img.src = `geo-slash-assets/${src}?v=3`; // ?v=3 forces browser to bypass cache
        isoImages.push(img);
    });

    // Colors
    const BG_COLOR = '#ffffff'; // Pure White
    const SWORD_GLOW = 'rgba(0,0,0,0.2)'; // Dark subtle glow for white background

    // --- Sizing & Scaling ---
    function resizeCanvas() {
        const rect = gameContainer.getBoundingClientRect();
        // Handle high-DPI displays for crisp rendering
        const dpr = window.devicePixelRatio || 1;

        width = rect.width;
        height = rect.height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        ctx.scale(dpr, dpr);
    }

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(gameContainer);
    resizeCanvas();

    // --- Input Handling ---
    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        // Handle both touch and mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function handleMove(e) {
        const pos = getPointerPos(e);
        const lastPos = slashTrail.length > 0 ? slashTrail[0] : pos;

        slashTrail.unshift({ x: pos.x, y: pos.y, age: 0 }); // Add to front

        // Max trail tracked
        if (slashTrail.length > 25) {
            slashTrail.pop();
        }

        // Check for collisions along the line segment from lastPos to pos
        checkSlices(lastPos, pos);
    }

    // Since we want hover activation, we just clear trail quickly if mouse stops
    // We don't need mousedown/mouseup anymore.
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });

    // --- Math & Collision Helpers ---
    // Distance from a point (target) to a line segment (the slash)
    function distPointToSegment(p, v, w) {
        const l2 = Math.pow(w.x - v.x, 2) + Math.pow(w.y - v.y, 2);
        if (l2 == 0) return Math.hypot(p.x - v.x, p.y - v.y);

        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));

        return Math.hypot(
            p.x - (v.x + t * (w.x - v.x)),
            p.y - (v.y + t * (w.y - v.y))
        );
    }

    let isGameStarted = false;
    let cutScore = 0; // Track the total number of successful cuts

    function updateScoreboard() {
        const scoreEl = document.getElementById('geo-score-count');
        const cardEl = document.getElementById('geo-scorecard');
        if (scoreEl && cardEl) {
            scoreEl.innerText = cutScore;
            // Only show the scorecard once they start cutting or the game pops
            if (cutScore > 0 || isGameStarted) {
                cardEl.style.display = 'flex';
            }
        }
    }

    function spawnTarget(forceImg = null) {
        const radius = Math.random() * 60 + 60; // 60-120px (3x larger)
        // Keep within horizontal bounds
        const x = Math.random() * (width - radius * 4) + radius * 2;
        const img = forceImg || isoImages[Math.floor(Math.random() * isoImages.length)];

        // Static bounds if game hasn't started
        const startY = isGameStarted ? (height + radius + 10) : (radius + Math.random() * (height - radius * 2));
        const requiredVy = isGameStarted ? Math.sqrt(2 * GRAVITY * height) : 0;
        const startVx = isGameStarted ? (Math.random() - 0.5) * (width * 0.01) : 0;
        const startRotSpeed = isGameStarted ? (Math.random() - 0.5) * 0.1 : 0;

        targets.push({
            x: x,
            y: startY,
            vx: startVx,
            vy: -requiredVy,
            radius: radius,
            img: img,
            rotation: 0,
            rotSpeed: startRotSpeed,
        });
    }

    // Triggered on slice
    function triggerJuice() {
        // Vibration/Shake removed per user request
    }

    function createDebris(x, y) {
        // Just spawn sparks (bisecting an image cleanly in canvas is complex, 
        // sparks + shake carry the juice well)
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                radius: Math.random() * 4 + 1,
                color: Math.random() > 0.5 ? '#f43f5e' : '#6366f1', // Pink/Indigo sparks
                alpha: 1,
                decay: Math.random() * 0.05 + 0.02,
                isSpark: true
            });
        }
    }

    // --- Engine Update ---
    function checkSlices(v, w) {
        for (let i = targets.length - 1; i >= 0; i--) {
            let t = targets[i];

            // Fast bounding box check then exact distance check
            const dist = distPointToSegment({ x: t.x, y: t.y }, v, w);

            if (dist < t.radius + SLICE_DIST_THRESHOLD) {
                // Sliced! Replace target with two halves
                targets.splice(i, 1);

                // Update Score
                cutScore++;
                updateScoreboard();

                // If it gets too small, it's fully destroyed
                if (t.radius < 25) {
                    continue;
                }

                const newRadius = t.radius * 0.7; // Shrink radius for infinite slicing

                // Left half
                targets.push({
                    x: t.x - 10,
                    y: t.y,
                    vx: t.vx - 3, // Push left
                    vy: t.vy - 2, // Slight hop
                    radius: newRadius,
                    img: t.img,
                    rotation: t.rotation - 0.2,
                    rotSpeed: t.rotSpeed - 0.05,
                    sliceSide: 'left'
                });

                // Right half
                targets.push({
                    x: t.x + 10,
                    y: t.y,
                    vx: t.vx + 3, // Push right
                    vy: t.vy - 2, // Slight hop
                    radius: newRadius,
                    img: t.img,
                    rotation: t.rotation + 0.2,
                    rotSpeed: t.rotSpeed + 0.05,
                    sliceSide: 'right'
                });
            }
        }
    }

    let frameCount = 0;

    function drawImageTarget(t) {
        if (!t.img || !t.img.complete) return;
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.rotation);

        // Since we are now loading transparent PNGs, we don't need 'darken' composite operation
        // ctx.globalCompositeOperation = 'darken';

        const renderSize = t.radius * 2.5;

        // Clip if it's a sliced half
        if (t.sliceSide) {
            ctx.beginPath();
            if (t.sliceSide === 'left') {
                ctx.rect(-renderSize / 2, -renderSize / 2, renderSize / 2, renderSize);
            } else if (t.sliceSide === 'right') {
                ctx.rect(0, -renderSize / 2, renderSize / 2, renderSize);
            }
            ctx.clip();
        }

        ctx.drawImage(t.img, -renderSize / 2, -renderSize / 2, renderSize, renderSize);
        ctx.restore();
    }

    function loop() {
        // Clear background for transparency over bg_grid.webp
        ctx.clearRect(0, 0, width, height);

        frameCount++;

        // Random spawner logic
        if (isGameStarted) {
            // Spawn more often if there are fewer targets
            const spawnChance = targets.length === 0 ? 0.05 : 0.02;
            if (Math.random() < spawnChance) {
                spawnTarget();
            }
        }

        // Update & Render Targets
        for (let i = targets.length - 1; i >= 0; i--) {
            let t = targets[i];

            // Physics (only after game starts or if it's been sliced)
            if (isGameStarted || t.sliceSide) {
                t.vy += GRAVITY;
                t.x += t.vx;
                t.y += t.vy;
                t.rotation += t.rotSpeed;
            }

            // Render
            drawImageTarget(t);

            // Remove if fallen below screen
            if (t.y > height + t.radius * 3) {
                targets.splice(i, 1);
            }
        }

        // Update & Render Particles (Debris)
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];

            p.vy += GRAVITY;
            p.x += p.vx;
            p.y += p.vy;

            // Always sparks now
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            // ctx.shadowColor = p.color;
            // ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // reset

            if (p.y > height + 100) {
                particles.splice(i, 1);
            }
        }

        // Render Slash Trail (White Tapering Blade)
        if (slashTrail.length > 1) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = SWORD_GLOW; // Subtle dark glow
            ctx.shadowBlur = 10;

            for (let i = 1; i < slashTrail.length; i++) {
                const pt1 = slashTrail[i - 1];
                const pt2 = slashTrail[i];

                // Trail fades out over 18 frames (~300ms)
                const alpha = Math.max(0, 1 - (pt2.age / 18));
                // Sword width tapers from head to tail
                const thickness = Math.max(0.5, 12 * (1 - (i / slashTrail.length)));

                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.strokeStyle = `rgba(150, 150, 150, ${alpha})`; // Smooth realistic grey
                ctx.lineWidth = thickness;
                ctx.stroke();
            }
            ctx.shadowBlur = 0;

            // Age the points
            for (let i = 0; i < slashTrail.length; i++) {
                slashTrail[i].age++;
            }

            // Remove dead points (> 18 frames old ~300ms)
            slashTrail = slashTrail.filter(p => p.age < 18);
        }

        requestAnimationFrame(loop);
    }

    function initGame() {
        // Pre-load all images dynamically to fix the race condition before starting the game
        const imagePromises = isoImages.map(img => {
            return new Promise((resolve) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if one fails
                }
            });
        });

        Promise.all(imagePromises).then(() => {
            // Start engine immediately now that assets are ready
            isGameStarted = true;
            loop();
        });
    }

    // Start initialization sequence
    initGame();
});
