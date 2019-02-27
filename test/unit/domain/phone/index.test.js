'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Generator = require(`${src}/lib/generator`)
const Model = require(`${src}/domain/phone/model`)
const PhoneService = require(`${src}/domain/phone`)

Test('Phone service', phoneServiceTest => {
  let sandbox

  phoneServiceTest.beforeEach((t) => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Model)
    sandbox.stub(Generator)
    t.end()
  })

  phoneServiceTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  phoneServiceTest.test('create should', createTest => {
    createTest.test('persist phone to model', test => {
      let phoneId = Uuid()
      let number = '5558675309'
      let countryCode = '1'
      let profileId = Uuid()
      let status = 'active'

      Generator.generateId.returns(phoneId)

      let savedPhone = {}
      Model.create.returns(P.resolve(savedPhone))

      PhoneService.create(number, countryCode, profileId, status)
        .then(s => {
          test.ok(Model.create.calledWith(sandbox.match({
            phoneId,
            number,
            countryCode,
            profileId,
            status
          })))
          test.equal(s, savedPhone)
          test.end()
        })
    })

    createTest.end()
  })

  phoneServiceTest.test('update should', updateTest => {
    updateTest.test('update phone to model', test => {
      let phoneId = Uuid()
      let fields = { profileId: Uuid(), status: 'active' }

      let updatedPhone = {}
      Model.update.returns(P.resolve(updatedPhone))

      PhoneService.update(phoneId, fields)
        .then(s => {
          test.ok(Model.update.calledWith(phoneId, fields))
          test.equal(s, updatedPhone)
          test.end()
        })
    })

    updateTest.end()
  })

  phoneServiceTest.test('removeById should', removeByIdTest => {
    removeByIdTest.test('remove phone from model by id', test => {
      let phoneId = Uuid()
      let phone = { phoneId }
      Model.removeById.withArgs(phoneId).returns(P.resolve(phone))

      PhoneService.removeById(phoneId)
        .then(removed => {
          test.equal(removed, phone)
          test.end()
        })
    })

    removeByIdTest.end()
  })

  phoneServiceTest.test('getByNumber should', getByNumberTest => {
    getByNumberTest.test('return phone from model by number', test => {
      let number = '5558675309'
      let countryCode = '1'
      let phone = { number, countryCode }
      Model.getByNumber.withArgs(number, countryCode).returns(P.resolve(phone))

      PhoneService.getByNumber(number, countryCode)
        .then(result => {
          test.equal(result, phone)
          test.end()
        })
    })

    getByNumberTest.end()
  })

  phoneServiceTest.test('getByProfileId should', getByProfileIdTest => {
    getByProfileIdTest.test('return phones from model by profile id', test => {
      let profileId = 'profile-id'
      let phone = { profileId }
      Model.getByProfileId.withArgs(profileId).returns(P.resolve([phone]))

      PhoneService.getByProfileId(profileId)
        .then(result => {
          test.equal(result.length, 1)
          test.equal(result[0], phone)
          test.end()
        })
    })

    getByProfileIdTest.end()
  })

  phoneServiceTest.end()
})
