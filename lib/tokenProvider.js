const fetch = require('node-fetch');

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
    // If there's no token in memory, try to get one from database
    if (!this.currentToken) {
      this.currentToken = await db.getActiveToken();
      
      // If there's no token in database, error out
      if (!this.currentToken) throw new Error('Not authenticated. Please visit web app from browser.');
    }

    // If there's now a token in memory and it's not expired, return it
    if(this.currentToken && this.currentToken.expires_in_date > new Date()){
      return this.currentToken.access_token;
    }

    // We've got a token but it's expired. Let's refresh it and then return it.
    debug('Refreshing API token');
    const response = await fetch(config.oauth.heroku.tokenUrl, {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: this.currentToken.refresh_token,
        client_secret: config.oauth.secret
      }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.heroku+json; version=3',
      }
    });

    // Check for errors
    if (response.status !== 200){
      throw new Error(`${response.status} error refreshing token`, response);
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
