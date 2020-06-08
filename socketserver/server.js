// Test basic socket server
// TO DO
//not used
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 3000;

const app = express();
const config = {
  path: "/socket",
  origins: "*:*",
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
};
const server = http.createServer(app);
const io_server = socketIo(server, config);

server.listen(port, () => console.log(`Listening on port ${port}`));

io_server.on("connection", function (socket) {
  console.log("Client websocket connected");
  socket.emit("aaa_response", { hello: "world" });

  socket.on("aaa_response", (data) => {});
});
process.on("uncaughtException", function (err) {
  console.log(err);
});
export default io_server;
