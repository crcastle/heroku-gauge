const EventEmitter = require('events');
const fetch = require('node-fetch');
const axios = require('axios');
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
      debug(`Error creating log stream`, e);
      process.exit(1);
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
      // logSession = await axios.post(`https://api.heroku.com/apps/${this.appName}/log-sessions`, {
      //   headers: {
      //     'content-type': 'application/json',
      //     'accept': 'application/vnd.heroku+json; version=3',
      //     'authorization': `Bearer ${this.apiToken}`
      //   },
      //   data: {
      //     dyno: 'router',
      //     source: 'heroku',
      //     tail: true
      //   }
      // });
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
      })
      const logSession = await logSessionResponse.json();

      debug(`Got log session: `, logSession);
      
      if (logSession.logplex_url) {
        debug(`Requesting logplex URL: ${logSession.logplex_url}`);
        const logsResponse = await fetch(logSession.logplex_url);
        
        return logsResponse.body;
      } else {
        throw new Error('Invalid log session');
      }

    } catch (e) {
      debug(e);
      process.exit(1);
      // throw(e);
    }
  }
}

module.exports = LogStream;
