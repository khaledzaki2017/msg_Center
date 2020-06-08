const api = require("./api");

// bind to pub/sub listener.
function bindEventListener(storage, io, authenticatedClients, isVolatile) {
  const auth = new api.AuthorizationHandler(storage);

  storage.subscribe("announce:event_listener");
  storage.on("message", (channel, msg) => {
    msg = JSON.parse(msg);
    switch (msg.type) {
      // sockets that belong to a specific user
      case "user":
        const client = authenticatedClients.getClient(msg.userId);
        if (client) client.emit(msg, isVolatile);
        break;

      // emit to all the connected sockets in the system.
      case "broadcast":
        // broadcast to all sockets.
        if (!io.sockets) return;
        if (isVolatile) {
          io.sockets.volatile.emit(msg.channel, msg.data);
        } else {
          io.sockets.emit(msg.channel, msg.data);
        }
        break;
    }
  });
}
module.exports.bindEventListener = bindEventListener;
