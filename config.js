
const heroku = {
  key: process.env['HEROKU_OAUTH_ID'],
  secret: process.env['HEROKU_OAUTH_SECRET'],
  scope: ['read'],
  callback: '/handle_heroku_callback',
}

const config = {
  production: {
    oauth: {
      server: {
        protocol: 'https',
        host: 'heroku-gauge.herokuapp.com',
        state: true,
        transport: 'session'
      },
      heroku
    }
  },

  development: {
    oauth: {
      server: {
        protocol: 'http',
        host: 'localhost:5000',
        state: true,
        transport: 'session',
      },
      heroku
    }
  }
}

module.exports = config;
