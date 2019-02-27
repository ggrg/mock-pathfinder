'use strict'

exports.up = async (knex, Promise) => {
  return await knex.schema.hasTable('profiles').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('profiles', (t) => {
        t.string('profileId', 36).primary().notNullable()
        t.string('name', 768).notNullable()
        t.integer('tier').notNullable()
        t.timestamp('created').notNullable().defaultTo(knex.fn.now())
      })
    }
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('profiles')
}
