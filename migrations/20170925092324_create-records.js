'use strict'

exports.up = async (knex, Promise) => {
  return await knex.schema.hasTable('records').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('records', (t) => {
        t.string('recordId', 36).primary().notNullable()
        t.string('profileId', 36).notNullable()
        t.foreign('profileId').references('profiles.profileId')
        t.integer('order').notNullable()
        t.integer('preference').notNullable()
        t.integer('ttl').notNullable()
        t.string('domainName', 1024).notNullable()
        t.string('flags', 256).notNullable()
        t.string('service', 256).notNullable()
        t.string('regexp', 1024).notNullable()
        t.string('uri', 2048).notNullable()
        t.string('replacement', 2048).notNullable()
        t.string('partnerId', 255).nullable()
        t.boolean('countryCode').notNullable().defaultTo(false)
        t.timestamp('created').notNullable().defaultTo(knex.fn.now())
      })
    }
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('records')
}
