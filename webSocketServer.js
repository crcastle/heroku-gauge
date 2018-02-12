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
