const EventEmitter = require('events');
const fetch = require('node-fetch');
const retry = require('async-retry');
const TokenProvider = require('./lib/tokenProvider');
const tokenProvider = new TokenProvider();

var debug = require('debug')('heroku-gauge:logStream');

// Creates and receives a Heroku app log stream
class LogStream extends EventEmitter {
  constructor(appName) {
    super();

    this.appName = appName;
  }

  async start() {
    // get a log stream
    try {
      debug(`Starting log stream`);
      await retry(async bail => {
        const resp = await this._createLogStream();

        if (resp.status >= 300 && resp.status !== 401) {
          bail(new Error(resp));
          return;
        }

        this.stream = resp;
      },{
        retries: 3
      });
    } catch (e) {

      console.log(`Error creating log stream`, e);
      debug(e.stack);
    }


    this.stream.setEncoding('utf8');
    
    // emit events for each chunk of new log data
    this.stream.on('data', logChunk => {
      this.emit('data', logChunk);
    });

    this.stream.on('end', async () => {
      console.log(`Log stream ended`);
      console.log(`Trying to recreate log stream.`);

      this.start();
    });

    this.stream.on('error', err => {
      console.log(`Error reading log stream`, err);
      // TODO: reopen log stream?
    });
  }

  // Create and return stream to logs
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
          'Authorization': `Bearer ${await tokenProvider.getActiveToken()}`          
        }
      });

      // Handle non-2xx HTTP responses
      if (logSessionResponse.status >= 300) {
        const err = new Error(`Error creating log session: ${logSessionResponse.status} ${await logSessionResponse.text()}`)
        err.status = logSessionResponse.status;
        throw err;
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
      throw e;
    }
  }
}

module.exports = LogStream;
