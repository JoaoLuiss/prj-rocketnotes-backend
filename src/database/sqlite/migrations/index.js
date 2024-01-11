const sqliteConnection = require('../../sqlite');
const createUsers = require('./createUsers');

/**
 * @deprecated Use the knex migrations insted at "/src/database/knex/index.js"
 */
async function migrationsRun() {
  const schemas = [createUsers].join('');

  sqliteConnection()
    .then((db) => db.exec(schemas))
    .catch((error) => console.error(error));
}

module.exports = migrationsRun;
