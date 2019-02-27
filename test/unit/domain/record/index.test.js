'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Generator = require(`${src}/lib/generator`)
const Model = require(`${src}/domain/record/model`)
const Service = require(`${src}/domain/record`)

Test('Profile service', serviceTest => {
  let sandbox

  serviceTest.beforeEach((t) => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Model)
    sandbox.stub(Generator)
    t.end()
  })

  serviceTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  serviceTest.test('create should', createTest => {
    createTest.test('persist record to model', test => {
      let recordId = Uuid()

      Generator.generateId.returns(recordId)

      let payload = { profileId: 'profile-id', order: 1, preference: 10 }
      let savedRecord = { recordId }
      Model.create.returns(P.resolve(savedRecord))

      Service.create(payload)
        .then(s => {
          test.ok(Model.create.calledWith(sandbox.match({
            recordId,
            profileId: payload.profileId,
            order: payload.order,
            preference: payload.preference
          })))
          test.equal(s, savedRecord)
          test.end()
        })
    })

    createTest.end()
  })

  serviceTest.test('getByProfileId should', getByProfileIdTest => {
    getByProfileIdTest.test('return records from model by profile id', test => {
      let profileId = Uuid()
      let records = [{ recordId: '1', profileId }, { recordId: '2', profileId }]
      Model.getByProfileId.withArgs(profileId).returns(P.resolve(records))

      Service.getByProfileId(profileId)
        .then(found => {
          test.equal(found, records)
          test.end()
        })
    })

    getByProfileIdTest.end()
  })

  serviceTest.test('removeForProfileId should', removeForProfileIdTest => {
    removeForProfileIdTest.test('remove records from model for profile id', test => {
      let profileId = Uuid()
      let records = [{ recordId: '1', profileId }, { recordId: '2', profileId }]
      Model.removeForProfileId.withArgs(profileId).returns(P.resolve(records))

      Service.removeForProfileId(profileId)
        .then(removed => {
          test.equal(removed, records)
          test.end()
        })
    })

    removeForProfileIdTest.end()
  })

  serviceTest.end()
})
