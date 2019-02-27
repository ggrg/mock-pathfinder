'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Generator = require(`${src}/lib/generator`)
const Model = require(`${src}/domain/profile/model`)
const RecordService = require(`${src}/domain/record`)
const ProfileService = require(`${src}/domain/profile`)

Test('Profile service', profileServiceTest => {
  let sandbox

  profileServiceTest.beforeEach((t) => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Model)
    sandbox.stub(Generator)
    sandbox.stub(RecordService)
    t.end()
  })

  profileServiceTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  profileServiceTest.test('create should', createTest => {
    createTest.test('persist profile to model', test => {
      let profileId = Uuid()
      let name = 'test'
      let tier = 2
      let records = [{ recordId: Uuid() }, { recordId: Uuid() }]

      Generator.generateId.returns(profileId)

      let savedProfile = {}
      Model.create.returns(P.resolve(savedProfile))

      RecordService.create.returns(P.resolve({}))

      ProfileService.create(name, tier, records)
        .then(s => {
          test.ok(Model.create.calledWith(sandbox.match({
            profileId,
            name,
            tier
          })))
          test.ok(RecordService.create.calledTwice)
          test.ok(RecordService.create.calledWith(sandbox.match({
            recordId: records[0].recordId,
            profileId: profileId
          })))
          test.ok(RecordService.create.calledWith(sandbox.match({
            recordId: records[1].recordId,
            profileId: profileId
          })))
          test.equal(s, savedProfile)
          test.end()
        })
    })

    createTest.end()
  })

  profileServiceTest.test('update should', updateTest => {
    updateTest.test('update records in profile', test => {
      let profileId = Uuid()
      let records = [{ recordId: Uuid() }, { recordId: Uuid() }]

      let profile = { profileId, tier: 2, name: 'Test-Profile' }
      Model.getById.returns(P.resolve(profile))

      RecordService.removeForProfileId.returns(P.resolve())
      RecordService.create.returns(P.resolve({}))

      ProfileService.update(profileId, records)
        .then(s => {
          test.ok(Model.getById.calledWith(profileId))
          test.ok(RecordService.removeForProfileId.calledWith(profileId))
          test.ok(RecordService.create.calledTwice)
          test.ok(RecordService.create.calledWith(sandbox.match({
            recordId: records[0].recordId,
            profileId: profileId
          })))
          test.ok(RecordService.create.calledWith(sandbox.match({
            recordId: records[1].recordId,
            profileId: profileId
          })))
          test.equal(s, profile)
          test.end()
        })
    })

    updateTest.end()
  })

  profileServiceTest.test('getById should', getByIdTest => {
    getByIdTest.test('return profile from model by id', test => {
      let profileId = Uuid()
      let profile = { profileId }
      Model.getById.withArgs(profileId).returns(P.resolve(profile))

      ProfileService.getById(profileId)
        .then(result => {
          test.equal(result, profile)
          test.end()
        })
    })

    getByIdTest.end()
  })

  profileServiceTest.test('getByName should', getByNameTest => {
    getByNameTest.test('return profile from model by name', test => {
      let name = 'profile1'
      let profile = { name }
      Model.getByName.withArgs(name).returns(P.resolve(profile))

      ProfileService.getByName(name)
        .then(result => {
          test.equal(result, profile)
          test.end()
        })
    })

    getByNameTest.end()
  })

  profileServiceTest.end()
})
