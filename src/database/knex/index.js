const config = require('../../../knexfile');
const knex = require('knex');
const knexConnection = knex(config.development);

async function knexMigrationsRun() {
  try {
    console.log('Running migrations...');
    await knexConnection.migrate.latest();
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Error running migrations: ', error);
  }
}

module.exports = knexConnection;
module.exports.knexMigrationsRun = knexMigrationsRun;
