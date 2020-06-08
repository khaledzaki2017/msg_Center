const fs = require("fs");
const api = require("./lib/api");
const frontend = require("./lib/frontend");
const listener = require("./lib/listener");

// initialize settings with  default values.
const settings = {
  storage: "redis",
  redisHost: "localhost",
  redisPort: 6379,
  redisPassword: null,
  apiHost: "localhost",
  apiPort: 6600,
  socketHost: "0.0.0.0",
  socketPort: 5500,
  sslKey: null,
  sslCert: null,
  isVolatile: false,
};

// get a storage instance
if (settings.storage == "redis") {
  console.log("storage backend: Redis");
  const storageBackend = require("./lib/storage/redis");
} else {
  console.log("storage backend must be redis");
  process.exit(1);
}

const storage = new storageBackend.Storage(settings);

// initialize API server
const apiServer = api.createAPIServer(storage);
apiServer.listen(settings.apiPort, settings.apiHost);
console.log(
  `Started API server on host: ${settings.apiHost}, port: ${settings.apiPort}`
);

const frontEndServer = frontend.createRealtimeServer(storage);

// initialize the external socket.io server
frontEndServer.server.listen(settings.socketPort, settings.socketHost);
console.log(
  `Started socket.io API on host: ${settings.socketHost}, port: ${settings.socketPort}`
);

// start listening on events
listener.bindEventListener(
  storage,
  frontEndServer.io,
  frontEndServer.authenticatedClients,
  settings.isVolatile
);
console.log("Started pub/sub listener");
