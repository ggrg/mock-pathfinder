'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Db = require(`${src}/lib/db`)
const Model = require(`${src}/domain/record/model`)

Test('Profile model', modelTest => {
  let sandbox

  modelTest.beforeEach((t) => {
    sandbox = Sinon.createSandbox()

    Db.records = {
      insert: sandbox.stub(),
      query: sandbox.stub(),
      destroy: sandbox.stub()
    }

    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload and return new record', test => {
      let payload = { recordId: 'record-id', profileId: 'profile-id' }
      let insertedRecord = { recordId: 'record-id' }

      Db.records.insert.returns(P.resolve(insertedRecord))

      Model.create(payload)
        .then(s => {
          test.ok(Db.records.insert.withArgs(payload).calledOnce)
          test.equal(s, insertedRecord)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.test('getByProfileId should', getByProfileIdTest => {
    getByProfileIdTest.test('find records for a profile id and order', test => {
      let profileId = 'profile-id'
      let records = [{ recordId: '1' }, { recordId: '2' }]

      let builderStub = sandbox.stub()
      let orderBy1Stub = sandbox.stub()
      let orderBy2Stub = sandbox.stub()

      builderStub.where = sandbox.stub()

      Db.records.query.callsArgWith(0, builderStub)
      Db.records.query.returns(P.resolve(records))

      builderStub.where.returns({
        orderBy: orderBy1Stub.returns({
          orderBy: orderBy2Stub
        })
      })

      Model.getByProfileId(profileId)
        .then(found => {
          test.equal(found, records)
          test.ok(builderStub.where.calledWith(sandbox.match({ profileId })))
          test.ok(orderBy1Stub.calledWith('order', 'asc'))
          test.ok(orderBy2Stub.calledWith('preference', 'asc'))
          test.end()
        })
    })

    getByProfileIdTest.end()
  })

  modelTest.test('removeForProfileId should', removeForProfileIdTest => {
    removeForProfileIdTest.test('remove records for a profile id', test => {
      let profileId = 'profile-id'
      let records = [{ recordId: '1' }, { recordId: '2' }]

      Db.records.destroy.returns(P.resolve(records))

      Model.removeForProfileId(profileId)
        .then(removed => {
          test.equal(removed, records)
          test.ok(Db.records.destroy.calledWith(sandbox.match({ profileId })))
          test.end()
        })
    })

    removeForProfileIdTest.end()
  })

  modelTest.end()
})
