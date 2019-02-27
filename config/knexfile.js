'use strict'

const migrationsDirectory = '../migrations'
const Config = require('../src/lib/config')

module.exports = {
  client: 'mysql',
  version: '5.5',
  connection: Config.DATABASE_URI,
  migrations: {
    directory: migrationsDirectory,
    tableName: 'migration',
    stub: `${migrationsDirectory}/migration.template`
  }
}
