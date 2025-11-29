/**
 * Room Manager
 * 
 * This module manages users in rooms. Users are only considered "online" 
 * when they are in the same room as another user.
 * 
 * Key concept: A user is NOT globally online when they connect.
 * They only appear online to other users who are in the same room.
 */

class RoomManager {
  constructor() {
    // Map<roomId, Set<{id, name, socketId}>> - stores users per room
    this.rooms = new Map();
    
    // Map<socketId, {id, name, roomId}> - tracks user's current room
    this.users = new Map();
  }

  /**
   * User joins a room
   * @param {string} socketId - Socket connection ID
   * @param {string} roomId - Room ID to join
   * @param {Object} userInfo - User information { id, name }
   * @returns {Array} - List of users currently in the room (online users in this room)
   */
  joinRoom(socketId, roomId, userInfo) {
    // Leave any existing room first
    this.leaveCurrentRoom(socketId);

    // Initialize room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    const user = {
      id: userInfo.id,
      name: userInfo.name,
      socketId: socketId
    };

    // Add user to room
    this.rooms.get(roomId).add(user);

    // Track user's current room
    this.users.set(socketId, {
      ...userInfo,
      roomId: roomId
    });

    return this.getOnlineUsersInRoom(roomId);
  }

  /**
   * User leaves their current room
   * @param {string} socketId - Socket connection ID
   * @returns {Object|null} - The room left and remaining users, or null
   */
  leaveCurrentRoom(socketId) {
    const userData = this.users.get(socketId);
    if (!userData || !userData.roomId) {
      return null;
    }

    const roomId = userData.roomId;
    const room = this.rooms.get(roomId);

    if (room) {
      // Find and remove the user from the room
      for (const user of room) {
        if (user.socketId === socketId) {
          room.delete(user);
          break;
        }
      }

      // Clean up empty rooms
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    // Clear user's room assignment
    this.users.delete(socketId);

    return {
      roomId: roomId,
      remainingUsers: this.getOnlineUsersInRoom(roomId)
    };
  }

  /**
   * Get all online users in a specific room
   * Users are ONLY considered "online" within the context of a room
   * 
   * @param {string} roomId - Room ID
   * @returns {Array} - Array of users in the room
   */
  getOnlineUsersInRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return [];
    }

    return Array.from(room).map(user => ({
      id: user.id,
      name: user.name
    }));
  }

  /**
   * Check if a user is online in a specific room
   * Note: A user is NOT globally online - they are only online within a room context
   * 
   * @param {string} userId - User ID to check
   * @param {string} roomId - Room ID to check within
   * @returns {boolean} - True if user is in the specified room
   */
  isUserOnlineInRoom(userId, roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    for (const user of room) {
      if (user.id === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Handle user disconnect - remove from all rooms
   * @param {string} socketId - Socket connection ID
   * @returns {Object|null} - The room left and remaining users, or null
   */
  handleDisconnect(socketId) {
    return this.leaveCurrentRoom(socketId);
  }

  /**
   * Get the room a user is currently in
   * @param {string} socketId - Socket connection ID
   * @returns {string|null} - Room ID or null if not in a room
   */
  getUserRoom(socketId) {
    const userData = this.users.get(socketId);
    return userData ? userData.roomId : null;
  }
}

module.exports = RoomManager;
