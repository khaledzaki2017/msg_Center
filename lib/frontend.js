const socketio = require("socket.io");
const express = require("express");
const api = require("./api");

const groups = require("./socketgroups");

// Express server  to serve socket.io requests.
function createRealtimeServer(storage, sslOptions, socketOptions) {
  // sockets are added on connection, and removed on disconnect.
  const authenticatedClients = new groups.SocketGroup(storage);

  const server = express.createServer();

  // serve clientside code
  server.use("/client", express.static(`${__dirname}/../client`));

  let socketSettings = {
    "log level": 0, // disable logging debug messages.
    "match origin protocol": true, // fixes SSL termination in Safari
  };

  const io = socketio.listen(server, socketSettings);

  const auth = new api.AuthorizationHandler(storage);

  function setupConnection(socket) {
    socket.on("announce-authentication", (authData) => {
      // validate token and authorize user
      auth.authenticate(authData.authString, (userId) => {
        if (!userId) {
          socket.emit("announce-authentication-response", {
            status: "failed",
          });
          return;
        }
        const currentClient = authenticatedClients.addForClient(userId, socket);
        // return a response successful.
        socket.emit("announce-authentication-response", {
          status: "success",
        });

        socket.on("disconnect", () => {
          // on disconnect, remove user ID
          authenticatedClients.removeForClient(userId, socket);
        });
      });
    });
  }

  io.sockets.on("connection", setupConnection);
  return {
    server: server,
    authenticatedClients: authenticatedClients,
    createRealtimeServer: createRealtimeServer,
    io: io,
  };
}

module.exports.createRealtimeServer = createRealtimeServer;
