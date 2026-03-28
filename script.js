// Game State
let currentStep = 0;
let step5TargetIndex = 0;

// クリア状況のデータ管理
let clearData = {
    5: { 1: false, 2: false, 3: false },
    6: { 1: false, 2: false, 3: false },
    7: { 1: false, 2: false, 3: false }
};

function loadClearData() {
    const data = localStorage.getItem('okojo_rail_clear_data');
    if (data) {
        clearData = JSON.parse(data);
    }
}

function saveClearData() {
    localStorage.setItem('okojo_rail_clear_data', JSON.stringify(clearData));
    renderClearBadges();
}

function renderClearBadges() {
    for (let step in clearData) {
        let allClear = true;
        for (let level in clearData[step]) {
            const btn = document.getElementById(`btn-${step}-${level}`);
            if (btn) {
                btn.textContent = `レベル ${level}` + (clearData[step][level] ? " ⭐" : "");
            }
            if (!clearData[step][level]) {
                allClear = false;
            }
        }
        const crown = document.getElementById(`crown-${step}`);
        if (crown) {
            crown.textContent = allClear ? "👑" : "";
        }
    }
}

// 初期ロード
loadClearData();

// Settings State
let currentRailColor = "#81D4FA"; // Default
let currentRotationMode = "tap"; // "tap" or "drag"

// Step 7 State
let step7CurrentLevel = 1;
let step7MaxLevel = 3;
let step7CurrentQuestion = 0;
let step7CurrentType = "";
let step7TargetRot = 0;

// Step 5 Level Data
const STEP5_LEVEL_DATA = {
    1: [ // 導入期：明確に違いがわかる形
        { target: "M 10 50 L 90 50", distractors: ["M 10 50 Q 23.3 20 36.6 50 T 63.3 50 T 90 50", "M 10 50 L 30 20 L 50 80 L 70 20 L 90 50"] }, // 直線 vs 波線/ジグザグ
        { target: "M 50 10 A 40 40 0 1 1 49.9 10", distractors: ["M 20 20 L 20 60 A 30 30 0 0 0 80 60 L 80 20", "M 80 20 A 40 40 0 0 0 80 80"] }, // 丸 vs U字/C字
        { target: "M 50 10 L 50 90 M 10 50 L 90 50", distractors: ["M 10 30 L 90 30 M 10 70 L 90 70", "M 20 20 L 80 80 M 20 80 L 80 20"] }, // 十字 vs 二本線/バツ
        { target: "M 20 20 L 80 20 L 80 80 L 20 80 Z", distractors: ["M 50 10 A 40 40 0 1 1 49.9 10", "M 50 10 L 90 80 L 10 80 Z"] }, // 四角 vs 丸/三角
        { target: "M 50 20 L 80 80 L 20 80 Z", distractors: ["M 10 50 L 90 50", "M 50 10 L 50 90 M 10 50 L 90 50"] } // 三角 vs 直線/十字
    ],
    2: [ // 基礎期：属性を1つだけ変えた形
        { target: "M 30 50 L 70 50", distractors: ["M 10 50 L 90 50", "M 40 50 L 60 50"] }, // 普通の線 vs 長い線/短い線
        { target: "M 50 20 L 50 80", distractors: ["M 20 50 L 80 50", "M 20 80 L 80 20"] }, // 縦線 vs 横線/斜め線
        { target: "M 50 20 L 50 80 M 20 50 L 80 50", distractors: ["M 20 20 L 80 20 M 50 20 L 50 80", "M 30 20 L 30 80 L 80 80"] }, // 十字（真ん中） vs T字/L字
        { target: "M 20 20 L 80 80", distractors: ["M 20 80 L 80 20", "M 50 20 L 50 80"] }, // 右下斜め vs 右上斜め/縦
        { target: "M 20 20 L 80 20 L 80 80 L 20 80 Z", distractors: ["M 20 40 L 80 40 L 80 60 L 20 60 Z", "M 40 20 L 60 20 L 60 80 L 40 80 Z"] } // 正方形 vs 横長長方形/縦長長方形
    ],
    3: [ // 応用期：似て非なる形（引っかけ）
        { target: "M 20 20 L 80 20 L 80 80 L 20 80 Z", distractors: ["M 80 20 L 20 20 L 20 80 L 80 80", "M 20 20 L 80 20 L 80 80 L 20 80"] }, // 四角 vs コの字/逆コの字
        { target: "M 80 20 L 20 20 L 20 80 L 80 80 M 20 50 L 60 50", distractors: ["M 80 20 L 20 20 L 20 80 M 20 50 L 60 50", "M 80 20 L 20 20 L 20 80 L 80 80 M 20 35 L 60 35 M 20 65 L 60 65"] }, // E vs F / 横線多いE
        { target: "M 40 30 L 40 80 L 80 80", distractors: ["M 40 80 L 40 30 L 80 30", "M 80 30 L 80 80 L 40 80"] }, // L字 vs L字の回転 / 逆L字
        { target: "M 50 20 L 80 70 L 20 70 Z", distractors: ["M 50 10 L 70 80 L 30 80 Z", "M 50 40 L 90 60 L 10 60 Z"] }, // 正三角形 vs 尖った三角形 / 平べったい三角形
        { target: "M 20 80 C 20 20, 80 80, 80 20", distractors: ["M 20 20 C 80 20, 20 80, 80 80", "M 20 50 Q 50 10 80 50 Q 50 90 20 50"] } // S字 vs 逆S字 / 丸っこい
    ]
};

let step5CurrentLevel = 1;
let step5CurrentQuestion = 0;
let step5MaxLevel = 3;

function createRailSVG(pathD) {
    return `
        <svg viewBox="-12 -12 124 124" class="rail-shape" width="100%" height="100%">
            <!-- 黒縁で設定色に塗りつぶされた図形 -->
            <path d="${pathD}" stroke="#333" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            <path d="${pathD}" stroke="${currentRailColor}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </svg>
    `;
}

// Settings Logic
function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function updateSettings() {
    const colorOpts = document.getElementsByName('rail-color');
    for (let opt of colorOpts) {
        if (opt.checked) currentRailColor = opt.value;
    }

    const modeOpts = document.getElementsByName('rotation-mode');
    for (let opt of modeOpts) {
        if (opt.checked) currentRotationMode = opt.value;
    }

    // Refresh current screen if needed
    if (currentStep === 5) {
        generateStep5Problem();
    } else if (currentStep === 6) {
        generateStep6Problem();
    } else if (currentStep === 7) {
        generateStep7Problem();
    }
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showTitle() {
    currentStep = 0;
    renderClearBadges(); // クリア状況のバッジを更新
    showScreen('title-screen');
}

function startStep(stepNum, level = 1) {
    currentStep = stepNum;
    if (stepNum === 5) {
        showScreen('step5-screen');
        initStep5(level);
    } else if (stepNum === 6) {
        showScreen('step6-screen');
        initStep6(level);
    } else if (stepNum === 7) {
        showScreen('step7-screen');
        initStep7(level);
    }
}

// Modal Logic
let modalNextAction = null;
function showLevelClearModal(message, isAllClear) {
    // クリア状況を記録
    if (currentStep === 5) {
        clearData[5][step5CurrentLevel] = true;
    } else if (currentStep === 6) {
        clearData[6][step6CurrentLevel] = true;
    } else if (currentStep === 7) {
        clearData[7][step7CurrentLevel] = true;
    }
    saveClearData(); // 保存

    const modal = document.getElementById('clear-modal');
    document.getElementById('modal-message').innerHTML = message;
    const btn = document.getElementById('modal-next-btn');

    if (isAllClear) {
        btn.textContent = "もどる";
        modalNextAction = () => { showTitle(); };
    } else {
        btn.textContent = "つぎへ";
        modalNextAction = () => {
            setTimeout(() => {
                // Logic to advance level or question based on currentStep
                if (currentStep === 5) {
                    step5CurrentLevel++;
                    step5CurrentQuestion = 0;
                    generateStep5Problem();
                } else if (currentStep === 6) {
                    step6CurrentLevel++;
                    step6CurrentQuestion = 0;
                    generateStep6Problem();
                } else if (currentStep === 7) {
                    step7CurrentLevel++;
                    step7CurrentQuestion = 0;
                    generateStep7Problem();
                }
            }, 100);
        };
    }
    modal.classList.remove('hidden');
}

function nextLevelFromModal() {
    document.getElementById('clear-modal').classList.add('hidden');
    if (modalNextAction) modalNextAction();
}

// Step 5 Logic
function initStep5(level = 1) {
    console.log("Initializing Step 5 Level " + level);
    step5CurrentLevel = level;
    step5CurrentQuestion = 0;
    generateStep5Problem();
}

function updateStep5UI() {
    document.getElementById('step5-level-text').textContent = `レベル ${step5CurrentLevel}`;
    const levelData = STEP5_LEVEL_DATA[step5CurrentLevel];
    document.getElementById('step5-progress-text').textContent = `${step5CurrentQuestion + 1} / ${levelData.length}`;

    const advice = document.getElementById('step5-advice');
    if (step5CurrentLevel === 1) {
        advice.textContent = "おなじかたちは どれかな？ ドロップしてみよう！";
    } else if (step5CurrentLevel === 2) {
        advice.textContent = "よくみて！ ながさや むきが ちがうかも？";
    } else {
        advice.textContent = "むずかしいぞ！ ひっかけに きをつけて！";
    }
}

function generateStep5Problem() {
    updateStep5UI();

    const targetContainer = document.getElementById('target-shape-container');
    const choicesContainer = document.getElementById('choices-container');

    const levelData = STEP5_LEVEL_DATA[step5CurrentLevel];
    const problemData = levelData[step5CurrentQuestion];

    // ターゲットを選択
    const targetPath = problemData.target;

    // 正解は選択肢の中で特殊なインデックス（例: "target"という文字列で識別）として扱う
    // あるいは配列を[targetPath, ...problemData.distractors]としてシャッフルし、中身の文字列で判定するほうがい。

    let choices = [
        { isCorrect: true, path: targetPath },
    ];

    problemData.distractors.forEach(d => {
        choices.push({ isCorrect: false, path: d });
    });

    choices.sort(() => Math.random() - 0.5);

    // 描画
    targetContainer.innerHTML = createRailSVG(targetPath);

    choicesContainer.innerHTML = '';
    choices.forEach((choiceObj, index) => {
        const btn = document.createElement('div');
        btn.className = 'choice-btn draggable-btn';
        btn.innerHTML = createRailSVG(choiceObj.path);
        choicesContainer.appendChild(btn);

        setupStep5Draggable(btn, choiceObj.isCorrect);
    });
}

let step5IsDragging = false;
let s5StartX, s5StartY, s5InitialLeft, s5InitialTop;

function setupStep5Draggable(element, isCorrect) {
    element.addEventListener('pointerdown', (e) => {
        if (element.classList.contains('correct')) return;
        step5IsDragging = true;
        s5StartX = e.clientX;
        s5StartY = e.clientY;
        const rect = element.getBoundingClientRect();

        // Convert to absolute/fixed to break out of flexbox
        if (element.style.position !== 'fixed') {
            s5InitialLeft = rect.left;
            s5InitialTop = rect.top;

            const placeholder = document.createElement('div');
            placeholder.className = 'choice-placeholder';
            placeholder.style.width = rect.width + 'px';
            placeholder.style.height = rect.height + 'px';
            element.parentNode.insertBefore(placeholder, element);

            element.style.position = 'fixed';
            element.style.left = s5InitialLeft + 'px';
            element.style.top = s5InitialTop + 'px';
            element.style.margin = '0';
        }

        element.classList.add('dragging');
        element.style.zIndex = 1000;
        element.style.transition = 'none'; // remove transition for smooth drag
        element.setPointerCapture(e.pointerId);
    });

    element.addEventListener('pointermove', (e) => {
        if (!step5IsDragging) return;
        const dx = e.clientX - s5StartX;
        const dy = e.clientY - s5StartY;
        element.style.left = (s5InitialLeft + dx) + 'px';
        element.style.top = (s5InitialTop + dy) + 'px';
    });

    element.addEventListener('pointerup', (e) => {
        if (!step5IsDragging) return;
        step5IsDragging = false;
        element.classList.remove('dragging');
        element.releasePointerCapture(e.pointerId);

        // Check distance to target
        const targetContainer = document.getElementById('target-shape-container');
        
        // Remove transition to get exact layout dimensions without animation smoothing
        const oldTransition = element.style.transition;
        element.style.transition = 'none';
        
        const myRect = element.getBoundingClientRect();
        const targetRect = targetContainer.getBoundingClientRect();

        const myCx = myRect.left + myRect.width / 2;
        const myCy = myRect.top + myRect.height / 2;
        const targetCx = targetRect.left + targetRect.width / 2;
        const targetCy = targetRect.top + targetRect.height / 2;

        const dist = Math.sqrt((myCx - targetCx) ** 2 + (myCy - targetCy) ** 2);

        if (dist < 60) {
            // Check Answer
            if (isCorrect) {
                // Correct
                // Snap exactly to target
                element.style.transition = 'all 0.2s';
                element.style.left = targetRect.left + (targetRect.width - myRect.width) / 2 + 'px';
                element.style.top = targetRect.top + (targetRect.height - myRect.height) / 2 + 'px';

                element.classList.add('correct');

                setTimeout(() => triggerConfetti(), 100);
                setTimeout(() => {
                    // Cleanup placeholders
                    document.querySelectorAll('.choice-placeholder').forEach(el => el.remove());

                    // レベル・問題の進行
                    step5CurrentQuestion++;
                    const levelData = STEP5_LEVEL_DATA[step5CurrentLevel];

                    if (step5CurrentQuestion >= levelData.length) {
                        if (step5CurrentLevel >= step5MaxLevel) {
                            showLevelClearModal("すごい！<br>ぜんぶ クリアしたよ！", true);
                        } else {
                            showLevelClearModal(`レベル ${step5CurrentLevel + 1} にすすむよ！`, false);
                        }
                    } else {
                        generateStep5Problem();
                    }
                }, 2000);
            } else {
                // Wrong type dragged to target
                element.classList.add('wrong');
                element.style.transition = oldTransition || 'all 0.3s';
                snapBackStep5(element);
                setTimeout(() => element.classList.remove('wrong'), 500);
            }
        } else {
            // Dropped outside target
            element.style.transition = oldTransition || 'all 0.3s';
            snapBackStep5(element);
        }
    });
}

function snapBackStep5(element) {
    element.style.transition = 'all 0.3s ease';
    // Assume reverting to relative and finding the placeholder
    element.style.left = '0';
    element.style.top = '0';

    setTimeout(() => {
        element.style.transition = '';
        element.style.position = 'relative';
        element.style.zIndex = '5';

        // Find any active placeholder (since we only drag one at a time)
        const anyPh = document.querySelector('.choice-placeholder');
        if (anyPh) {
            anyPh.parentNode.insertBefore(element, anyPh);
            anyPh.remove();
        }
    }, 300);
}

// Step 6 Logic
const STEP6_LEVEL_DATA = {
    1: [ // 導入期：I字のみ、1回タップ（90度回転）で必ず合うよう初期角度を調整（斜め含む）
        { shapes: ['I'] },
        { shapes: ['I'] },
        { shapes: ['I'] },
        { shapes: ['I'] },
        { shapes: ['I'] }
    ],
    2: [ // 基礎期：非対称な形（L, V, T）、1〜3タップ必要
        { shapes: ['L', 'V', 'T'] },
        { shapes: ['L', 'V', 'T'] },
        { shapes: ['L', 'V', 'T'] },
        { shapes: ['L', 'V', 'T'] },
        { shapes: ['L', 'V', 'T'] }
    ],
    3: [ // 応用期：複雑な形（S, 逆S, E, Fなど）
        { shapes: ['S', 'Z', 'E', 'F'] },
        { shapes: ['S', 'Z', 'E', 'F'] },
        { shapes: ['S', 'Z', 'E', 'F'] },
        { shapes: ['S', 'Z', 'E', 'F'] },
        { shapes: ['S', 'Z', 'E', 'F'] }
    ]
};

let step6CurrentLevel = 1;
let step6CurrentQuestion = 0;
let step6MaxLevel = 3;

let step6CurrentType = '';
let step6TargetRot = 0;
let step6CurrentRot = 0;
let step6BaseOffset = 0; // 斜め出題時は45、通常は0

// Step 7 Level Data (組み合わせ)
const STEP7_LEVEL_DATA = {
    1: [ // 導入期：2択、形の違いが明確
        { target: "I", distractors: ["L"] },
        { target: "L", distractors: ["I"] },
        { target: "I", distractors: ["V"] },
        { target: "V", distractors: ["I"] },
        { target: "I", distractors: ["L"] }
    ],
    2: [ // 基礎期：3択、非対称で少し似ている形
        { target: "L", distractors: ["V", "T"] },
        { target: "V", distractors: ["L", "I"] },
        { target: "T", distractors: ["L", "V"] },
        { target: "L", distractors: ["I", "T"] },
        { target: "V", distractors: ["T", "L"] }
    ],
    3: [ // 応用期：3択、複雑で引っかけやすい形（S/Zは回転で同じ見た目になるため同時出題しない）
        { target: "S", distractors: ["E", "F"] },
        { target: "Z", distractors: ["E", "T"] },
        { target: "E", distractors: ["F", "L"] },
        { target: "F", distractors: ["E", "T"] },
        { target: "S", distractors: ["F", "L"] }
    ]
};

function getTilePath(type) {
    if (type === 'I') return "M 50 20 L 50 80";
    if (type === 'L') return "M 50 20 L 50 80 L 80 80";
    if (type === 'V') return "M 20 20 L 50 80 L 80 20";
    if (type === 'T') return "M 20 20 L 80 20 M 50 20 L 50 80";
    if (type === 'S') return "M 20 80 C 20 20, 80 80, 80 20";
    if (type === 'Z') return "M 20 20 C 80 20, 20 80, 80 80";
    if (type === 'E') return "M 80 20 L 20 20 L 20 80 L 80 80 M 20 50 L 60 50";
    if (type === 'F') return "M 20 80 L 20 20 L 80 20 M 20 50 L 60 50";
    return "";
}

// 視覚的に同一となる形+回転の組み合わせを正規化キーとして返す
// S字とZ字: 90度回転で互換＋180度対称のため、実質2グループのみ
//   グループA: S(0°) = S(180°) = Z(90°) = Z(270°)
//   グループB: S(90°) = S(270°) = Z(0°) = Z(180°)
// I字: 180度回転対称
function getVisualKey(type, rotation) {
    const rot = ((rotation % 360) + 360) % 360;
    // S字とZ字は90度回転で互いに変換され、かつ180度回転対称
    if (type === 'S') {
        if (rot === 0 || rot === 180) return 'curve_A'; // グループA
        if (rot === 90 || rot === 270) return 'curve_B'; // グループB
    }
    if (type === 'Z') {
        if (rot === 90 || rot === 270) return 'curve_A'; // グループA (= S(0°))
        if (rot === 0 || rot === 180) return 'curve_B'; // グループB (= S(90°))
    }
    // I字は180度回転対称
    if (type === 'I') {
        return 'I_' + (rot % 180);
    }
    // その他の形はそのまま
    return type + '_' + rot;
}

function createTileStr(type, rotation) {
    return `<div class="rail-tile" style="transform: rotate(${rotation}deg); width: 100%; height: 100%;">${createRailSVG(getTilePath(type))}</div>`;
}

function initStep6(level = 1) {
    console.log("Initializing Step 6 Level " + level);
    step6CurrentLevel = level;
    step6CurrentQuestion = 0;
    generateStep6Problem();
}

function updateStep6UI() {
    document.getElementById('step6-level-text').textContent = `レベル ${step6CurrentLevel}`;
    const levelData = STEP6_LEVEL_DATA[step6CurrentLevel];
    document.getElementById('step6-progress-text').textContent = `${step6CurrentQuestion + 1} / ${levelData.length}`;

    const advice = document.getElementById('step6-advice');
    if (step6CurrentLevel === 1) {
        advice.textContent = "まわして みほんに かさねよう！";
    } else if (step6CurrentLevel === 2) {
        advice.textContent = "むきに きをつけて！ かさねて みよう！";
    } else {
        advice.textContent = "むずかしい かたちだね！ まわして かさねよう！";
    }
}

// Step 6 ドラッグ移動用の状態
let step6IsDragging = false;
let step6DragStartX = 0, step6DragStartY = 0;
let step6TranslateX = 0, step6TranslateY = 0;
let step6MoveTotalDist = 0;
let step6PointerDownX = 0, step6PointerDownY = 0;

function generateStep6Problem() {
    updateStep6UI();

    const modelContainer = document.getElementById('step6-model');
    const pieceContainer = document.getElementById('step6-interactive-piece');

    pieceContainer.classList.remove('correct');
    pieceContainer.classList.remove('wrong');

    // ドラッグ位置をリセット
    step6TranslateX = 0;
    step6TranslateY = 0;
    pieceContainer.style.transform = '';
    pieceContainer.style.zIndex = '';

    // 操作モードのUI反映
    if (currentRotationMode === 'drag') {
        pieceContainer.setAttribute('data-mode', 'drag');
        // Handle for dragging
        let handle = pieceContainer.querySelector('.rotation-handle');
        if (!handle) {
            handle = document.createElement('div');
            handle.className = 'rotation-handle';
            pieceContainer.appendChild(handle);
            setupStep6Drag(handle, pieceContainer);
        }
    } else {
        pieceContainer.removeAttribute('data-mode');
    }

    const levelData = STEP6_LEVEL_DATA[step6CurrentLevel];
    const problemData = levelData[step6CurrentQuestion];

    // ランダムな図形を選択
    const types = problemData.shapes;
    step6CurrentType = types[Math.floor(Math.random() * types.length)];

    // 正解の角度（目標）をランダムに設定
    let rotStep = 90;
    let baseOffset = 0;
    // I字かつレベル1の場合は、斜め（45度/135度等）も出題してみる
    if (step6CurrentLevel === 1 && Math.random() > 0.5) {
        baseOffset = 45; // 45度ずらした状態で斜めの棒にする
    }
    step6BaseOffset = baseOffset; // ドラッグスナップ用に保存

    step6TargetRot = baseOffset + Math.floor(Math.random() * 4) * rotStep;

    if (step6CurrentLevel === 1) {
        // レベル1：必ず1回タップ（+90度）で正解になるように初期状態をセット（逆算）
        step6CurrentRot = (step6TargetRot - 90 + 360) % 360;
    } else {
        // それ以外：完全ランダム（ただし正解とは異なる状態にする）
        step6CurrentRot = baseOffset + Math.floor(Math.random() * 4) * rotStep;

        // C文字やI文字のような対称性考慮
        let maxAttempts = 10;
        while (isCorrectRotation(step6CurrentType, step6CurrentRot, step6TargetRot) && maxAttempts > 0) {
            step6CurrentRot = (step6CurrentRot + rotStep) % 360;
            maxAttempts--;
        }
    }

    // 見本の描画
    modelContainer.innerHTML = createTileStr(step6CurrentType, step6TargetRot);

    // 操作ピースの描画 (既存のSVGタイルを作るが、中身だけ差し替え)
    let tileInner = pieceContainer.querySelector('.rail-tile');
    if (!tileInner) {
        tileInner = document.createElement('div');
        tileInner.className = 'rail-tile';
        tileInner.style.width = '100%';
        tileInner.style.height = '100%';
        pieceContainer.appendChild(tileInner);
    }

    tileInner.innerHTML = createRailSVG(getTilePath(step6CurrentType));
    // 初期回転とハンドル位置を一括で更新（レンダリング後にも再計算して確実に反映）
    updateStep6RotationDisplay();
    requestAnimationFrame(() => updateStep6RotationDisplay());

    // ドラッグ移動のセットアップ（重複防止のためフラグで管理）
    if (!pieceContainer._step6DragSetup) {
        setupStep6DragMove(pieceContainer);
        pieceContainer._step6DragSetup = true;
    }
}

// 形によって対称性がある場合の判定ヘルパー
function isCorrectRotation(type, current, target) {
    if (type === 'I' || type === 'S' || type === 'Z') {
        // 180度回転対称
        return (Math.abs(current - target) % 180 === 0);
    }
    // 非対称
    return (current % 360) === (target % 360);
}

function rotateStep6Piece() {
    const pieceContainer = document.getElementById('step6-interactive-piece');
    if (pieceContainer.classList.contains('correct')) return; // 正解後は押せない

    // 90度回転
    step6CurrentRot = (step6CurrentRot + 90) % 360;
    updateStep6RotationDisplay();
    // 回転だけでは正解にならない（見本に重ねて判定）
}

function updateStep6RotationDisplay() {
    const pieceContainer = document.getElementById('step6-interactive-piece');
    const tileInner = pieceContainer.querySelector('.rail-tile');
    if (tileInner) {
        tileInner.style.transform = `rotate(${step6CurrentRot}deg)`;
    }
    // ハンドルも回転角度に連動させる（コンテナ中心を軸に回る）
    const handle = pieceContainer.querySelector('.rotation-handle');
    if (handle) {
        const containerRect = pieceContainer.getBoundingClientRect();
        const radius = containerRect.width / 2 + 5; // コンテナの端にハンドルを配置
        handle.style.transform = `rotate(${step6CurrentRot}deg) translateY(-${radius}px)`;
    }
}

function checkStep6AnswerOnDrop() {
    const pieceContainer = document.getElementById('step6-interactive-piece');
    if (pieceContainer.classList.contains('correct')) return;

    // ドロップ位置と見本の距離を計算
    const modelContainer = document.getElementById('step6-model');
    const pieceRect = pieceContainer.getBoundingClientRect();
    const modelRect = modelContainer.getBoundingClientRect();

    const pieceCx = pieceRect.left + pieceRect.width / 2;
    const pieceCy = pieceRect.top + pieceRect.height / 2;
    const modelCx = modelRect.left + modelRect.width / 2;
    const modelCy = modelRect.top + modelRect.height / 2;

    const dist = Math.hypot(pieceCx - modelCx, pieceCy - modelCy);

    if (dist < 60) {
        // 見本の上にドロップされた
        if (isCorrectRotation(step6CurrentType, step6CurrentRot, step6TargetRot)) {
            // 正解！見本にスナップ
            const snapX = step6TranslateX + (modelCx - pieceCx);
            const snapY = step6TranslateY + (modelCy - pieceCy);
            pieceContainer.style.transition = 'transform 0.2s ease';
            pieceContainer.style.transform = `translate(${snapX}px, ${snapY}px)`;
            step6TranslateX = snapX;
            step6TranslateY = snapY;

            pieceContainer.classList.add('correct');
            setTimeout(() => triggerConfetti(), 100);

            setTimeout(() => {
                step6CurrentQuestion++;
                const levelData = STEP6_LEVEL_DATA[step6CurrentLevel];

                if (step6CurrentQuestion >= levelData.length) {
                    if (step6CurrentLevel >= step6MaxLevel) {
                        showLevelClearModal("すごい！<br>ぜんぶ クリアしたよ！", true);
                    } else {
                        showLevelClearModal(`レベル ${step6CurrentLevel} クリア！<br>つぎに すすむよ！`, false);
                    }
                } else {
                    generateStep6Problem();
                }
            }, 1500);
        } else {
            // 回転が合っていない
            pieceContainer.classList.add('wrong');
            snapBackStep6(pieceContainer);
            setTimeout(() => pieceContainer.classList.remove('wrong'), 500);
        }
    } else {
        // 見本の外にドロップ
        snapBackStep6(pieceContainer);
    }
}

function snapBackStep6(element) {
    element.style.transition = 'transform 0.3s ease';
    element.style.transform = 'translate(0px, 0px)';
    step6TranslateX = 0;
    step6TranslateY = 0;
    element.style.zIndex = '';
    setTimeout(() => {
        element.style.transition = '';
    }, 300);
}

// ピース本体のドラッグ移動セットアップ
function setupStep6DragMove(pieceContainer) {
    let isDraggingRotHandle = false;

    pieceContainer.addEventListener('pointerdown', (e) => {
        if (pieceContainer.classList.contains('correct')) return;
        // 回転ハンドルのドラッグ中は移動しない
        if (e.target.closest('.rotation-handle')) return;

        step6IsDragging = true;
        step6MoveTotalDist = 0;
        step6PointerDownX = e.clientX;
        step6PointerDownY = e.clientY;

        step6DragStartX = e.clientX - step6TranslateX;
        step6DragStartY = e.clientY - step6TranslateY;

        pieceContainer.setPointerCapture(e.pointerId);
        pieceContainer.style.zIndex = 1000;
        pieceContainer.style.transition = 'none';
        document.body.style.touchAction = 'none';
    });

    pieceContainer.addEventListener('pointermove', (e) => {
        if (!step6IsDragging) return;
        step6MoveTotalDist = Math.hypot(e.clientX - step6PointerDownX, e.clientY - step6PointerDownY);

        step6TranslateX = e.clientX - step6DragStartX;
        step6TranslateY = e.clientY - step6DragStartY;

        pieceContainer.style.transform = `translate(${step6TranslateX}px, ${step6TranslateY}px)`;
    });

    pieceContainer.addEventListener('pointerup', (e) => {
        if (!step6IsDragging) return;
        step6IsDragging = false;
        pieceContainer.releasePointerCapture(e.pointerId);
        document.body.style.touchAction = '';

        const wasTap = step6MoveTotalDist < 10;

        if (wasTap) {
            // タップ：タップモードなら回転
            if (currentRotationMode === 'tap') {
                rotateStep6Piece();
            }
            // 元の位置に戻す（タップでは移動しない）
            pieceContainer.style.transform = `translate(${step6TranslateX}px, ${step6TranslateY}px)`;
            pieceContainer.style.zIndex = '';
            pieceContainer.style.transition = '';
            return;
        }

        // ドラッグ終了：ドロップ判定
        checkStep6AnswerOnDrop();
    });

    pieceContainer.addEventListener('pointercancel', () => {
        if (step6IsDragging) {
            step6IsDragging = false;
            document.body.style.touchAction = '';
            snapBackStep6(pieceContainer);
        }
    });
}

// Drag Rotation Logic
function setupStep6Drag(handle, container) {
    let isDragging = false;
    let centerX, centerY;
    let startAngle = 0;
    let initialRot = 0;

    handle.addEventListener('pointerdown', (e) => {
        if (container.classList.contains('correct')) return;
        // if (currentRotationMode !== 'drag') return; // pointer-events css or logic usually handles this, but keep it safe.
        // Prevent click events on container while drag starts
        e.stopPropagation();

        isDragging = true;
        handle.setPointerCapture(e.pointerId);

        const rect = container.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;

        startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
        initialRot = step6CurrentRot;

        const tileInner = container.querySelector('.rail-tile');
        if (tileInner) tileInner.style.transition = 'none'; // 滑らかに回すため一旦切る
        handle.style.transition = 'none'; // ハンドルも追従のためtransition無効
    });

    handle.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Prevent default touch actions like scroll during drag

        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
        let deltaAngle = currentAngle - startAngle;

        step6CurrentRot = (initialRot + deltaAngle) % 360;
        if (step6CurrentRot < 0) step6CurrentRot += 360;

        updateStep6RotationDisplay();
    });

    handle.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        handle.releasePointerCapture(e.pointerId);

        // スナップ（baseOffset考慮で90度単位に一番近いものへ）
        let adjusted = step6CurrentRot - step6BaseOffset;
        adjusted = Math.round(adjusted / 90) * 90;
        step6CurrentRot = ((adjusted + step6BaseOffset) % 360 + 360) % 360;

        const tileInner = container.querySelector('.rail-tile');
        if (tileInner) tileInner.style.transition = 'transform 0.1s ease';
        handle.style.transition = 'transform 0.1s ease'; // スナップアニメーション
        updateStep6RotationDisplay();

        // ドラッグ回転モードでは回転だけでは正解にならない（見本に重ねて判定）
    });
}

// Particle Effect for Success
function triggerConfetti() {
    const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d', '#4CAF50', '#03A9F4'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(confetti);

        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// -----------------------------------------------------
// Step 7 Logic: combined find and rotate
// -----------------------------------------------------

function initStep7(level = 1) {
    console.log("Initializing Step 7 Level " + level);
    step7CurrentLevel = level;
    step7CurrentQuestion = 0;
    generateStep7Problem();
}

function updateStep7UI() {
    document.getElementById('step7-level-text').textContent = `レベル ${step7CurrentLevel}`;
    const levelData = STEP7_LEVEL_DATA[step7CurrentLevel];
    document.getElementById('step7-progress-text').textContent = `${step7CurrentQuestion + 1} / ${levelData.length}`;

    const advice = document.getElementById('step7-advice');
    if (step7CurrentLevel === 1) {
        advice.textContent = "くるくるまわして、おなじかたちを ドロップしよう！";
    } else if (step7CurrentLevel === 2) {
        advice.textContent = "むきも ちゃんと あっているか な？";
    } else {
        advice.textContent = "どれが ぴったり あてはまるか な？";
    }
}

function generateStep7Problem() {
    updateStep7UI();

    const targetContainer = document.getElementById('step7-target-container');
    const choicesContainer = document.getElementById('step7-choices-container');

    const levelData = STEP7_LEVEL_DATA[step7CurrentLevel];
    const problemData = levelData[step7CurrentQuestion];

    step7CurrentType = problemData.target;

    // Choose a random target rotation
    step7TargetRot = Math.floor(Math.random() * 4) * 90;

    // Draw the target
    targetContainer.innerHTML = createTileStr(step7CurrentType, step7TargetRot);

    // 視覚的に重複しない初期回転を割り当てる
    let usedVisualKeys = new Set();

    function pickNonDuplicateRot(type) {
        let attempts = 0;
        let rot;
        do {
            rot = Math.floor(Math.random() * 4) * 90;
            attempts++;
        } while (usedVisualKeys.has(getVisualKey(type, rot)) && attempts < 20);
        usedVisualKeys.add(getVisualKey(type, rot));
        return rot;
    }

    const correctRot = pickNonDuplicateRot(step7CurrentType);
    let choices = [
        { type: step7CurrentType, isCorrect: true, initialRot: correctRot }
    ];

    // distractors
    problemData.distractors.forEach(d => {
        const dRot = pickNonDuplicateRot(d);
        choices.push({ type: d, isCorrect: false, initialRot: dRot });
    });

    choices.sort(() => Math.random() - 0.5);

    choicesContainer.innerHTML = '';

    choices.forEach((choiceObj, index) => {
        // Build choice structure similar to step 5 but with rotation handle and inner rail wrapper
        const btnWrapper = document.createElement('div');
        btnWrapper.className = 'choice-btn draggable-btn-step7';
        if (currentRotationMode === 'drag') {
            btnWrapper.setAttribute('data-mode', 'drag');
        }

        // Inner element for rotation
        const innerTile = document.createElement('div');
        innerTile.className = 'rail-tile-inner';
        innerTile.style.width = '100%';
        innerTile.style.height = '100%';
        innerTile.style.transform = `rotate(${choiceObj.initialRot}deg)`;
        innerTile.innerHTML = createRailSVG(getTilePath(choiceObj.type));

        btnWrapper.appendChild(innerTile);

        // Add data attributes
        btnWrapper.dataset.type = choiceObj.type;
        btnWrapper.dataset.rot = choiceObj.initialRot;
        btnWrapper.dataset.isCorrect = choiceObj.isCorrect;

        choicesContainer.appendChild(btnWrapper);

        // Setup Drag & Drop + Rotation
        setupStep7Draggable(btnWrapper, innerTile);
    });
}

function checkStep7AnswerLogic(element) {
    const isCorrectType = element.dataset.isCorrect === 'true';
    const type = element.dataset.type;
    const currentRot = parseInt(element.dataset.rot, 10);

    return isCorrectType && isCorrectRotation(type, currentRot, step7TargetRot);
}

function snapBackStep7(element) {
    element.style.transform = `scale(1) translate(0px, 0px)`;
    element.classList.remove('dragging');
    element.dataset.x = 0;
    element.dataset.y = 0;
}

function setupStep7Draggable(element, innerTile) {
    let isDraggingPos = false;
    let isDraggingRot = false;
    let startX = 0, startY = 0;
    let x = 0, y = 0;

    // Setup rotation logic
    if (currentRotationMode === 'drag') {
        const handle = document.createElement('div');
        handle.className = 'rotation-handle';
        element.appendChild(handle);

        const updateHandlePos = (rot) => {
            const rect = element.getBoundingClientRect();
            const radius = rect.width / 2 + 5;
            handle.style.transform = `rotate(${rot}deg) translateY(-${radius}px)`;
        };
        requestAnimationFrame(() => updateHandlePos(parseInt(element.dataset.rot, 10)));

        let rotCenterX, rotCenterY, startAngle, initialRotVal;

        handle.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            isDraggingRot = true;
            handle.setPointerCapture(e.pointerId);

            const rect = element.getBoundingClientRect();
            rotCenterX = rect.left + rect.width / 2;
            rotCenterY = rect.top + rect.height / 2;
            startAngle = Math.atan2(e.clientY - rotCenterY, e.clientX - rotCenterX) * 180 / Math.PI;
            initialRotVal = parseInt(element.dataset.rot, 10);
            innerTile.style.transition = 'none';
            handle.style.transition = 'none';
        });

        handle.addEventListener('pointermove', (e) => {
            if (!isDraggingRot) return;
            e.preventDefault();
            const currentAngle = Math.atan2(e.clientY - rotCenterY, e.clientX - rotCenterX) * 180 / Math.PI;
            let delta = currentAngle - startAngle;
            let newRot = (initialRotVal + delta) % 360;
            if (newRot < 0) newRot += 360;
            innerTile.style.transform = `rotate(${newRot}deg)`;
            updateHandlePos(newRot);
            element.dataset.rot = newRot; // temp store
        });

        handle.addEventListener('pointerup', (e) => {
            if (!isDraggingRot) return;
            isDraggingRot = false;
            handle.releasePointerCapture(e.pointerId);

            // Snap
            let currentTempRot = parseInt(element.dataset.rot, 10) || parseFloat(element.dataset.rot);
            let snappedRot = Math.round(currentTempRot / 90) * 90 % 360;
            if (snappedRot < 0) snappedRot += 360;

            element.dataset.rot = snappedRot;
            innerTile.style.transition = 'transform 0.1s ease';
            innerTile.style.transform = `rotate(${snappedRot}deg)`;
            handle.style.transition = 'transform 0.1s ease';
            updateHandlePos(snappedRot);
        });
    }

    // Main Drag&Drop or Tap logic
    let moveTotalDist = 0;
    let pointerDownX = 0, pointerDownY = 0;

    element.addEventListener('pointerdown', (e) => {
        if (isDraggingRot) return;
        isDraggingPos = true;
        moveTotalDist = 0;
        pointerDownX = e.clientX;
        pointerDownY = e.clientY;

        // Disable scroll gesture behavior temporarily
        document.body.style.touchAction = 'none';

        // Reset scale and preserve transform structure
        x = parseFloat(element.dataset.x) || 0;
        y = parseFloat(element.dataset.y) || 0;

        element.dataset.startX = e.clientX - x;
        element.dataset.startY = e.clientY - y;

        element.setPointerCapture(e.pointerId);
        element.style.zIndex = 1000;
        element.classList.add('dragging');
    });

    element.addEventListener('pointermove', (e) => {
        if (!isDraggingPos) return;
        // 移動距離を累積
        moveTotalDist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);

        x = e.clientX - element.dataset.startX;
        y = e.clientY - element.dataset.startY;

        element.style.transform = `scale(1.05) translate(${x}px, ${y}px)`;
        element.dataset.x = x;
        element.dataset.y = y;
    });

    element.addEventListener('pointerup', (e) => {
        if (!isDraggingPos) return;
        isDraggingPos = false;
        element.releasePointerCapture(e.pointerId);

        document.body.style.touchAction = ''; // restore

        // 移動距離が10px未満ならタップとみなす（スマホの微小な指のブレを許容）
        const wasTap = moveTotalDist < 10;

        // Tap rotation handling logic
        if (wasTap) {
            // It was a tap, rotate by 90 if mode is tap
            if (currentRotationMode === 'tap') {
                let currentRot = parseInt(element.dataset.rot, 10);
                currentRot = (currentRot + 90) % 360;
                element.dataset.rot = currentRot;
                innerTile.style.transition = 'transform 1.2s ease'; // タップ時の回転をさらに遅く（1.2s）
                innerTile.style.transform = `rotate(${currentRot}deg)`;
            }
            snapBackStep7(element);
            element.style.zIndex = 1;
            return; // don't evaluate drop
        }

        // Evaluate drop position
        const targetElement = document.getElementById('step7-target-container');
        const targetRect = targetElement.getBoundingClientRect();
        const dropRect = element.getBoundingClientRect();

        const dropCenterX = dropRect.left + dropRect.width / 2;
        const dropCenterY = dropRect.top + dropRect.height / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        const dist = Math.hypot(dropCenterX - targetCenterX, dropCenterY - targetCenterY);

        if (dist < 60) {
            // Dropped correctly inside area, now evaluate correctness
            if (checkStep7AnswerLogic(element)) {
                // 完全一致！
                
                // 一旦アニメーションを無効化し、scale(1)での正確なBoundingRectを取得する
                const oldTransition7 = element.style.transition;
                element.style.transition = 'none';
                element.style.transform = `scale(1) translate(${x}px, ${y}px)`;
                
                const exactRect = element.getBoundingClientRect();
                const exactDropCenterX = exactRect.left + exactRect.width / 2;
                const exactDropCenterY = exactRect.top + exactRect.height / 2;
                
                element.style.transition = oldTransition7 || 'all 0.3s ease';
                // 正確な中心座標とターゲット中心座標の差分をx,yに足し込む
                element.style.transform = `scale(1) translate(${targetCenterX - exactDropCenterX + x}px, ${targetCenterY - exactDropCenterY + y}px)`;
                element.classList.remove('dragging');

                setTimeout(() => triggerConfetti(), 300);

                setTimeout(() => {
                    document.querySelectorAll('.draggable-btn-step7').forEach(el => el.remove());

                    step7CurrentQuestion++;
                    const levelData = STEP7_LEVEL_DATA[step7CurrentLevel];

                    if (step7CurrentQuestion >= levelData.length) {
                        step7CurrentLevel++;
                        step7CurrentQuestion = 0;

                        if (step7CurrentLevel > step7MaxLevel) {
                            showLevelClearModal("すごい！<br>ぜんぶ クリアしたよ！", true);
                        } else {
                            showLevelClearModal(`レベル ${step7CurrentLevel} クリア！<br>つぎに すすむよ！`, false);
                        }
                    } else {
                        generateStep7Problem();
                    }
                }, 1500);
            } else {
                // Dropped right place, wrong shape or wrong orientation
                element.classList.add('wrong');
                snapBackStep7(element);
                element.style.zIndex = 1;
                setTimeout(() => element.classList.remove('wrong'), 500);
            }
        } else {
            // Dropped outside
            snapBackStep7(element);
            element.style.zIndex = 1;
        }
    });

    // Reset fallback handling
    element.addEventListener('pointercancel', () => {
        if (isDraggingPos) {
            isDraggingPos = false;
            document.body.style.touchAction = '';
            snapBackStep7(element);
            element.style.zIndex = 1;
        }
    });
}
