
const heroku = {
  key: process.env['HEROKU_OAUTH_ID'],
  secret: process.env['HEROKU_OAUTH_SECRET'],
  scope: ['read'],
  callback: '/handle_heroku_callback',
  tokenUrl: 'https://id.heroku.com/oauth/token',
}

const config = {
  production: {
    oauth: {
      server: {
        protocol: 'https',
        host: 'heroku-gauge.herokuapp.com',
        state: true,
        // transport: 'session'
      },
      heroku
    },
    db: {
      url: process.env['DATABASE_URL']
    },
  },

  development: {
    oauth: {
      server: {
        protocol: 'http',
        host: 'localhost:5000',
        state: true,
        // transport: 'session',
      },
      heroku
    },
    db: {
      url: `postgres://postgres@localhost/postgres`
    },
  },
}

module.exports = config;
