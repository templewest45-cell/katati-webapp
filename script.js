document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const tray = document.getElementById('tray');
    const resetBtn = document.getElementById('reset-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const winOverlay = document.getElementById('win-overlay');

    // Settings Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsBtn = document.getElementById('save-settings');
    const cancelSettingsBtn = document.getElementById('cancel-settings');
    const shapeCountInput = document.getElementById('shape-count');
    const shapeCountVal = document.getElementById('shape-count-val');
    const shapeSettingsList = document.getElementById('shape-settings-list');

    // Default Configuration
    const allShapes = ['rhombus', 'pentagon', 'square', 'cross', 'triangle', 'circle'];
    const defaultColors = {
        'circle': '#e74c3c',
        'triangle': '#3498db',
        'square': '#2ecc71',
        'rhombus': '#9b59b6',
        'pentagon': '#f1c40f',
        'cross': '#e67e22'
    };

    // State
    let currentSettings = {
        count: 6,
        activeShapes: [...allShapes],
        colors: { ...defaultColors }
    };

    let placedCount = 0;
    let targetCount = 0;

    // --- Audio Logic ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
    }

    // Unlock audio context on first interaction
    document.body.addEventListener('click', initAudio, { once: true });
    document.body.addEventListener('touchstart', initAudio, { once: true });

    function playSnapSound() {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const t = audioCtx.currentTime;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // "Pachi" / Snap sound synthesis
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, t);
        oscillator.frequency.exponentialRampToValueAtTime(100, t + 0.05);

        gainNode.gain.setValueAtTime(0.3, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

        oscillator.start(t);
        oscillator.stop(t + 0.05);
    }

    function playFanfare() {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const t = audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const times = [0, 0.15, 0.3, 0.45];
        const durations = [0.1, 0.1, 0.1, 0.6];

        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + times[i]);
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            gain.gain.setValueAtTime(0, t + times[i]);
            gain.gain.linearRampToValueAtTime(0.3, t + times[i] + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + times[i] + durations[i]);

            osc.start(t + times[i]);
            osc.stop(t + times[i] + durations[i]);
        });
    }

    // --- Settings Logic ---

    function loadSettings() {
        const stored = localStorage.getItem('shapePuzzleSettings');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Merge with defaults to handle versioning/missing keys safely
                currentSettings = {
                    ...currentSettings,
                    ...parsed,
                    colors: { ...currentSettings.colors, ...parsed.colors }
                };
            } catch (e) {
                console.error("Failed to load settings", e);
            }
        }
        applySettingsToStyles();
    }

    function saveSettings() {
        localStorage.setItem('shapePuzzleSettings', JSON.stringify(currentSettings));
        settingsModal.classList.add('hidden');
        initGame();
    }

    function applySettingsToStyles() {
        // Update CSS variables for colors
        const root = document.documentElement;
        for (const [shape, color] of Object.entries(currentSettings.colors)) {
            root.style.setProperty(`--color-${shape}`, color);
        }
    }

    function populateSettingsUI() {
        // Count slider
        shapeCountInput.value = currentSettings.count;
        shapeCountVal.textContent = currentSettings.count;

        // Shape Map
        shapeSettingsList.innerHTML = '';
        allShapes.forEach(shape => {
            const div = document.createElement('div');
            div.className = 'shape-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `check-${shape}`;
            checkbox.checked = currentSettings.activeShapes.includes(shape);

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = currentSettings.colors[shape];
            colorInput.id = `color-${shape}`;

            const label = document.createElement('label');
            label.htmlFor = `check-${shape}`;
            label.textContent = getShapeLabel(shape);

            div.appendChild(checkbox);
            div.appendChild(colorInput);
            div.appendChild(label);
            shapeSettingsList.appendChild(div);
        });
    }

    function getShapeLabel(shape) {
        const labels = {
            'circle': 'まる',
            'triangle': 'さんかく',
            'square': 'しかく',
            'rhombus': 'ひしがた',
            'pentagon': 'ごかくけい',
            'cross': 'じゅうじ'
        };
        return labels[shape] || shape;
    }

    function readSettingsFromUI() {
        // Count
        currentSettings.count = parseInt(shapeCountInput.value, 10);

        // Active Shapes & Colors
        const newActiveShapes = [];
        const newColors = { ...currentSettings.colors };

        allShapes.forEach(shape => {
            const checkbox = document.getElementById(`check-${shape}`);
            const colorInput = document.getElementById(`color-${shape}`);

            if (checkbox.checked) {
                newActiveShapes.push(shape);
            }
            newColors[shape] = colorInput.value;
        });

        // Validation: Need at least 1 shape
        if (newActiveShapes.length === 0) {
            alert('すくなくとも 1つ は かたち を えらんでください (Please select at least 1 shape)');
            return false;
        }

        currentSettings.activeShapes = newActiveShapes;
        currentSettings.colors = newColors;
        return true;
    }

    // --- Event Listeners for Settings ---

    settingsBtn.addEventListener('click', () => {
        populateSettingsUI();
        settingsModal.classList.remove('hidden');
    });

    cancelSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    saveSettingsBtn.addEventListener('click', () => {
        if (readSettingsFromUI()) {
            saveSettings();
            applySettingsToStyles();
        }
    });

    shapeCountInput.addEventListener('input', (e) => {
        shapeCountVal.textContent = e.target.value;
    });

    // --- Game Logic ---

    function initGame() {
        // Clear board and tray
        board.innerHTML = '';
        tray.innerHTML = '';
        resetBtn.classList.add('hidden');
        winOverlay.classList.add('hidden');
        placedCount = 0;

        // Determine which shapes to use
        // 1. Filter enabled shapes
        if (currentSettings.activeShapes.length === 0) {
            // Fallback
            currentSettings.activeShapes = ['circle', 'triangle', 'square'];
        }

        // 2. Select N shapes from active list (randomly if Count < Active.length)
        let gameShapes = [...currentSettings.activeShapes];

        // Shuffle to pick random subset if count is smaller than available
        gameShapes.sort(() => Math.random() - 0.5);

        // Slice to count
        gameShapes = gameShapes.slice(0, currentSettings.count);

        targetCount = gameShapes.length;

        // Create Board Holes (shuffled positions on the board?)
        // Actually, let's keep holes in a grid. If we have fewer, they just take spots.
        const boardShapes = [...gameShapes].sort(() => Math.random() - 0.5);

        boardShapes.forEach(shape => {
            const hole = document.createElement('div');
            hole.className = 'hole';
            hole.dataset.shape = shape;
            hole.innerHTML = `<svg viewBox="0 0 100 100"><use href="#shape-${shape}"></use></svg>`;

            // Allow Drop
            hole.addEventListener('dragover', handleDragOver);
            hole.addEventListener('drop', handleDrop);

            board.appendChild(hole);
        });

        // Create Tray Pieces (shuffled)
        const trayShapes = [...gameShapes].sort(() => Math.random() - 0.5);

        trayShapes.forEach(shape => {
            const piece = document.createElement('div');
            piece.classList.add('piece');
            piece.setAttribute('draggable', 'true');
            piece.dataset.shape = shape;
            piece.innerHTML = `<svg viewBox="0 0 100 100"><use href="#shape-${shape}"></use></svg>`;

            setupDragEvents(piece);
            tray.appendChild(piece);
        });
    }

    // --- Drag & Drop ---

    function setupDragEvents(piece) {
        piece.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', piece.dataset.shape);
            piece.classList.add('dragging');
        });

        piece.addEventListener('dragend', () => {
            piece.classList.remove('dragging');
        });

        // Touch events
        piece.addEventListener('touchstart', handleTouchStart, { passive: false });
        piece.addEventListener('touchmove', handleTouchMove, { passive: false });
        piece.addEventListener('touchend', handleTouchEnd);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        const shapeType = e.dataTransfer.getData('text/plain');
        const hole = e.currentTarget;

        if (shapeType === hole.dataset.shape) {
            const piece = document.querySelector(`.piece[data-shape="${shapeType}"].dragging`);
            if (piece) {
                handleSuccessDrop(piece, hole);
            }
        }
    }

    // Touch Handling Redux (Simplified from previous version for clarity)
    let activePiece = null;
    let touchOffsets = { x: 0, y: 0 };
    let initialPos = { parent: null, next: null };

    function handleTouchStart(e) {
        if (e.target.closest('.piece.placed')) return;
        e.preventDefault();

        activePiece = e.target.closest('.piece');
        const touch = e.touches[0];
        const rect = activePiece.getBoundingClientRect();

        touchOffsets.x = touch.clientX - rect.left;
        touchOffsets.y = touch.clientY - rect.top;

        initialPos.parent = activePiece.parentNode;
        initialPos.next = activePiece.nextSibling;

        // Switch to fixed positioning for dragging
        activePiece.style.position = 'fixed';
        activePiece.style.zIndex = '1000';
        activePiece.style.width = rect.width + 'px';
        activePiece.style.height = rect.height + 'px'; // Maintain size

        moveTouchPiece(touch.clientX, touch.clientY);
    }

    function handleTouchMove(e) {
        if (!activePiece) return;
        e.preventDefault();
        const touch = e.touches[0];
        moveTouchPiece(touch.clientX, touch.clientY);
    }

    function moveTouchPiece(x, y) {
        activePiece.style.left = (x - touchOffsets.x) + 'px';
        activePiece.style.top = (y - touchOffsets.y) + 'px';
    }

    function handleTouchEnd(e) {
        if (!activePiece) return;

        // Check drop target
        activePiece.style.visibility = 'hidden';
        const touch = e.changedTouches[0];
        const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        activePiece.style.visibility = 'visible';

        const hole = elemBelow ? elemBelow.closest('.hole') : null;

        resetTouchStyles(activePiece);

        if (hole && hole.dataset.shape === activePiece.dataset.shape && !hole.querySelector('.piece')) {
            handleSuccessDrop(activePiece, hole);
        } else {
            // Revert
            if (initialPos.next) {
                initialPos.parent.insertBefore(activePiece, initialPos.next);
            } else {
                initialPos.parent.appendChild(activePiece);
            }
        }
        activePiece = null;
    }

    function resetTouchStyles(piece) {
        piece.style.position = '';
        piece.style.zIndex = '';
        piece.style.left = '';
        piece.style.top = '';
        piece.style.width = '';
        piece.style.height = '';
    }

    function handleSuccessDrop(piece, hole) {
        // Play Sound
        playSnapSound();

        // Move piece to hole (visual snap)
        hole.innerHTML = '';
        piece.classList.add('placed');
        piece.setAttribute('draggable', 'false');

        // Remove touch listeners (clone node is easiest way to strip listeners)
        const newPiece = piece.cloneNode(true);
        hole.appendChild(newPiece);

        // Remove original if valid (for touch logic where we might have moved original)
        if (piece.parentNode !== hole) {
            piece.remove();
        }

        // Animation
        newPiece.classList.add('pop-anim');
        setTimeout(() => newPiece.classList.remove('pop-anim'), 300);

        placedCount++;

        if (placedCount >= targetCount) {
            showWinX();
        }
    }

    function showWinX() {
        playFanfare();
        setTimeout(() => {
            winOverlay.classList.remove('hidden');
        }, 500);
    }

    resetBtn.addEventListener('click', initGame);
    playAgainBtn.addEventListener('click', initGame);

    // Init
    loadSettings();
    initGame();
});
