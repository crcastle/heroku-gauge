const fetch = require('node-fetch');

var config = require('../config.js')[process.env.NODE_ENV || 'development'];

const debug = require('debug')('heroku-gauge:tokenProvider');

var TokenProvider = (function(){
  function TokenProvider(){}

  TokenProvider.prototype.setToken = function(token) {
    this.currentToken = {
      access_token:    token.access_token,
      expires_in:      token.expires_in,
      expires_in_date: token.expires_in_date
    };

    if(this.currentToken && 'expires_in' in this.currentToken) {
      this.currentToken.expires_in_date = new Date(new Date().getTime() + (this.currentToken.expires_in * 1000));
    }
  };

  TokenProvider.prototype.setUrl = function(url) {
    this.url = url;
  };

  TokenProvider.prototype.getToken = async function() {
    if(this.currentToken && this.currentToken.expires_in_date > new Date()){
      return this.currentToken.access_token;
    }

    // Refresh the token
    debug('Refreshing API token');
    return fetch(this.tokenUrl, {
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
    })
    // Check for errors
    .then(response => {
      if (response.status !== 200) {
        throw new Error(`${response.status} error refreshing token`, response);
      }
    })
    .then(response => response.json())
    .then(json => {
      this.currentToken = json;
      this.currentToken.expires_in_date =
        new Date((new Date()).getTime() +  this.currentToken.expires_in * 1000);
      
      console.log(`Refreshed API access token`);
      return this.currentToken.acces_token;
    })
    .catch(err => {
      throw new Error(err);
    });
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
