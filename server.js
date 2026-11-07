// ============================================
// DUEL ZONE - Multiplayer Game Server
// ============================================
// Express + Socket.IO backend for a 2D multiplayer shooting game
// Handles room management, game state, and real-time communication

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// --- Express Setup ---
const app = express();
const server = http.createServer(app);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// --- Socket.IO Setup with CORS ---
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// ============================================
// Data Structures
// ============================================

// Room storage: roomCode → { players: [socketId1, socketId2], state: {}, timer: null, countdownTimeouts: [] }
const rooms = new Map();

// Quick lookup maps for disconnect handling
const socketToRoom = new Map();   // socketId → roomCode
const socketToPlayer = new Map(); // socketId → playerNumber (1 or 2)

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a unique 6-character uppercase alphanumeric room code.
 * Keeps generating until a code that isn't already in use is found.
 */
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    do {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (rooms.has(code)); // Ensure uniqueness
    return code;
}

/**
 * Create a fresh game state object for a new match.
 */
function createGameState() {
    return {
        health: { 1: 3, 2: 3 },
        started: false,
        timeLeft: 120,
        lastDamageTime: { 1: 0, 2: 0 }, // Timestamp of last damage to each player (for 800ms cooldown)
        rematchVotes: 0
    };
}

/**
 * Clear all timers and timeouts associated with a room.
 * Prevents memory leaks and stale timer callbacks.
 */
function clearRoomTimers(room) {
    // Clear the match countdown timer interval
    if (room.timer) {
        clearInterval(room.timer);
        room.timer = null;
    }
    // Clear any pending countdown sequence timeouts
    if (room.countdownTimeouts && room.countdownTimeouts.length > 0) {
        room.countdownTimeouts.forEach(t => clearTimeout(t));
        room.countdownTimeouts = [];
    }
}

/**
 * Destroy a room: clear timers, remove player mappings, delete from rooms map.
 */
function destroyRoom(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Clear all active timers
    clearRoomTimers(room);

    // Remove socket-to-room and socket-to-player mappings for all players in the room
    room.players.forEach(socketId => {
        if (socketId) {
            socketToRoom.delete(socketId);
            socketToPlayer.delete(socketId);
        }
    });

    // Delete the room itself
    rooms.delete(roomCode);
}

/**
 * Determine the match winner based on current health values.
 * Returns { winner, reason } where winner is 0 for draw, 1 or 2 for a player.
 */
function determineWinnerByHealth(state) {
    let winner = 0;  // 0 = draw
    let reason = 'draw';

    if (state.health[1] > state.health[2]) {
        winner = 1;
        reason = 'time';
    } else if (state.health[2] > state.health[1]) {
        winner = 2;
        reason = 'time';
    }

    return { winner, reason };
}

/**
 * Start the countdown sequence before a match begins.
 * Counts down 3, 2, 1 then starts the match and the game timer.
 */
function startCountdownSequence(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Clear any existing countdown timeouts to prevent duplicates
    if (room.countdownTimeouts) {
        room.countdownTimeouts.forEach(t => clearTimeout(t));
    }
    room.countdownTimeouts = [];

    // Schedule countdown: 3... 2... 1... GO!
    // Each step is 1 second apart, starting after a 1-second initial delay

    // Count 3 at t=1s
    const t1 = setTimeout(() => {
        io.to(roomCode).emit('matchCountdown', { count: 3 });
    }, 1000);
    room.countdownTimeouts.push(t1);

    // Count 2 at t=2s
    const t2 = setTimeout(() => {
        io.to(roomCode).emit('matchCountdown', { count: 2 });
    }, 2000);
    room.countdownTimeouts.push(t2);

    // Count 1 at t=3s
    const t3 = setTimeout(() => {
        io.to(roomCode).emit('matchCountdown', { count: 1 });
    }, 3000);
    room.countdownTimeouts.push(t3);

    // Match start at t=4s
    const t4 = setTimeout(() => {
        const currentRoom = rooms.get(roomCode);
        if (!currentRoom) return; // Room may have been destroyed during countdown

        // Signal match start
        io.to(roomCode).emit('matchStart', {});
        currentRoom.state.started = true;

        // Start the match timer (ticks every 1 second)
        currentRoom.timer = setInterval(() => {
            const r = rooms.get(roomCode);
            if (!r) return;

            r.state.timeLeft--;

            // Broadcast remaining time to all players in the room
            io.to(roomCode).emit('timerUpdate', { timeLeft: r.state.timeLeft });

            // Check if time has expired
            if (r.state.timeLeft <= 0) {
                clearInterval(r.timer);
                r.timer = null;

                // Determine winner by remaining health
                const { winner, reason } = determineWinnerByHealth(r.state);

                io.to(roomCode).emit('matchEnd', {
                    winner: winner,
                    reason: reason,
                    health1: r.state.health[1],
                    health2: r.state.health[2]
                });

                // Mark match as no longer active
                r.state.started = false;
            }
        }, 1000);
    }, 4000);
    room.countdownTimeouts.push(t4);
}

// ============================================
// Socket.IO Connection Handler
// ============================================

io.on('connection', (socket) => {
    console.log(`[Connect] Player connected: ${socket.id}`);

    // ------------------------------------------
    // CREATE ROOM
    // ------------------------------------------
    socket.on('createRoom', () => {
        // Generate a unique room code
        const code = generateRoomCode();

        // Create the room with this player as player 1
        const room = {
            players: [socket.id],  // Player 1 is at index 0
            state: createGameState(),
            timer: null,
            countdownTimeouts: []
        };
        rooms.set(code, room);

        // Map this socket to the room and player number
        socketToRoom.set(socket.id, code);
        socketToPlayer.set(socket.id, 1);

        // Join the Socket.IO room channel
        socket.join(code);

        // Notify the client
        socket.emit('roomCreated', { code: code });
        socket.emit('playerJoined', { playerNumber: 1 });

        console.log(`[Room] Created room ${code} by player ${socket.id}`);
    });

    // ------------------------------------------
    // JOIN ROOM
    // ------------------------------------------
    socket.on('joinRoom', (data) => {
        const code = data.code ? data.code.toUpperCase().trim() : '';

        // Validate that the room exists
        if (!rooms.has(code)) {
            socket.emit('joinError', { message: 'Room not found' });
            return;
        }

        const room = rooms.get(code);

        // Validate that the room isn't full (max 2 players)
        if (room.players.length >= 2) {
            socket.emit('joinError', { message: 'Room is full' });
            return;
        }

        // Add player as player 2
        room.players.push(socket.id);

        // Map this socket to the room and player number
        socketToRoom.set(socket.id, code);
        socketToPlayer.set(socket.id, 2);

        // Join the Socket.IO room channel
        socket.join(code);

        // Notify player 2 (sender)
        socket.emit('playerJoined', { playerNumber: 2 });

        // Notify player 1 (the other player already in the room)
        socket.to(code).emit('opponentJoined', {});

        console.log(`[Room] Player ${socket.id} joined room ${code} as player 2`);

        // Start countdown sequence after a 1-second delay
        const initialDelay = setTimeout(() => {
            startCountdownSequence(code);
        }, 1000);
        room.countdownTimeouts.push(initialDelay);
    });

    // ------------------------------------------
    // PLAYER MOVEMENT
    // ------------------------------------------
    socket.on('playerMovement', (data) => {
        const roomCode = socketToRoom.get(socket.id);
        if (!roomCode) return;

        // Broadcast movement to the OTHER player (not back to sender)
        socket.to(roomCode).emit('opponentMovement', {
            x: data.x,
            y: data.y,
            velX: data.velX,
            velY: data.velY,
            flipX: data.flipX,
            anim: data.anim
        });
    });

    // ------------------------------------------
    // PLAYER SHOOT
    // ------------------------------------------
    socket.on('playerShoot', (data) => {
        const roomCode = socketToRoom.get(socket.id);
        if (!roomCode) return;

        // Broadcast shot to the OTHER player
        socket.to(roomCode).emit('opponentShoot', {
            x: data.x,
            y: data.y,
            direction: data.direction,
            id: data.id
        });
    });

    // ------------------------------------------
    // BULLET HIT
    // ------------------------------------------
    socket.on('bulletHit', (data) => {
        const roomCode = socketToRoom.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        const state = room.state;
        const targetPlayer = data.targetPlayer;
        const shooterNumber = socketToPlayer.get(socket.id);

        // --- Validation checks ---

        // Match must be active
        if (!state.started) return;

        // Target health must be above 0
        if (state.health[targetPlayer] <= 0) return;

        // Damage cooldown: 800ms since last damage to this target
        const now = Date.now();
        if (now - state.lastDamageTime[targetPlayer] < 800) return;

        // --- Apply damage ---
        state.health[targetPlayer]--;
        state.lastDamageTime[targetPlayer] = now;

        // Notify ALL players in the room about the damage
        io.to(roomCode).emit('playerDamaged', {
            playerNumber: targetPlayer,
            health: state.health[targetPlayer]
        });

        console.log(`[Combat] Player ${targetPlayer} hit! Health: ${state.health[targetPlayer]} (Room: ${roomCode})`);

        // Check for kill (health reaches 0)
        if (state.health[targetPlayer] <= 0) {
            // Stop the match timer
            if (room.timer) {
                clearInterval(room.timer);
                room.timer = null;
            }

            // Mark match as ended
            state.started = false;

            // Emit match end with kill result
            io.to(roomCode).emit('matchEnd', {
                winner: shooterNumber,
                reason: 'kill',
                health1: state.health[1],
                health2: state.health[2]
            });

            console.log(`[Match] Player ${shooterNumber} wins by kill in room ${roomCode}`);
        }
    });

    // ------------------------------------------
    // REQUEST REMATCH
    // ------------------------------------------
    socket.on('requestRematch', () => {
        const roomCode = socketToRoom.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        // Increment rematch vote count
        room.state.rematchVotes++;

        console.log(`[Rematch] Vote ${room.state.rematchVotes}/2 in room ${roomCode}`);

        if (room.state.rematchVotes < 2) {
            // Only one player has voted — notify the other player
            socket.to(roomCode).emit('rematchRequested', {});
        } else {
            // Both players agreed — reset game state and restart
            room.state = createGameState();
            room.state.rematchVotes = 0;

            // Clear any existing timers
            clearRoomTimers(room);

            // Notify both players that rematch is starting
            io.to(roomCode).emit('rematchStart', {});

            console.log(`[Rematch] Both players agreed. Restarting match in room ${roomCode}`);

            // Start the countdown sequence again
            startCountdownSequence(roomCode);
        }
    });

    // ------------------------------------------
    // LEAVE ROOM / CANCEL
    // ------------------------------------------
    socket.on('leaveRoom', () => {
        const roomCode = socketToRoom.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        // If there is another player in room, notify them
        socket.to(roomCode).emit('opponentDisconnected', {});

        // Destroy the room and remove socket
        destroyRoom(roomCode);
        socket.leave(roomCode);

        console.log(`[Room] Player ${socket.id} left and room ${roomCode} was closed`);
    });

    // ------------------------------------------
    // DISCONNECT
    // ------------------------------------------
    socket.on('disconnect', () => {
        console.log(`[Disconnect] Player disconnected: ${socket.id}`);

        // Find which room this socket was in
        const roomCode = socketToRoom.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        // Notify the other player that their opponent disconnected
        socket.to(roomCode).emit('opponentDisconnected', {});

        // Clean up: clear all timers and destroy the room
        destroyRoom(roomCode);

        console.log(`[Room] Room ${roomCode} destroyed due to player disconnect`);
    });
});

// ============================================
// Start the Server
// ============================================

const PORT = 3000;
server.listen(PORT, () => {
    console.log('============================================');
    console.log(`  DUEL ZONE Server running on port ${PORT}`);
    console.log(`  http://localhost:${PORT}`);
    console.log('============================================');
});
