/* ========================================================================
   DUEL ZONE — Lobby & UI Controller
   Handles all pre-game and post-game UI logic, socket events, and
   mobile controls. Loaded AFTER game.js so window.startGame is available.
   ======================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------
    // Setup Socket
    // ----------------------------------------------------------------
    window.socket = io();

    // ----------------------------------------------------------------
    // Detect mobile device vs Desktop PC
    // ----------------------------------------------------------------
    function checkIsMobile() {
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth <= 900 || window.innerHeight <= 900;
        const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        // True for mobile devices, phones, tablets, or small touch viewports
        return isMobileUA || (hasTouch && (isSmallScreen || isCoarse));
    }
    let isMobile = checkIsMobile();

    // Dynamically auto-enable touch controls if user touches screen
    window.addEventListener('touchstart', function onFirstTouch() {
        if (!isMobile) {
            isMobile = true;
            updateMobileControlsVisibility();
            checkOrientation();
        }
    }, { passive: true, once: true });

    // ----------------------------------------------------------------
    // Mobile input state (shared with game.js via window)
    // ----------------------------------------------------------------
    window.mobileInput = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        shoot: false,
        super: false,
        analogX: 0,
        analogY: 0
    };

    // ----------------------------------------------------------------
    // Cache DOM Elements
    // ----------------------------------------------------------------
    const lobby = document.getElementById('lobby');
    const menuScreen = document.getElementById('menu-screen');
    const waitingScreen = document.getElementById('waiting-screen');
    const gameContainer = document.getElementById('game-container');
    const resultOverlay = document.getElementById('result-overlay');
    const mobileControls = document.getElementById('mobile-controls');
    const rotateOverlay = document.getElementById('rotate-device-overlay');
    const btnRotatePlay = document.getElementById('btn-rotate-play');
    const inGameFullscreenBtn = document.getElementById('in-game-fullscreen-btn');

    const createBtn = document.getElementById('create-btn');
    const joinBtn = document.getElementById('join-btn');
    const joinInputContainer = document.getElementById('join-input-container');
    const roomCodeInput = document.getElementById('room-code-input');
    const joinSubmitBtn = document.getElementById('join-submit-btn');
    const joinCancelBtn = document.getElementById('join-cancel-btn');
    const errorMessage = document.getElementById('error-message');

    const roomCodeDisplay = document.getElementById('room-code-display');
    const cancelWaitBtn = document.getElementById('cancel-wait-btn');

    const resultTitle = document.getElementById('result-title');
    const resultDetail = document.getElementById('result-detail');
    const rematchBtn = document.getElementById('rematch-btn');
    const menuBtn = document.getElementById('menu-btn');
    const rematchStatus = document.getElementById('rematch-status');

    // ----------------------------------------------------------------
    // State & Win Streaks (Persisted in sessionStorage)
    // ----------------------------------------------------------------
    let gameStarted = false;
    let errorTimeout = null;

    try {
        const savedStreaks = sessionStorage.getItem('duel_zone_win_streaks');
        window.winStreaks = savedStreaks ? JSON.parse(savedStreaks) : { p1: 0, p2: 0 };
    } catch(e) {
        window.winStreaks = { p1: 0, p2: 0 };
    }

    // ----------------------------------------------------------------
    // Screen Management
    // ----------------------------------------------------------------
    function showScreen(screenId) {
        // Hide everything by default
        menuScreen.style.display = 'none';
        waitingScreen.style.display = 'none';
        resultOverlay.style.display = 'none';

        const inGameHud = document.getElementById('in-game-hud');
        const pauseModal = document.getElementById('pause-modal');
        const coffeeModalEl = document.getElementById('coffee-modal');
        if (inGameHud) inGameHud.style.display = screenId === 'game' ? 'flex' : 'none';
        if (pauseModal) pauseModal.style.display = 'none';
        if (coffeeModalEl && screenId === 'game') coffeeModalEl.style.display = 'none';

        switch (screenId) {
            case 'menu':
                lobby.style.display = 'flex';
                menuScreen.style.display = 'flex';
                gameContainer.style.display = 'none';
                mobileControls.style.display = 'none';
                window.dispatchEvent(new Event('gameEnded'));
                // Reset join input
                joinInputContainer.style.display = 'none';
                roomCodeInput.value = '';
                hideError();
                break;

            case 'waiting':
                lobby.style.display = 'flex';
                waitingScreen.style.display = 'flex';
                gameContainer.style.display = 'none';
                mobileControls.style.display = 'none';
                window.dispatchEvent(new Event('gameEnded'));
                break;

            case 'game':
                lobby.style.display = 'none';
                gameContainer.style.display = 'flex';
                window.dispatchEvent(new Event('gameStarted'));
                updateMobileControlsVisibility();
                break;

            case 'result':
                // Don't hide game-container — the game stays visible behind the overlay
                resultOverlay.style.display = 'flex';
                break;

            default:
                break;
        }
    }

    // ----------------------------------------------------------------
    // Error Helpers
    // ----------------------------------------------------------------
    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
        // Clear any existing timeout
        if (errorTimeout) clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => {
            hideError();
        }, 3000);
    }

    function hideError() {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
        if (errorTimeout) {
            clearTimeout(errorTimeout);
            errorTimeout = null;
        }
    }

    // ----------------------------------------------------------------
    // Button Event Listeners
    // ----------------------------------------------------------------

    const charBtn = document.getElementById('char-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const charModal = document.getElementById('char-modal');
    const closeCharBtn = document.getElementById('close-char-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    window.soundEnabled = true;

    // Character preview renderer on HTML5 2D Canvas
    function renderCharPreview(canvasId, mainColor, darkColor) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(1.4, 1.4);
        ctx.translate(2, 2);

        // Head
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(20, 12, 9, 0, Math.PI * 2);
        ctx.fill();

        // Visor
        ctx.fillStyle = '#aaddff';
        ctx.fillRect(23, 9, 7, 4);

        // Torso
        ctx.fillStyle = mainColor;
        ctx.fillRect(12, 20, 16, 20);

        // Torso center
        ctx.fillStyle = darkColor;
        ctx.fillRect(18, 20, 4, 20);

        // Belt
        ctx.fillStyle = '#333333';
        ctx.fillRect(12, 37, 16, 3);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(18, 37, 4, 3);

        // Legs
        ctx.fillStyle = darkColor;
        ctx.fillRect(12, 40, 7, 12);
        ctx.fillRect(21, 40, 7, 12);

        // Boots
        ctx.fillStyle = '#111111';
        ctx.fillRect(11, 49, 8, 7);
        ctx.fillRect(21, 49, 8, 7);

        // Arm & Gun
        ctx.fillStyle = mainColor;
        ctx.fillRect(28, 24, 6, 5);
        ctx.fillStyle = '#555555';
        ctx.fillRect(32, 22, 8, 6);
        ctx.fillStyle = '#222222';
        ctx.fillRect(38, 23, 4, 4);
        ctx.fillStyle = '#444444';
        ctx.fillRect(33, 28, 3, 4);

        ctx.restore();
    }

    if (charBtn && charModal) {
        charBtn.addEventListener('click', () => {
            const botDiffBar = document.getElementById('bot-difficulty-bar');
            if (botDiffBar) botDiffBar.style.display = window.chosenGameMode === 'bot' ? 'flex' : 'none';
            charModal.style.display = 'flex';
        });
        closeCharBtn.addEventListener('click', () => {
            charModal.style.display = 'none';
        });

        // 3-Character Roster Management
        window.selectedP1Char = 'dip';
        window.selectedP2Char = 'sanket';
        window.chosenGameMode = 'local'; // 'local' or 'bot'
        window.selectedMap = 'brawl'; // 'brawl' (Daytime Brawl Stars style) or 'cyber' (Night City)
        window.botDifficulty = 'normal'; // 'easy', 'normal', 'hard', 'supreme'

        const botDiffBar = document.getElementById('bot-difficulty-bar');
        const diffBtns = document.querySelectorAll('.diff-btn');

        function updateDiffButtons() {
            diffBtns.forEach(b => {
                if (b.getAttribute('data-diff') === window.botDifficulty) {
                    b.classList.add('active-diff');
                } else {
                    b.classList.remove('active-diff');
                }
            });
        }

        diffBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const d = btn.getAttribute('data-diff');
                if (d) {
                    window.botDifficulty = d;
                    updateDiffButtons();
                }
            });
        });
        updateDiffButtons();

        const mapBtnBrawl = document.getElementById('map-btn-brawl');
        const mapBtnCyber = document.getElementById('map-btn-cyber');

        function updateMapButtons() {
            if (!mapBtnBrawl || !mapBtnCyber) return;
            if (window.selectedMap === 'brawl') {
                mapBtnBrawl.classList.add('active-map');
                mapBtnCyber.classList.remove('active-map');
            } else {
                mapBtnCyber.classList.add('active-map');
                mapBtnBrawl.classList.remove('active-map');
            }
        }

        if (mapBtnBrawl) {
            mapBtnBrawl.addEventListener('click', (e) => {
                e.stopPropagation();
                window.selectedMap = 'brawl';
                updateMapButtons();
            });
        }

        if (mapBtnCyber) {
            mapBtnCyber.addEventListener('click', (e) => {
                e.stopPropagation();
                window.selectedMap = 'cyber';
                updateMapButtons();
            });
        }
        updateMapButtons();

        const previewP1Name = document.getElementById('preview-p1-name');
        const previewP2Name = document.getElementById('preview-p2-name');
        const previewP1Img  = document.getElementById('preview-p1-img');
        const previewP2Img  = document.getElementById('preview-p2-img');
        const rosterModalTitle = document.getElementById('roster-modal-title');
        const startBattleBtn = document.getElementById('start-battle-btn');

        const charNames = { dip: 'DIP', sanket: 'SANKET', sushruto: 'SUSHRUTO', ahil: 'AHIL', keshav: 'KESHAV' };
        const charAvatars = {
            dip: '/assets/player_face.jpg',
            sanket: '/assets/sanket_face.jpg',
            sushruto: '/assets/sushruto_face.png',
            ahil: '/assets/ahil_face.jpg',
            keshav: '/assets/keshav_face.jpg'
        };

        function updateRosterBadges() {
            const charKeys = ['dip', 'sanket', 'sushruto', 'ahil', 'keshav'];
            charKeys.forEach(key => {
                const card = document.getElementById(`card-${key}`);
                const badge = document.getElementById(`badge-${key}`);
                if (!card || !badge) return;

                card.classList.remove('active-blue', 'active-red', 'active-green', 'active-purple', 'active-orange');
                badge.classList.remove('blue-badge', 'red-badge', 'green-badge', 'purple-badge', 'orange-badge', 'gray-badge');

                const isP1 = window.selectedP1Char === key;
                const isP2 = window.selectedP2Char === key;

                if (isP1 && isP2) {
                    card.classList.add('active-blue');
                    badge.classList.add('blue-badge');
                    badge.textContent = 'P1 & P2 / BOT';
                } else if (isP1) {
                    card.classList.add('active-blue');
                    badge.classList.add('blue-badge');
                    badge.textContent = 'PLAYER 1';
                } else if (isP2) {
                    card.classList.add('active-red');
                    badge.classList.add('red-badge');
                    badge.textContent = 'PLAYER 2 / BOT';
                } else {
                    badge.classList.add('gray-badge');
                    badge.textContent = 'AVAILABLE';
                }
            });

            // Update button active states
            document.querySelectorAll('.btn-pick-p1').forEach(btn => {
                const char = btn.getAttribute('data-char');
                if (char === window.selectedP1Char) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            document.querySelectorAll('.btn-pick-p2').forEach(btn => {
                const char = btn.getAttribute('data-char');
                if (char === window.selectedP2Char) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            const p1 = window.selectedP1Char || 'dip';
            const p2 = window.selectedP2Char || 'sanket';

            const p1Streak = (window.winStreaks && window.winStreaks.p1) || 0;
            const p2Streak = (window.winStreaks && window.winStreaks.p2) || 0;

            if (previewP1Name) {
                previewP1Name.textContent = p1Streak >= 3 ? `👑 ${charNames[p1]} (${p1Streak}W)` : charNames[p1];
            }
            if (previewP2Name) {
                previewP2Name.textContent = p2Streak >= 3 ? `👑 ${charNames[p2]} (${p2Streak}W)` : charNames[p2];
            }
            if (previewP1Img)  previewP1Img.src  = charAvatars[p1];
            if (previewP2Img)  previewP2Img.src  = charAvatars[p2];
        }

        document.querySelectorAll('.btn-pick-p1').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const picked = btn.getAttribute('data-char');
                window.selectedP1Char = picked;
                // If P2 was the same character, switch P2 to another fighter automatically
                if (window.selectedP2Char === picked) {
                    const others = ['dip', 'sanket', 'sushruto', 'ahil', 'keshav'].filter(c => c !== picked);
                    window.selectedP2Char = others[0];
                }
                updateRosterBadges();
            });
        });

        document.querySelectorAll('.btn-pick-p2').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const picked = btn.getAttribute('data-char');
                window.selectedP2Char = picked;
                // If P1 was the same character, switch P1 to another fighter automatically
                if (window.selectedP1Char === picked) {
                    const others = ['dip', 'sanket', 'sushruto', 'ahil', 'keshav'].filter(c => c !== picked);
                    window.selectedP1Char = others[0];
                }
                updateRosterBadges();
            });
        });

        if (startBattleBtn) {
            startBattleBtn.addEventListener('click', () => {
                charModal.style.display = 'none';
                if (window.chosenGameMode === 'bot') {
                    window.isBotMatch = true;
                    window.isLocal2P = false;
                    window.playerNumber = 1;
                    window.roomCode = 'VS-BOT';
                } else {
                    window.isLocal2P = true;
                    window.isBotMatch = false;
                    window.playerNumber = 1;
                    window.roomCode = 'LOCAL-2P';
                }
                showScreen('game');
                if (typeof window.startGame === 'function') {
                    gameStarted = true;
                    window.startGame();
                }
            });
        }

        updateRosterBadges();
    }

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'flex';
        });
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
        soundToggleBtn.addEventListener('click', () => {
            window.soundEnabled = !window.soundEnabled;
            soundToggleBtn.textContent = window.soundEnabled ? 'SFX: ON' : 'SFX: OFF';
            soundToggleBtn.style.color = window.soundEnabled ? '#00e5ff' : '#ff1744';
        });
        fullscreenBtn.addEventListener('click', () => {
            toggleFullscreen();
        });
    }

    // ----------------------------------------------------------------
    // Buy Me A Coffee / Support Developer DIP DAS Modal Handlers
    // ----------------------------------------------------------------
    const coffeeBtn = document.getElementById('coffee-btn');
    const resultCoffeeBtn = document.getElementById('result-coffee-btn');
    const pauseCoffeeBtn = document.getElementById('pause-coffee-btn');
    const coffeeModal = document.getElementById('coffee-modal');
    const closeCoffeeBtn = document.getElementById('close-coffee-btn');
    const copyUpiBtn = document.getElementById('copy-upi-btn');
    const copyUpiLbl = document.getElementById('copy-upi-lbl');
    const copyUpiIcon = document.getElementById('copy-upi-icon');
    const amountPills = document.querySelectorAll('.amount-pill');
    const directUpiLink = document.getElementById('direct-upi-link');

    function openCoffeeModal() {
        if (coffeeModal) coffeeModal.style.display = 'flex';
    }

    function closeCoffeeModal() {
        if (coffeeModal) coffeeModal.style.display = 'none';
    }

    if (coffeeBtn) coffeeBtn.addEventListener('click', openCoffeeModal);
    if (resultCoffeeBtn) resultCoffeeBtn.addEventListener('click', openCoffeeModal);
    if (pauseCoffeeBtn) pauseCoffeeBtn.addEventListener('click', openCoffeeModal);
    if (closeCoffeeBtn) closeCoffeeBtn.addEventListener('click', closeCoffeeModal);
    if (coffeeModal) {
        coffeeModal.addEventListener('click', (e) => {
            if (e.target === coffeeModal) closeCoffeeModal();
        });
    }

    // 1-Click UPI ID Copy
    if (copyUpiBtn) {
        copyUpiBtn.addEventListener('click', async () => {
            const upiId = 'dip7048@okaxis';
            let copied = false;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(upiId);
                    copied = true;
                } catch (e) {}
            }
            if (!copied) {
                const tempInput = document.createElement('input');
                tempInput.value = upiId;
                document.body.appendChild(tempInput);
                tempInput.select();
                try {
                    document.execCommand('copy');
                    copied = true;
                } catch (e) {}
                document.body.removeChild(tempInput);
            }
            if (copied) {
                if (copyUpiLbl) copyUpiLbl.textContent = 'COPIED!';
                if (copyUpiIcon) copyUpiIcon.textContent = '✅';
                copyUpiBtn.style.background = '#10b981';
                setTimeout(() => {
                    if (copyUpiLbl) copyUpiLbl.textContent = 'Copy';
                    if (copyUpiIcon) copyUpiIcon.textContent = '📋';
                    copyUpiBtn.style.background = '';
                }, 2500);
            }
        });
    }

    // Preset Amount Pills: Update direct UPI link with amount
    if (amountPills && directUpiLink) {
        amountPills.forEach(pill => {
            pill.addEventListener('click', () => {
                amountPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const amt = pill.getAttribute('data-amount') || '20';
                directUpiLink.href = `upi://pay?pa=dip7048@okaxis&pn=DIP%20DAS&am=${amt}&cu=INR&tn=Duel%20Zone%20Coffee%20Support`;
            });
        });
    }

    // LOCAL 2-PLAYERS (SAME PC / KEYBOARD) — Opens Fighter Selection first!
    const local2pBtn = document.getElementById('local2p-btn');
    if (local2pBtn) {
        local2pBtn.addEventListener('click', () => {
            window.chosenGameMode = 'local';
            const titleEl = document.getElementById('roster-modal-title');
            if (titleEl) titleEl.textContent = 'LOCAL 2-PLAYER: SELECT FIGHTERS';
            const botDiffBar = document.getElementById('bot-difficulty-bar');
            if (botDiffBar) botDiffBar.style.display = 'none';
            if (charModal) charModal.style.display = 'flex';
        });
    }

    // BOT MATCH (SINGLE PLAYER) — Opens Fighter Selection first!
    const botBtn = document.getElementById('bot-btn');
    if (botBtn) {
        botBtn.addEventListener('click', () => {
            window.chosenGameMode = 'bot';
            const titleEl = document.getElementById('roster-modal-title');
            if (titleEl) titleEl.textContent = 'VS BOT: SELECT YOUR FIGHTER & BOT';
            const botDiffBar = document.getElementById('bot-difficulty-bar');
            if (botDiffBar) botDiffBar.style.display = 'flex';
            if (charModal) charModal.style.display = 'flex';
        });
    }

    // CREATE ROOM
    createBtn.addEventListener('click', () => {
        window.isLocal2P = false;
        window.isBotMatch = false;
        createBtn.disabled = true;
        window.socket.emit('createRoom');
        // Re-enable after a short delay to prevent rapid clicks
        setTimeout(() => { createBtn.disabled = false; }, 1000);
    });

    // JOIN ROOM — show input
    joinBtn.addEventListener('click', () => {
        joinInputContainer.style.display = 'flex';
        roomCodeInput.value = '';
        roomCodeInput.focus();
    });

    // JOIN CANCEL
    joinCancelBtn.addEventListener('click', () => {
        joinInputContainer.style.display = 'none';
        roomCodeInput.value = '';
        hideError();
    });

    // JOIN SUBMIT
    joinSubmitBtn.addEventListener('click', () => {
        window.isLocal2P = false;
        window.isBotMatch = false;
        const code = roomCodeInput.value.trim().toUpperCase();
        if (code.length !== 6) {
            showError('Room code must be 6 characters');
            return;
        }
        joinSubmitBtn.disabled = true;
        window.socket.emit('joinRoom', { code });
        setTimeout(() => { joinSubmitBtn.disabled = false; }, 1000);
    });

    // ROOM CODE INPUT — Enter key & auto-uppercase
    roomCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            joinSubmitBtn.click();
        }
    });

    roomCodeInput.addEventListener('input', () => {
        roomCodeInput.value = roomCodeInput.value.toUpperCase();
    });

    // ROOM CODE DISPLAY — Click to copy
    roomCodeDisplay.addEventListener('click', () => {
        const code = roomCodeDisplay.textContent;
        if (!code || code === 'COPIED!') return;

        navigator.clipboard.writeText(code).then(() => {
            const original = code;
            roomCodeDisplay.textContent = 'COPIED!';
            roomCodeDisplay.style.color = '#00e676';
            setTimeout(() => {
                roomCodeDisplay.textContent = original;
                roomCodeDisplay.style.color = '';
            }, 1200);
        }).catch(() => {
            // Fallback: select text for manual copy
            const range = document.createRange();
            range.selectNodeContents(roomCodeDisplay);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });
    });

    // CANCEL WAIT
    cancelWaitBtn.addEventListener('click', () => {
        window.socket.emit('leaveRoom');
        window.roomCode = null;
        showScreen('menu');
    });

    // REMATCH
    rematchBtn.addEventListener('click', () => {
        rematchStatus.style.display = 'none';
        rematchStatus.textContent = '';

        if (window.isLocal2P || window.isBotMatch) {
            resultOverlay.style.display = 'none';
            if (typeof window.destroyGame === 'function') {
                window.destroyGame();
            }
            showScreen('game');
            if (typeof window.startGame === 'function') {
                gameStarted = true;
                window.startGame();
            }
            return;
        }

        rematchBtn.disabled = true;
        rematchStatus.textContent = 'Waiting for opponent...';
        rematchStatus.style.display = 'block';
        window.socket.emit('requestRematch');
    });

    // MAIN MENU
    menuBtn.addEventListener('click', () => {
        window.isBotMatch = false;
        window.isLocal2P = false;
        // Destroy game instance if it exists
        if (typeof window.destroyGame === 'function') {
            window.destroyGame();
        }
        gameStarted = false;

        // Disconnect and reconnect socket for a clean slate
        window.socket.disconnect();
        window.socket.connect();

        // Reset state
        window.roomCode = null;
        window.playerNumber = null;

        showScreen('menu');
    });

    // ----------------------------------------------------------------
    // IN-GAME PAUSE, RESUME, RESTART & EXIT
    // ----------------------------------------------------------------
    const inGamePauseBtn = document.getElementById('in-game-pause-btn');
    const pauseResumeBtn = document.getElementById('pause-resume-btn');
    const pauseRestartBtn = document.getElementById('pause-restart-btn');
    const pauseExitBtn = document.getElementById('pause-exit-btn');
    const pauseModal = document.getElementById('pause-modal');

    if (inGamePauseBtn) {
        inGamePauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof window.togglePauseGame === 'function') {
                window.togglePauseGame();
            }
        });
    }

    if (pauseResumeBtn) {
        pauseResumeBtn.addEventListener('click', () => {
            if (typeof window.resumeGame === 'function') {
                window.resumeGame();
            }
        });
    }

    if (pauseRestartBtn) {
        pauseRestartBtn.addEventListener('click', () => {
            if (pauseModal) pauseModal.style.display = 'none';
            if (typeof window.destroyGame === 'function') {
                window.destroyGame();
            }
            showScreen('game');
            if (typeof window.startGame === 'function') {
                gameStarted = true;
                window.startGame();
            }
        });
    }

    if (pauseExitBtn) {
        pauseExitBtn.addEventListener('click', () => {
            if (pauseModal) pauseModal.style.display = 'none';
            menuBtn.click();
        });
    }

    // ----------------------------------------------------------------
    // Socket Event Handlers
    // ----------------------------------------------------------------

    // Room created — show waiting screen with room code
    window.socket.on('roomCreated', (data) => {
        window.roomCode = data.code;
        roomCodeDisplay.textContent = data.code;
        showScreen('waiting');
    });

    // Join error — display error message
    window.socket.on('joinError', (data) => {
        showError(data.message || 'Failed to join room');
    });

    // Player number assigned
    window.socket.on('playerJoined', (data) => {
        window.playerNumber = data.playerNumber;
    });

    // Opponent has joined the room
    window.socket.on('opponentJoined', () => {
        // If we're on the waiting screen, show a brief notification
        if (waitingScreen.style.display !== 'none') {
            const title = document.querySelector('.waiting-title');
            if (title) {
                title.textContent = 'OPPONENT FOUND!';
                title.style.color = '#00e676';
            }
        }
    });

    // Match countdown — transition to game screen
    window.socket.on('matchCountdown', (data) => {
        // Switch to game view on first countdown tick
        if (lobby.style.display !== 'none') {
            showScreen('game');
        }

        // Start the Phaser game instance if not yet started
        if (!gameStarted && typeof window.startGame === 'function') {
            gameStarted = true;
            window.startGame();
        }
    });

    // Match start — game.js handles this internally
    window.socket.on('matchStart', () => {
        // Handled by game.js scene
    });

    // Match end helper — callable by socket, local 2P, or local bot match
    window.handleMatchEnd = function (data) {
        const { winner, reason, health1, health2 } = data;
        const myNumber = window.playerNumber || 1;

        let title = '';
        let titleClass = '';
        let detail = '';

        const charNames = { dip: 'DIP', sanket: 'SANKET', sushruto: 'SUSHRUTO', ahil: 'AHIL', keshav: 'KESHAV' };
        const p1Name = charNames[window.selectedP1Char || 'dip'] || 'PLAYER 1';
        const p2Name = charNames[window.selectedP2Char || 'sanket'] || 'PLAYER 2';

        if (window.isLocal2P) {
            if (winner === 1) {
                title = `${p1Name} (P1) WINS!`;
                titleClass = 'victory';
                detail = `${p1Name} (Player 1) eliminated ${p2Name} (Player 2)!`;
            } else if (winner === 2) {
                title = `${p2Name} (P2) WINS!`;
                titleClass = 'defeat';
                detail = `${p2Name} (Player 2) eliminated ${p1Name} (Player 1)!`;
            } else {
                title = 'DRAW!';
                titleClass = 'draw';
                detail = "Time's up — It's an equal tie!";
            }
        } else if (winner === 0) {
            // Draw
            title = 'DRAW!';
            titleClass = 'draw';
            detail = (reason === 'timeout' || reason === 'time')
                ? "Time's up — It's a tie!"
                : 'The match ended in a draw!';
        } else if (winner === myNumber) {
            // Victory
            title = 'VICTORY!';
            titleClass = 'victory';
            if (reason === 'elimination' || reason === 'kill') {
                detail = window.isBotMatch
                    ? `You defeated the ${p2Name} Combat Bot!`
                    : 'You eliminated your opponent!';
            } else if (reason === 'timeout' || reason === 'time') {
                detail = "Time's up — You had more health!";
            } else if (reason === 'disconnect') {
                detail = 'Opponent disconnected — You win by default!';
            } else {
                detail = 'You won the match!';
            }
        } else {
            // Defeat
            title = 'DEFEAT!';
            titleClass = 'defeat';
            if (reason === 'elimination' || reason === 'kill') {
                detail = window.isBotMatch
                    ? `The ${p2Name} Combat Bot eliminated you!`
                    : 'You were eliminated!';
            } else if (reason === 'timeout' || reason === 'time') {
                detail = "Time's up — Your opponent had more health!";
            } else {
                detail = 'Better luck next time!';
            }
        }

        // Update Win Streaks
        if (!window.winStreaks) {
            window.winStreaks = { p1: 0, p2: 0 };
        }

        let streakNotice = '';
        if (winner === 1) {
            window.winStreaks.p1 = (window.winStreaks.p1 || 0) + 1;
            window.winStreaks.p2 = 0;
            if (window.winStreaks.p1 >= 3) {
                streakNotice = `<div class="streak-crown-announcement">👑 ${p1Name} IS ON A ${window.winStreaks.p1}-WIN STREAK! GOLDEN CROWN UNLOCKED! 👑</div>`;
            }
        } else if (winner === 2) {
            window.winStreaks.p2 = (window.winStreaks.p2 || 0) + 1;
            window.winStreaks.p1 = 0;
            if (window.winStreaks.p2 >= 3) {
                streakNotice = `<div class="streak-crown-announcement">👑 ${p2Name} IS ON A ${window.winStreaks.p2}-WIN STREAK! GOLDEN CROWN UNLOCKED! 👑</div>`;
            }
        }

        try {
            sessionStorage.setItem('duel_zone_win_streaks', JSON.stringify(window.winStreaks));
        } catch(e) {}

        // Update result card
        resultTitle.textContent = title;
        resultTitle.className = 'result-text ' + titleClass;
        resultDetail.innerHTML = detail + streakNotice;

        // Reset rematch UI
        rematchBtn.disabled = false;
        rematchStatus.style.display = 'none';
        rematchStatus.textContent = '';

        showScreen('result');
    };

    // Match end socket listener
    window.socket.on('matchEnd', (data) => {
        window.handleMatchEnd(data);
    });

    // Opponent disconnected
    window.socket.on('opponentDisconnected', () => {
        if (gameContainer.style.display !== 'none') {
            // During a game — show result overlay
            resultTitle.textContent = 'OPPONENT DISCONNECTED';
            resultTitle.className = 'result-text victory';
            resultDetail.textContent = 'You win by default!';
            rematchBtn.disabled = true;
            rematchStatus.style.display = 'none';
            showScreen('result');
        } else if (waitingScreen.style.display !== 'none') {
            // During waiting — go back to menu
            showError('Opponent disconnected');
            showScreen('menu');
        }
    });

    // Opponent wants a rematch
    window.socket.on('rematchRequested', () => {
        rematchStatus.textContent = 'Opponent wants a rematch!';
        rematchStatus.style.display = 'block';
    });

    // Rematch starting — reset for a new game
    window.socket.on('rematchStart', () => {
        resultOverlay.style.display = 'none';

        // Destroy old game instance
        if (typeof window.destroyGame === 'function') {
            window.destroyGame();
        }
        gameStarted = false;

        // The matchCountdown events will trigger startGame again
    });

    // ----------------------------------------------------------------
    // window.onGameEnd — callable by game.js (no-op since socket
    // listener above handles everything)
    // ----------------------------------------------------------------
    window.onGameEnd = function (winner, reason) {
        // Result screen is already shown by the matchEnd socket handler.
    };

    // ----------------------------------------------------------------
    // Mobile Controls Visibility Management
    // ----------------------------------------------------------------
    function updateMobileControlsVisibility() {
        if (!mobileControls) return;
        if (isMobile) {
            mobileControls.style.display = 'flex';
            const btnJump = document.getElementById('btn-jump');
            const btnSuper = document.getElementById('btn-super');
            if (window.selectedMap === 'brawl') {
                // In Top-Down Diwali mode: no jump, and special power is replaced by Diwali pataka bombs on map
                if (btnJump) btnJump.style.display = 'none';
                if (btnSuper) btnSuper.style.display = 'none';
            } else {
                // In Cyber City platformer: both Jump and Super power are active
                if (btnJump) btnJump.style.display = 'flex';
                if (btnSuper) btnSuper.style.display = 'flex';
            }
        } else {
            mobileControls.style.display = 'none';
        }
    }
    window.updateMobileControlsVisibility = updateMobileControlsVisibility;

    // ----------------------------------------------------------------
    // Virtual 360° Analog Joystick & Action Buttons Setup
    // ----------------------------------------------------------------
    const joystickZone = document.getElementById('joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickKnob = document.getElementById('joystick-knob');
    let joystickTouchId = null;
    let joystickActive = false;
    const maxRadius = 45; // Max displacement radius in pixels

    function updateJoystickPosition(clientX, clientY) {
        if (!joystickBase || !joystickKnob) return;
        const rect = joystickBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);

        let clampedX = dx;
        let clampedY = dy;
        if (dist > maxRadius) {
            clampedX = (dx / dist) * maxRadius;
            clampedY = (dy / dist) * maxRadius;
        }

        joystickKnob.style.transform = `translate(calc(-50% + ${clampedX.toFixed(1)}px), calc(-50% + ${clampedY.toFixed(1)}px))`;

        const normDist = Math.min(1, dist / maxRadius);
        const angle = Math.atan2(dy, dx);
        const ax = Math.cos(angle) * normDist;
        const ay = Math.sin(angle) * normDist;

        window.mobileInput.analogX = ax;
        window.mobileInput.analogY = ay;

        // Directional booleans (deadzone 0.28)
        const deadzone = 0.28;
        window.mobileInput.left  = ax < -deadzone;
        window.mobileInput.right = ax > deadzone;
        window.mobileInput.up    = ay < -deadzone;
        window.mobileInput.down  = ay > deadzone;
    }

    function resetJoystick() {
        joystickTouchId = null;
        joystickActive = false;
        if (joystickKnob) {
            joystickKnob.style.transform = 'translate(-50%, -50%)';
        }
        window.mobileInput.analogX = 0;
        window.mobileInput.analogY = 0;
        window.mobileInput.left = false;
        window.mobileInput.right = false;
        window.mobileInput.up = false;
        window.mobileInput.down = false;
    }

    if (joystickZone) {
        // Multi-touch tracking using touch.identifier to isolate left joystick from right buttons
        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (joystickTouchId !== null) return;
            const touch = e.changedTouches[0];
            joystickTouchId = touch.identifier;
            joystickActive = true;
            updateJoystickPosition(touch.clientX, touch.clientY);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!joystickActive || joystickTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystickTouchId) {
                    e.preventDefault();
                    updateJoystickPosition(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                    break;
                }
            }
        }, { passive: false });

        function handleJoystickTouchEnd(e) {
            if (!joystickActive || joystickTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystickTouchId) {
                    resetJoystick();
                    break;
                }
            }
        }

        window.addEventListener('touchend', handleJoystickTouchEnd, { passive: true });
        window.addEventListener('touchcancel', handleJoystickTouchEnd, { passive: true });

        // Mouse fallbacks for testing / browser emulation
        let mouseDragging = false;
        joystickZone.addEventListener('mousedown', (e) => {
            mouseDragging = true;
            updateJoystickPosition(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            if (mouseDragging) {
                updateJoystickPosition(e.clientX, e.clientY);
            }
        });

        window.addEventListener('mouseup', () => {
            if (mouseDragging) {
                mouseDragging = false;
                resetJoystick();
            }
        });
    }

    // Action Buttons setup (Shoot, Super, Jump)
    function setupMobileActionButton(id, inputKey) {
        const btn = document.getElementById(id);
        if (!btn) return;

        function activate(e) {
            if (e) e.preventDefault();
            window.mobileInput[inputKey] = true;
            btn.classList.add('active');
        }

        function deactivate(e) {
            if (e) e.preventDefault();
            window.mobileInput[inputKey] = false;
            btn.classList.remove('active');
        }

        btn.addEventListener('touchstart', activate, { passive: false });
        btn.addEventListener('touchend', deactivate, { passive: false });
        btn.addEventListener('touchcancel', deactivate, { passive: false });

        btn.addEventListener('mousedown', activate);
        window.addEventListener('mouseup', deactivate);
    }

    setupMobileActionButton('btn-shoot', 'shoot');
    setupMobileActionButton('btn-super', 'super');
    setupMobileActionButton('btn-jump', 'jump');

    window.mobileBtnSuper = document.getElementById('btn-super');

    // ----------------------------------------------------------------
    // Mobile Orientation & Fullscreen Manager
    // When mobile is in portrait -> Show rotate warning overlay
    // When mobile is rotated to landscape -> Hide overlay & Auto-Fullscreen
    // ----------------------------------------------------------------
    let wasPortrait = false;
    let autoFullscreenAttempted = false;

    function isDevicePortrait() {
        if (window.screen && window.screen.orientation && window.screen.orientation.type) {
            return window.screen.orientation.type.includes('portrait');
        }
        return window.innerHeight > window.innerWidth;
    }

    function triggerFullscreen() {
        const docEl = document.documentElement;
        const reqFs = docEl.requestFullscreen ||
                      docEl.webkitRequestFullscreen ||
                      docEl.mozRequestFullScreen ||
                      docEl.msRequestFullscreen;

        if (reqFs && !document.fullscreenElement && !document.webkitFullscreenElement) {
            try {
                const res = reqFs.call(docEl);
                if (res && res.catch) {
                    res.catch(() => {
                        armFullscreenOnNextTouch();
                    });
                }
            } catch (e) {
                armFullscreenOnNextTouch();
            }
        }

        // Try locking orientation to landscape if supported
        if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
            try {
                window.screen.orientation.lock('landscape').catch(() => {});
            } catch (e) {}
        }
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            triggerFullscreen();
        } else {
            const exitFs = document.exitFullscreen ||
                           document.webkitExitFullscreen ||
                           document.mozCancelFullScreen ||
                           document.msExitFullscreen;
            if (exitFs) {
                try {
                    exitFs.call(document);
                } catch (e) {}
            }
        }
    }

    function armFullscreenOnNextTouch() {
        function onTouchFs() {
            triggerFullscreen();
            window.removeEventListener('touchend', onTouchFs);
            window.removeEventListener('click', onTouchFs);
        }
        window.addEventListener('touchend', onTouchFs, { once: true, passive: true });
        window.addEventListener('click', onTouchFs, { once: true });
    }

    function updateFullscreenIcons() {
        const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
        if (inGameFullscreenBtn) {
            const icon = inGameFullscreenBtn.querySelector('.fs-icon');
            const text = inGameFullscreenBtn.querySelector('.fs-text');
            if (icon) icon.textContent = isFs ? '✕' : '⛶';
            if (text) text.textContent = isFs ? 'EXIT' : 'FULL';
        }
        if (fullscreenBtn) {
            fullscreenBtn.textContent = isFs ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
        }
    }

    function checkOrientation() {
        const mobile = checkIsMobile();
        isMobile = mobile;
        const portrait = isDevicePortrait();

        if (mobile) {
            if (portrait) {
                wasPortrait = true;
                if (rotateOverlay) rotateOverlay.style.display = 'flex';
            } else {
                if (rotateOverlay) rotateOverlay.style.display = 'none';
                // If it was in portrait and rotated to landscape, automatically open in Full Screen!
                if (wasPortrait || !autoFullscreenAttempted) {
                    wasPortrait = false;
                    autoFullscreenAttempted = true;
                    triggerFullscreen();
                }
            }
        } else {
            if (rotateOverlay) rotateOverlay.style.display = 'none';
        }

        updateFullscreenIcons();
    }

    if (btnRotatePlay) {
        btnRotatePlay.addEventListener('click', () => {
            triggerFullscreen();
            if (!isDevicePortrait()) {
                if (rotateOverlay) rotateOverlay.style.display = 'none';
            }
        });
    }

    if (inGameFullscreenBtn) {
        inGameFullscreenBtn.addEventListener('click', () => {
            toggleFullscreen();
        });
    }

    document.addEventListener('fullscreenchange', updateFullscreenIcons);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcons);

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
        setTimeout(checkOrientation, 150);
        setTimeout(checkOrientation, 400);
    });
    if (window.screen && window.screen.orientation) {
        window.screen.orientation.addEventListener('change', () => {
            setTimeout(checkOrientation, 150);
            setTimeout(checkOrientation, 400);
        });
    }

    // Initial check on load
    setTimeout(checkOrientation, 80);
    setTimeout(checkOrientation, 350);

    // ----------------------------------------------------------------
    // Initialize — show menu screen
    // ----------------------------------------------------------------
    showScreen('menu');
});
