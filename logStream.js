const EventEmitter = require('events');
const fetch = require('node-fetch');
var debug = require('debug')('heroku-gauge:logStream');

// Creates and receives a Heroku app log stream
class LogStream extends EventEmitter {
  constructor(appName, apiToken) {
    super();

    this.appName = appName;
    this.apiToken = apiToken;
  }

  async start() {
    // get a log stream
    let stream;
    try {
      debug(`Starting log stream`);
      stream = await this._createLogStream();
    } catch (e) {
      console.log(`Error creating log stream`, e);
      debug(e.stack);
    }
    
    // emit events for each chunk of new log data
    stream.setEncoding('utf8');
    stream.on('data', logChunk => {
      this.emit('data', logChunk);
    });

    stream.on('end', () => {
      debug(`Log stream ended`);
      // TODO: reopen log stream
    });

    stream.on('error', err => {
      console.log(`Error reading log stream`, err);
      // TODO: reopen log stream
    });
  }

  // Create and return stream to logs
  // TODO: handle stream disconnect
  async _createLogStream() {
    console.log(`Requesting log session for app ${this.appName}`);
    try {
      const logSessionResponse = await fetch(`https://api.heroku.com/apps/${this.appName}/log-sessions`, {
        method: 'POST',
        body: JSON.stringify({
          dyno: 'router',
          source: 'heroku',
          tail: true
        }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.heroku+json; version=3',
          'Authorization': `Bearer ${this.apiToken}`          
        }
      });

      // Handle HTTP error responses
      if (logSessionResponse.status >= 300) {
        throw new Error(`Error creating log session: ${logSessionResponse.status} ${await logSessionResponse.text()}`);
      }


      const logSession = await logSessionResponse.json();
      debug(`Got log session: `, logSession);
      
      if (logSession.logplex_url) {
        debug(`Requesting logplex URL: ${logSession.logplex_url}`);
        const logsResponse = await fetch(logSession.logplex_url);
        
        return logsResponse.body;
      } else {
        throw new Error('Invalid log session response');
      }

    } catch (e) {
      throw(e);
    }
  }
}

module.exports = LogStream;
