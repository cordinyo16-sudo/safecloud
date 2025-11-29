const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const RoomManager = require('./roomManager');

describe('RoomManager', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('joinRoom', () => {
    it('should add user to a room', () => {
      const socketId = 'socket-1';
      const roomId = 'room-1';
      const userInfo = { id: 'user-1', name: 'Alice' };

      const onlineUsers = roomManager.joinRoom(socketId, roomId, userInfo);

      assert.strictEqual(onlineUsers.length, 1);
      assert.strictEqual(onlineUsers[0].id, 'user-1');
      assert.strictEqual(onlineUsers[0].name, 'Alice');
    });

    it('should return all users in the room', () => {
      roomManager.joinRoom('socket-1', 'room-1', { id: 'user-1', name: 'Alice' });
      roomManager.joinRoom('socket-2', 'room-1', { id: 'user-2', name: 'Bob' });

      const onlineUsers = roomManager.getOnlineUsersInRoom('room-1');

      assert.strictEqual(onlineUsers.length, 2);
    });

    it('should move user to new room when joining another room', () => {
      roomManager.joinRoom('socket-1', 'room-1', { id: 'user-1', name: 'Alice' });
      roomManager.joinRoom('socket-1', 'room-2', { id: 'user-1', name: 'Alice' });

      const room1Users = roomManager.getOnlineUsersInRoom('room-1');
      const room2Users = roomManager.getOnlineUsersInRoom('room-2');

      assert.strictEqual(room1Users.length, 0);
      assert.strictEqual(room2Users.length, 1);
    });
  });

  describe('leaveCurrentRoom', () => {
    it('should remove user from room', () => {
      roomManager.joinRoom('socket-1', 'room-1', { id: 'user-1', name: 'Alice' });
      roomManager.leaveCurrentRoom('socket-1');

      const onlineUsers = roomManager.getOnlineUsersInRoom('room-1');

      assert.strictEqual(onlineUsers.length, 0);
    });

    it('should return null if user is not in any room', () => {
      const result = roomManager.leaveCurrentRoom('non-existent-socket');

      assert.strictEqual(result, null);
    });
  });

  describe('getOnlineUsersInRoom', () => {
    it('should return empty array for non-existent room', () => {
      const users = roomManager.getOnlineUsersInRoom('non-existent-room');

      assert.strictEqual(users.length, 0);
    });

    it('should only return users in the specified room', () => {
      roomManager.joinRoom('socket-1', 'room-1', { id: 'user-1', name: 'Alice' });
      roomManager.joinRoom('socket-2', 'room-2', { id: 'user-2', name: 'Bob' });

      const room1Users = roomManager.getOnlineUsersInRoom('room-1');
      const room2Users = roomManager.getOnlineUsersInRoom('room-2');

      assert.strictEqual(room1Users.length, 1);
      assert.strictEqual(room1Users[0].name, 'Alice');
      assert.strictEqual(room2Users.length, 1);
      assert.strictEqual(room2Users[0].name, 'Bob');
    });
  });

  describe('isUserOnlineInRoom', () => {
    it('should return true if user is in the room', () => {
      roomManager.joinRoom('socket-1', 'room-1', { id: 'user-1', name: 'Alice' });

      const isOnline = roomManager.isUserOnlineInRoom('user-1', 'room-1');

      assert.strictEqual(isOnline, true);
    });

    it('should return false if user is in a different room', () => {
      roomManager.joinRoom('socket-1', 'room-1', { id: 'user-1', name: 'Alice' });

      const isOnline = roomManager.isUserOnlineInRoom('user-1', 'room-2');

      assert.strictEqual(isOnline, false);
    });

    it('should return false for non-existent room', () => {
      const isOnline = roomManager.isUserOnlineInRoom('user-1', 'non-existent-room');

      assert.strictEqual(isOnline, false);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove user from their room on disconnect', () => {
      roomManager.joinRoom('socket-1', 'room-1', { id: 'user-1', name: 'Alice' });
      roomManager.handleDisconnect('socket-1');

      const onlineUsers = roomManager.getOnlineUsersInRoom('room-1');

      assert.strictEqual(onlineUsers.length, 0);
    });

    it('should return room info and remaining users', () => {
      roomManager.joinRoom('socket-1', 'room-1', { id: 'user-1', name: 'Alice' });
      roomManager.joinRoom('socket-2', 'room-1', { id: 'user-2', name: 'Bob' });

      const result = roomManager.handleDisconnect('socket-1');

      assert.strictEqual(result.roomId, 'room-1');
      assert.strictEqual(result.remainingUsers.length, 1);
      assert.strictEqual(result.remainingUsers[0].name, 'Bob');
    });
  });

  describe('getUserRoom', () => {
    it('should return the room ID for a user', () => {
      roomManager.joinRoom('socket-1', 'room-1', { id: 'user-1', name: 'Alice' });

      const roomId = roomManager.getUserRoom('socket-1');

      assert.strictEqual(roomId, 'room-1');
    });

    it('should return null if user is not in any room', () => {
      const roomId = roomManager.getUserRoom('non-existent-socket');

      assert.strictEqual(roomId, null);
    });
  });

  describe('Room-based online status (key feature)', () => {
    it('users in same room should see each other as online', () => {
      roomManager.joinRoom('socket-1', 'room-1', { id: 'user-1', name: 'Alice' });
      roomManager.joinRoom('socket-2', 'room-1', { id: 'user-2', name: 'Bob' });

      // Both users are in room-1, so they can see each other
      const room1Users = roomManager.getOnlineUsersInRoom('room-1');
      assert.strictEqual(room1Users.length, 2);
      assert.ok(roomManager.isUserOnlineInRoom('user-1', 'room-1'));
      assert.ok(roomManager.isUserOnlineInRoom('user-2', 'room-1'));
    });

    it('users in different rooms should NOT see each other as online', () => {
      roomManager.joinRoom('socket-1', 'room-1', { id: 'user-1', name: 'Alice' });
      roomManager.joinRoom('socket-2', 'room-2', { id: 'user-2', name: 'Bob' });

      // Alice is in room-1, Bob is in room-2
      // From room-1 perspective: only Alice is online
      const room1Users = roomManager.getOnlineUsersInRoom('room-1');
      assert.strictEqual(room1Users.length, 1);
      assert.strictEqual(room1Users[0].name, 'Alice');

      // From room-2 perspective: only Bob is online
      const room2Users = roomManager.getOnlineUsersInRoom('room-2');
      assert.strictEqual(room2Users.length, 1);
      assert.strictEqual(room2Users[0].name, 'Bob');

      // Alice is NOT online in room-2, Bob is NOT online in room-1
      assert.strictEqual(roomManager.isUserOnlineInRoom('user-1', 'room-2'), false);
      assert.strictEqual(roomManager.isUserOnlineInRoom('user-2', 'room-1'), false);
    });

    it('connected user without joining a room should NOT be online anywhere', () => {
      // Simulate a connected user who hasn't joined any room
      // They should not appear online anywhere

      const room1Users = roomManager.getOnlineUsersInRoom('room-1');
      const room2Users = roomManager.getOnlineUsersInRoom('room-2');

      assert.strictEqual(room1Users.length, 0);
      assert.strictEqual(room2Users.length, 0);
    });
  });
});
