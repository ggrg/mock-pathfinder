'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Db = require(`${src}/lib/db`)
const Model = require(`${src}/domain/profile/model`)

Test('Profile model', modelTest => {
  let sandbox

  modelTest.beforeEach((t) => {
    sandbox = Sinon.createSandbox()

    Db.profiles = {
      insert: sandbox.stub(),
      findOne: sandbox.stub()
    }

    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload and return new profile', test => {
      let payload = { profileId: 'profile-id', name: 'test-proile', tier: 2 }
      let insertedProfile = { profileId: 'id' }

      Db.profiles.insert.returns(P.resolve(insertedProfile))

      Model.create(payload)
        .then(s => {
          test.ok(Db.profiles.insert.withArgs(payload).calledOnce)
          test.equal(s, insertedProfile)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.test('getById should', getByIdTest => {
    getByIdTest.test('query profile by id', test => {
      let profileId = 'profile-id'
      let profile = {}

      Db.profiles.findOne.returns(P.resolve(profile))

      Model.getById(profileId)
        .then(result => {
          test.equal(result, profile)
          test.ok(Db.profiles.findOne.calledWith(Sinon.match({ profileId })))
          test.end()
        })
    })

    getByIdTest.end()
  })

  modelTest.test('getByName should', getByNameTest => {
    getByNameTest.test('query profile by name', test => {
      let name = 'profile'
      let profile = {}

      Db.profiles.findOne.returns(P.resolve(profile))

      Model.getByName(name)
        .then(result => {
          test.equal(result, profile)
          test.ok(Db.profiles.findOne.calledWith(Sinon.match({ name })))
          test.end()
        })
    })

    getByNameTest.end()
  })

  modelTest.end()
})
