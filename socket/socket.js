import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId]
}

const userSocketMap = {} 

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if(userId !== "undefined"){
    userSocketMap[userId] = socket.id;
  }

  // Evento para entrar na sala do QR code
  socket.on('joinQRCodeRoom', ({ instance }) => {
    console.log(`Cliente ${socket.id} entrou na sala do QR code para a instância ${instance}`);
    socket.join(`qrcode-${instance}`);
  });

  // Evento para sair da sala do QR code
  socket.on('leaveQRCodeRoom', ({ instance }) => {
    console.log(`Cliente ${socket.id} saiu da sala do QR code para a instância ${instance}`);
    socket.leave(`qrcode-${instance}`);
  });

  // Evento para atualizar os usuários online, enviado para todos os clientes conectados
  io.emit("getOnlineUsers", Object.keys(userSocketMap))

  socket.on("disconnect", () => {
    console.log("a user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap))
  });

  socket.on('joinInstanceRoom', (data) => {
    const room = `instance-${data.instance}`;
    socket.join(room);
    console.log(`Cliente ${socket.id} entrou na sala: ${room}`);
    socket.emit('joinedRoom', room);
  });

  socket.on('joinCampaignRoom', (data) => {
    const room = `instance-${data.instanceName}`;
    socket.join(room);
    console.log(`Cliente ${socket.id} entrou na sala da campanha: ${room}`);
    socket.emit('joinedCampaignRoom', room);
  });

  socket.on('joinWorkspaceRoom', (workspaceId) => {
    const room = `workspace_${workspaceId}`;
    socket.join(room);
    console.log(`Cliente ${socket.id} entrou na sala do workspace: ${room}`);
  });

  socket.on('leaveWorkspaceRoom', (workspaceId) => {
    const room = `workspace_${workspaceId}`;
    socket.leave(room);
    console.log(`Cliente ${socket.id} saiu da sala do workspace: ${room}`);
  });
});

export { app, server, io };
