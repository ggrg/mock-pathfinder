'use strict'

exports.up = async (knex, Promise) => {
  return await knex.schema.hasTable('phones').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('phones', (t) => {
        t.string('phoneId', 36).primary().notNullable()
        t.string('profileId', 36).notNullable()
        t.foreign('profileId').references('profiles.profileId')
        t.string('number', 14).notNullable()
        t.string('countryCode', 3).notNullable()
        t.string('status', 10).notNullable()
        t.timestamp('created').notNullable().defaultTo(knex.fn.now())
      })
    }
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('phones')
}
