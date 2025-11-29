const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const RoomManager = require('./roomManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const roomManager = new RoomManager();

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // NOTE: User is NOT considered "online" yet!
  // They become visible as "online" only to other users in the same room,
  // not globally online to all connected users.
  
  /**
   * User joins a room
   * This is when they become "online" to other users in that room
   */
  socket.on('joinRoom', ({ roomId, userId, userName }) => {
    // Join the socket.io room
    socket.join(roomId);
    
    // Add user to room manager
    const onlineUsers = roomManager.joinRoom(socket.id, roomId, {
      id: userId,
      name: userName
    });
    
    console.log(`User ${userName} (${userId}) joined room: ${roomId}`);
    console.log(`Online users in room ${roomId}:`, onlineUsers);
    
    // Notify all users in the room about the updated online users list
    // Users only see other users who are in the SAME room
    io.to(roomId).emit('onlineUsers', {
      roomId: roomId,
      users: onlineUsers
    });
    
    // Notify other users in the room that a new user joined
    socket.to(roomId).emit('userJoined', {
      userId: userId,
      userName: userName,
      roomId: roomId
    });
  });
  
  /**
   * User leaves a room
   * They are no longer "online" to users in that room
   */
  socket.on('leaveRoom', () => {
    const result = roomManager.leaveCurrentRoom(socket.id);
    
    if (result) {
      socket.leave(result.roomId);
      
      console.log(`User left room: ${result.roomId}`);
      
      // Notify remaining users in the room
      io.to(result.roomId).emit('onlineUsers', {
        roomId: result.roomId,
        users: result.remainingUsers
      });
      
      socket.to(result.roomId).emit('userLeft', {
        roomId: result.roomId
      });
    }
  });
  
  /**
   * Handle disconnect
   * User is removed from their room and no longer online
   */
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const result = roomManager.handleDisconnect(socket.id);
    
    if (result) {
      // Notify remaining users in the room
      io.to(result.roomId).emit('onlineUsers', {
        roomId: result.roomId,
        users: result.remainingUsers
      });
      
      io.to(result.roomId).emit('userLeft', {
        roomId: result.roomId
      });
    }
  });
  
  /**
   * Get online users in a specific room
   * Returns users who are in the SAME room only
   */
  socket.on('getOnlineUsers', (roomId) => {
    const users = roomManager.getOnlineUsersInRoom(roomId);
    socket.emit('onlineUsers', {
      roomId: roomId,
      users: users
    });
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  ROOM-BASED ONLINE STATUS SYSTEM                               ║
║                                                                 ║
║  Users are NOT globally online when connected.                 ║
║  Users only appear "online" to other users in the SAME ROOM.  ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, io, roomManager };
