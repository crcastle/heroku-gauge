var WebSocket = require('ws');
var EventEmitter = require('events');
var debug = require('debug')('heroku-gauge:webSocketServer');

class WebSocketServer extends EventEmitter {
  constructor(server) {
    super();
    this.wss = new WebSocket.Server({ server });
  }

  setup() {
    this.wss.on('connection', (ws, req) => {
      console.log('WebSocket connected');

      ws.isAlive = true;

      ws.on('pong', () => { ws.isAlive = true; });

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
}

module.exports = WebSocketServer;
