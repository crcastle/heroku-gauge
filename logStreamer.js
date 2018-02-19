const LogStream = require('./logStream');
const WebSocketServer = require('./webSocketServer');
const TokenProvider = require('./lib/tokenProvider');
const tokenProvider = new TokenProvider();
const flyd = require('flyd');
const every = require('flyd/module/every');
const cacheUntil = require('./lib/cacheUntil');

const debug = require('debug')('heroku-gauge:logStreamer');

class LogStreamer {
  constructor(server) {
    this.server = server;
  }
  
  // Continuously check to see if config is available
  // When available, start the stream
  startCheckingForConfig() {
    const dataCheck = setInterval(() => {
      if (this.isConfigAvailable()) {
        clearInterval(dataCheck);
        this.startStream();
      }
    }, 5000);
  }

  startStream() {
    // Setup WebSocketServer
    const wss = new WebSocketServer(this.server);
    wss.setup();

    // Setup log stream
    const logStream = new LogStream(this.appName, this.apiToken);
    
    logStream.start()
    .then(() => {
      console.log('Sending log stream to WebSocket.');
    })
    .catch(e => {
      throw(e);
    });

    // Send log data to stream for processing
    const logs = flyd.stream();
    logStream.on('data', logData => {
      debug(`Got log message:`, logData);
      logs(logData);
    });

    // Process log data
    const DURATION = 1000;
    const trigger = every(DURATION);
    const logLineCount = flyd.map(this.processData, logs);
    const cache = cacheUntil(trigger, logLineCount);
    const linesPerDuration = flyd.map( (arr) => {
      return arr.reduce( (total, num) => total+num, 0);
    }, cache);

    flyd.on( r => debug(`Current rate: `, r, `per ${DURATION} ms`), linesPerDuration);

    // Send processed log data to WebSocket connections
    flyd.on( r => wss.send(r, err => {
      if (err) debug(`Error sending websocket message`, err);
    }), linesPerDuration);
  }
  
  // Receives log data and returns processed data suitable for the device
  // Overwrite this function to change what data is sent to the device
  processData(data) {
    return (data.match(/\n/g) || []).length;
  }

  // Check if data is available and set instance vars
  // TODO: implement
  isConfigAvailable() {
    // if data in database
    // console.log('LogStreamer found data in database');
    // this.app = app;
    // this.apiToken = apiToken;
    // return true;
    // else
    // return false;
    if (process.env['APP_NAME'] &&
        process.env['API_TOKEN'] &&
        tokenProvider.currentToken) {
      this.appName = process.env['APP_NAME'];
      this.apiToken = process.env['API_TOKEN'];
      return true;
    } else {
      return false;
    }
  }
}

module.exports = LogStreamer;
