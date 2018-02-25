const { Pool } = require('pg');
const debug = require('debug')('heroku-gauge:db');

const config = require('../config')[process.env.NODE_ENV || 'development'];

const pool = new Pool({
  connectionString: config.db.url,
  // ssl: true,
});

module.exports = {
  pool: pool,

  query: (text, params) => pool.query(text, params),

  getActiveConfiguration: () => {
    const query = 'SELECT * FROM configuration WHERE active = TRUE LIMIT 1;';
    debug('Running SQL:', query);
    return pool.query(query)
      .then(res => res.rows[0] || {})
      .catch(e => { throw e });
  },

  getActiveToken: () => {
    const query = 'SELECT oauth_token FROM configuration WHERE active = TRUE LIMIT 1;';
    debug('Running SQL:', query);
    return pool.query(query)
      .then(res => res.rows[0].oauth_token)
      .catch(e => { throw e });
  },

  setActiveToken: (token, url) => {
    debug(`Setting active token with token`,token,`and url`,url);
    if (!token || !url) throw new Error('Missing token or url');

    const query = `
      UPDATE configuration SET active = FALSE;

      INSERT INTO configuration (oauth_token, refresh_url, active)
      VALUES (
        '${JSON.stringify(token)}',
        '${url}',
        TRUE
      );
    `;
    debug('Running SQL:', query);

    return pool.query(query);
  },

  saveConfiguration: async (opts) => {
    const missingOption = !opts.appName || !opts.deviceName || !opts.deviceToken || !opts.hostname;
    if (missingOption) throw new Error('Missing or undefined configuration value');
    
    const query = `
      UPDATE configuration
        SET
          app_name = '${opts.appName}',
          device_name = '${opts.deviceName}',
          device_token = '${opts.deviceToken}',
          hostname = '${opts.hostname}'
        WHERE active = TRUE;
    `;
    debug('Running SQL:', query);

    return pool.query(query);
  },

  initializeDatabase: async () => {
    // create session table
    console.log('(Re)creating "session" table');

    await pool.query(`
      DROP TABLE IF EXISTS "session" CASCADE;

      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);

      ALTER TABLE "session"
        DROP CONSTRAINT IF EXISTS "session_pkey";

      ALTER TABLE "session"
        ADD CONSTRAINT "session_pkey"
        PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;`
    );
    
    // Create user configuration table
    console.log('(Re)creating "configuration" table');

    await pool.query(`
      DROP TABLE IF EXISTS "configuration" CASCADE;

      CREATE TABLE IF NOT EXISTS "configuration" (
        "id" serial PRIMARY KEY,
        "oauth_token" json NOT NULL,
        "refresh_url" varchar NOT NULL,
        "app_name" varchar,
        "device_name" varchar,
        "device_token" varchar,
        "hostname" varchar,
        "active" bool NOT NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT current_timestamp,
        "updated_at" timestamp with time zone NOT NULL DEFAULT current_timestamp
      );
      
      CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS trigger
          LANGUAGE plpgsql
          AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
      $$;
      
      DROP TRIGGER IF EXISTS t1_updated_at_modtime ON configuration;
      CREATE TRIGGER t1_updated_at_modtime BEFORE UPDATE ON configuration FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();`
    );
  },
}
