// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

const PLAYER_COLORS = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#ff00ff', '#00ffff', '#ff8c00', '#8a2be2', 
    '#ff1493', '#00ff7f', '#d2691e', '#dc143c'
];

let players = {};
let colorIndex = 0;

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Assign dynamic colors and starting positions
    const assignedColor = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
    colorIndex++;

    players[socket.id] = {
        id: socket.id,
        x: 400 + (Math.random() * 60 - 30),
        y: 500 + (Math.random() * 60 - 30),
        vx: 0,
        vy: 0,
        w: 26,
        h: 26,
        color: assignedColor,
        lookAngle: 0,
        state: 'idle',
        angle: 0,
        punches: 0,
        equippedAbility: 'None',
        gameState: 'LOBBY'
    };

    // Send the player their unique ID and current player list
    socket.emit('init', { id: socket.id, players: players });
    socket.broadcast.emit('playerJoined', players[socket.id]);

    // Update state from clients
    socket.on('updateState', (data) => {
        if (players[socket.id]) {
            Object.assign(players[socket.id], data);
            socket.broadcast.emit('playerUpdated', players[socket.id]);
        }
    });

    // Sync action triggers (punches, abilities) to other clients
    socket.on('playerAction', (actionData) => {
        socket.broadcast.emit('remotePlayerAction', {
            id: socket.id,
            ...actionData
        });
    });

    // Handle disconnects
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
