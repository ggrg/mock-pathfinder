'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Db = require(`${src}/lib/db`)
const Model = require(`${src}/domain/phone/model`)

Test('Phone model', modelTest => {
  let sandbox

  modelTest.beforeEach((t) => {
    sandbox = Sinon.createSandbox()

    Db.phones = {
      insert: sandbox.stub(),
      findOne: sandbox.stub(),
      destroy: sandbox.stub(),
      find: sandbox.stub(),
      update: sandbox.stub()
    }

    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload and return new phone', test => {
      let payload = { phoneId: 'phone-id', profileId: 'profile-id', number: '5558675309', countryCode: '1', status: 'active' }
      let insertedPhone = { phoneId: payload.phoneId }

      Db.phones.insert.returns(P.resolve(insertedPhone))

      Model.create(payload)
        .then(s => {
          test.ok(Db.phones.insert.withArgs(payload).calledOnce)
          test.equal(s, insertedPhone)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.test('update should', updateTest => {
    updateTest.test('update with fields and return updated phone', test => {
      let phoneId = 'phone-id'
      let fields = { profileId: 'profile-id', status: 'active' }
      let updatedPhone = { phoneId }

      Db.phones.update.returns(P.resolve(updatedPhone))

      Model.update(phoneId, fields)
        .then(s => {
          test.ok(Db.phones.update.withArgs(sandbox.match({ phoneId }), fields).calledOnce)
          test.equal(s, updatedPhone)
          test.end()
        })
    })

    updateTest.end()
  })

  modelTest.test('removeById should', removeByIdTest => {
    removeByIdTest.test('remove phone by id', test => {
      let phoneId = 'phone-id'
      let phone = {}

      Db.phones.destroy.returns(P.resolve(phone))

      Model.removeById(phoneId)
        .then(removed => {
          test.equal(removed, phone)
          test.ok(Db.phones.destroy.calledWith(Sinon.match({ phoneId })))
          test.end()
        })
    })

    removeByIdTest.end()
  })

  modelTest.test('getByNumber should', getByNumberTest => {
    getByNumberTest.test('query phones by number', test => {
      let number = '5558675309'
      let countryCode = '1'
      let phone = {}

      Db.phones.findOne.returns(P.resolve(phone))

      Model.getByNumber(number, countryCode)
        .then(result => {
          test.equal(result, phone)
          test.ok(Db.phones.findOne.calledWith(Sinon.match({ number, countryCode })))
          test.end()
        })
    })

    getByNumberTest.end()
  })

  modelTest.test('getByProfileId should', getByProfileIdTest => {
    getByProfileIdTest.test('query phones by profile id', test => {
      let profileId = 'profileId'
      let phone = { profileId }

      Db.phones.find.returns(P.resolve([phone]))

      Model.getByProfileId(profileId)
        .then(result => {
          test.equal(result.length, 1)
          test.equal(result[0], phone)
          test.ok(Db.phones.find.calledWith(Sinon.match({ profileId }), { order: 'created asc' }))
          test.end()
        })
    })

    getByProfileIdTest.end()
  })

  modelTest.end()
})
