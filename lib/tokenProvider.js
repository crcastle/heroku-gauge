const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

var config = require('../config.js')[process.env.NODE_ENV || 'development'];
var db = require('../db');

const debug = require('debug')('heroku-gauge:tokenProvider');

var TokenProvider = (function(){
  function TokenProvider(){}

  TokenProvider.prototype.setToken = async function(token) {
    if (!token) throw new Error('Must specify token');

    this.currentToken = {
      ...token,
      expires_in:      parseInt(token.expires_in),
      expires_in_date: token.expires_in_date
    };

    if(this.currentToken && 'expires_in' in this.currentToken) {
      this.currentToken.expires_in_date = new Date(new Date().getTime() + (this.currentToken.expires_in * 1000));
    }

    await db.setActiveToken(this.currentToken, config.oauth.heroku.tokenUrl);
  };

  TokenProvider.prototype.getActiveToken = async function() {
    if (!this.currentToken) {
      debug('No token in memory. Trying to get one from database.');
      this.currentToken = await db.getActiveToken();
      debug(`Got token %o`, this.currentToken);
      
      if (!this.currentToken) {
        debug(`ERROR: No token in database. Can't return a valid token.`);
        throw new Error('Not authenticated. Please visit web app from browser.');
      }
    }

    if(this.currentToken && new Date(this.currentToken.expires_in_date) > new Date()){
      debug(`Token in memory and not expired: %o`, this.currentToken);
      return this.currentToken.access_token;
    }

    // We've got a token but it's expired. Let's refresh it and then return it.
    debug(`Found token but it's expired. Refreshing.`);
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', this.currentToken.refresh_token);
    params.append('client_secret', config.oauth.heroku.secret);
    debug(`Refresh URL:`, config.oauth.heroku.tokenUrl);
    debug(`With params:`, params);
    const response = await fetch(config.oauth.heroku.tokenUrl, {
      method: 'POST',
      body: params.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // Check for errors
    if (response.status !== 200){
      debug(`Error response:`, await response.text());
      throw new Error(`${response.status} error refreshing token`);
    }

    const json = await response.json();

    this.currentToken = json;
    this.currentToken.expires_in_date =
      new Date((new Date()).getTime() + this.currentToken.expires_in * 1000);

    await db.setActiveToken(this.currentToken, config.oauth.heroku.tokenUrl);

    console.log(`Refreshed API access token`);
      
    return this.currentToken.access_token;
  };

  var instance;

  return function(opts) {
    if (!instance) {
      instance = new TokenProvider(opts);
    }
    return instance;
  };
})();

module.exports = TokenProvider;
