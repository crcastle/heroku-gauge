var WebSocket = require('ws');
var EventEmitter = require('events');
var url = require('url');
var debug = require('debug')('heroku-gauge:webSocketServer');

class WebSocketServer extends EventEmitter {
  constructor(server) {
    super();
    this.wss = new WebSocket.Server({ server });
  }

  setup() {
    this.wss.on('connection', (ws, req) => {
      if (!this.clientIsAllowed(req)) {
        return ws.terminate();
      }

      console.log('WebSocket connected');

      ws.isAlive = true;

      ws.on('pong', () => {
        console.log(`Received pong`);
        ws.isAlive = true;
      });

      ws.on('ping', () => {
        console.log(`Received ping`);
        ws.isAlive = true;
      })

      ws.on('error', err => {
        console.log(`WebSocket error`, err);
      });

      ws.on('close', function close() {
        console.log('WebSocket disconnected');
      });

      // For debugging
      ws.on('message', msg => {
        debug(`Received message:`, msg);
      });
    });

    setInterval(() => {
      this.wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();

        ws.isAlive = false;
        console.log(`Sending ping`);
        ws.ping(() => {});
      });
    }, 20000);

    return this;
  }

  send(data) {
    this.wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // Authenticate the client request with pre-shared token
  // only if token is defined as env var
  clientIsAllowed(req) {
      const query = url.parse(req.url, true).query;
      if (process.env['DEVICE_TOKEN'] && query.token !== process.env['DEVICE_TOKEN']) {
        console.log(`WebSocket client not allowed`);
        return false;
      }
      return true;
  }
}

module.exports = WebSocketServer;
