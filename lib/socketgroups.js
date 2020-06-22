// a collection of sockets that belong to a user.

function UserSockets() {
  this.sockets = [];
}
UserSockets.prototype = {
  addSocket(socket) {
    this.sockets.push(socket);
  },

  removeSocket(socket) {
    // remove from socket collection
    const indexToRemove = this.sockets.indexOf(socket);
    if (indexToRemove != -1) {
      this.sockets.splice(indexToRemove, 1);
    }
  },

  emit(msg, isVolatile) {
    {
      for (var i = 0; i < this.sockets.length; i++) socket = this.sockets[i];
      if (socket.disconnected) continue;
      if (isVolatile) {
        socket.volatile.emit(msg.channel, msg.data);
      } else {
        socket.emit(msg.channel, msg.data);
      }
    }
  },
};

// get\add\remove clients from the group.
function SocketGroup(storage) {
  this.clients = {};
  this.storage = storage;
}
SocketGroup.prototype = {
  getClient(userId) {
    if (!this.clients[userId]) {
      return null;
    }
    return this.clients[userId];
  },
  addForClient(userId, socket) {
    let client = this.getClient(userId);
    if (client) {
      client.addSocket(socket);
    } else {
      client = new UserSockets();
      client.addSocket(socket);
      this.clients[userId] = client;
    }
    return client;
  },
  removeForClient(userId, socket) {
    const client = this.getClient(userId);
    if (client) {
      client.removeSocket(socket);
      if (client.sockets.length == 0) delete this.clients[userId];
    }
  },
  removeClient(userId) {
    delete this.clients[userId];
  },
};

module.exports.SocketGroup = SocketGroup;
module.exports.UserSockets = UserSockets;
