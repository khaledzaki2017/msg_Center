const express = require("express");
// const http = require("http");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
// const server = http.createServer(app);
const uuid = require("node-uuid");
function createAPIServer(storage) {
  // setup an Express HTTP server to handle API requests.
  const auth = new AuthorizationHandler(storage);
  const handler = new EventHandler(storage);
  const internalServer = app; // given a user ID, return a new token ID.

  internalServer.post("/auth/token/:userId", (req, res) => {
    auth.getToken(req.params.userId, (token) => {
      res.json(
        {
          token: token,
        },
        201
      );
    });
  });
  internalServer.post("/emit/user/:userId/:channel", (req, res) => {
    const p = req.params;
    handler.emit(p.userId, p.channel, req.body, () => {
      res.send(204);
    });
  }); // broadcast to all users on the given channel, with the data.

  internalServer.post("/emit/broadcast/:channel", (req, res) => {
    const p = req.params;
    handler.broadcast(p.channel, req.body, () => {
      res.send(204);
    });
  });
  return internalServer;
}

// handle user\token generation and authorization.
function AuthorizationHandler(storage) {
  this.storage = storage;
  this.tokenPrefix = "announce:token:";
}
AuthorizationHandler.prototype = {
  // set a UUID token and map it to a user ID.
  getToken(userId, next) {
    let storage = this.storage;
    const key = this.tokenPrefix + userId;
    let token = null;
    storage.get(key, (err, reply) => {
      // no token found for the user
      if (!reply) {
        token = uuid.v4();
        token = token.replace(/-+/g, "");
        storage.set(key, token);
      } else {
        token = reply;
      }
      next(token);
    });
  },

  // given a token, return the user ID.
  // if no user is found for the token, return null.
  authenticateRequest(userId, token, next) {
    if (!token || !userId) {
      next(null);
      return;
    }
    const key = this.tokenPrefix + userId;
    this.storage.get(key, (err, reply) => {
      if (!reply) {
        next(null);
        return;
      }
      if (reply == token) {
        next(userId);
        return;
      }
      next(null);
      return;
    });
  },

  authenticate(authData, next) {
    if (!authData) {
      next(null);
      return;
    }
    const authParts = authData.split("|");
    const userId = authParts[0];
    const token = authParts[1];
    if (!userId || !token) {
      next(null);
      return;
    }
    this.authenticateRequest(userId, token, next);
  },
};

// publishing events over pub\sub channel.
function EventHandler(storage) {
  this.storage = storage;
  this.channel = "announce:event_listener";
}
EventHandler.prototype = {
  emit(userId, clientChannel, data, next) {
    const msg = {
      type: "user",
      userId: userId,
      channel: clientChannel,
      data: data,
    };
    this.storage.publish(this.channel, JSON.stringify(msg), () => {
      if (next !== undefined) next();
    });
  },

  broadcast(clientChannel, data, next) {
    const msg = {
      type: "broadcast",
      channel: clientChannel,
      data: data,
    };
    this.storage.publish(this.channel, JSON.stringify(msg), () => {
      if (next !== undefined) next();
    });
  },
};

// export API
module.exports.AuthorizationHandler = AuthorizationHandler;
module.exports.EventHandler = EventHandler;
module.exports.createAPIServer = createAPIServer;
module.exports;
