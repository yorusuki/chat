const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const players = {};

app.use(express.static(path.join(__dirname, 'public'))); // 將你的 HTML 放在 public 資料夾

io.on('connection', (socket) => {
  console.log(`🟢 ${socket.id} connected`);

  socket.on('newPlayer', ({ name, x, y }) => {
    players[socket.id] = { id: socket.id, name, x, y };
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
  });

  socket.on('move', ({ x, y, animKey, frame }) => {
    if (players[socket.id]) {
      players[socket.id].x = x;
      players[socket.id].y = y;

      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x,
        y,
        animKey,  // 加上動畫 key
        frame     // 加上靜止時的 frame（可選）
      });
    }
  });

  socket.on('chatMessage', ({ name, msg }) => {
    if (typeof msg === 'string' && typeof name === 'string') {
      io.emit('chatMessage', { name, msg, id: socket.id });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔴 ${socket.id} disconnected`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 1212;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});


