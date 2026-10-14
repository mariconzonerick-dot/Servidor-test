const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static('public'));

let connectedUsers = {};

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  socket.on('join', (data) => {
    connectedUsers[socket.id] = {
      nickname: data.nickname,
      rank: data.rank || 1
    };

    io.emit('updateUsers', Object.values(connectedUsers));
    io.emit('chatMessage', {
      user: 'Sistema',
      text: `${data.nickname} se ha unido al chat.`,
      system: true
    });
  });

  socket.on('sendMessage', (messageText) => {
    const user = connectedUsers[socket.id];
    if (user) {
      io.emit('chatMessage', {
        user: user.nickname,
        rank: user.rank,
        text: messageText,
        system: false
      });
    }
  });

  socket.on('disconnect', () => {
    const user = connectedUsers[socket.id];
    if (user) {
      io.emit('chatMessage', {
        user: 'Sistema',
        text: `${user.nickname} ha salido del chat.`,
        system: true
      });
      delete connectedUsers[socket.id];
      io.emit('updateUsers', Object.values(connectedUsers));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor de chat corriendo en el puerto ${PORT}`);
});
