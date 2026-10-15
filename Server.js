const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

let connectedUsers = {};
const CREATOR_NICK = "DrooPy..";

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  socket.on('join', (data) => {
    let nickname = data.nickname.trim();
    let globalRank = "Usuario";

    if (nickname.toLowerCase() === CREATOR_NICK.toLowerCase()) {
      globalRank = "Owner [Creador]";
    }

    connectedUsers[socket.id] = {
      nickname: nickname,
      globalRank: globalRank
    };

    io.emit('updateUsers', Object.values(connectedUsers));
    io.emit('chatMessage', {
      user: 'Plataforma RGC',
      text: `${nickname} se ha conectado [Rango: ${globalRank}].`,
      system: true
    });
  });

  socket.on('sendMessage', (messageText) => {
    const user = connectedUsers[socket.id];
    if (!user) return;

    if (messageText.startsWith('/setrank') && user.globalRank.includes("Owner")) {
      const parts = messageText.split(' ');
      const targetNick = parts[1];
      const newRank = parts.slice(2).join(' ');

      for (let id in connectedUsers) {
        if (connectedUsers[id].nickname.toLowerCase() === targetNick.toLowerCase()) {
          connectedUsers[id].globalRank = newRank;
          io.emit('updateUsers', Object.values(connectedUsers));
          io.emit('chatMessage', {
            user: 'Plataforma RGC',
            text: `⚠️ [SISTEMA]: El Creador asignó el rango global "${newRank}" a ${targetNick}.`,
            system: true
          });
          return;
        }
      }
    }

    io.emit('chatMessage', {
      user: user.nickname,
      globalRank: user.globalRank,
      text: messageText,
      system: false
    });
  });

  socket.on('disconnect', () => {
    const user = connectedUsers[socket.id];
    if (user) {
      io.emit('chatMessage', {
        user: 'Plataforma RGC',
        text: `${user.nickname} ha salido de la plataforma.`,
        system: true
      });
      delete connectedUsers[socket.id];
      io.emit('updateUsers', Object.values(connectedUsers));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor RGC corriendo en el puerto ${PORT}`);
});
