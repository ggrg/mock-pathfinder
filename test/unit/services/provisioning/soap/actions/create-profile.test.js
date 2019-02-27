'use strict'

const src = '../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const ProfileService = require(`${src}/domain/profile`)
const SoapErrors = require(`${src}/services/provisioning/soap/errors`)
const SoapRequestMapper = require(`${src}/services/provisioning/soap/actions/mappers/request`)
const SoapResult = require(`${src}/services/provisioning/soap/actions/result`)
const SoapValidation = require(`${src}/services/provisioning/soap/actions/validation`)
const SoapCreateProfile = require(`${src}/services/provisioning/soap/actions/create-profile`)

Test('SoapCreateProfile', soapCreateProfileTest => {
  let sandbox

  soapCreateProfileTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(SoapResult, 'build')
    sandbox.stub(SoapRequestMapper, 'mapToCreateUpdateProfileRequest')
    sandbox.stub(SoapValidation, 'validateCreateUpdateProfileRequest')
    sandbox.stub(ProfileService)
    t.end()
  })

  soapCreateProfileTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  soapCreateProfileTest.test('execute should', executeTest => {
    executeTest.test('create profile and return result', test => {
      let params = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2 }

      SoapValidation.validateCreateUpdateProfileRequest.returns(P.resolve())
      ProfileService.getByName.returns(P.resolve(null))
      ProfileService.create.returns(P.resolve({}))

      let request = { profileName: params.ProfileID, tier: params.tier, records: [] }
      SoapRequestMapper.mapToCreateUpdateProfileRequest.returns(P.resolve(request))

      let result = {}
      SoapResult.build.returns(result)

      SoapCreateProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateCreateUpdateProfileRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToCreateUpdateProfileRequest.calledWith(params))
          test.ok(ProfileService.getByName.calledWith(request.profileName))
          test.ok(ProfileService.create.calledWith(request.profileName, request.tier, request.records))
          test.ok(SoapResult.build.calledWith(201, params.TransactionID, ['Created', `Profile ${request.profileName} successfully created`]))
          test.end()
        })
    })

    executeTest.test('return error if no TransactionID present', test => {
      let params = { ProfileID: 'TestProfile', Tier: 2 }

      let result = {}
      SoapResult.build.returns(result)

      SoapCreateProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapResult.build.calledWith(420, 0, ['Invalid Value', 'Invalid or null transaction ID - null']))
          test.end()
        })
    })

    executeTest.test('return error if proflie already exists', test => {
      let params = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2 }

      let found = {}
      SoapValidation.validateCreateUpdateProfileRequest.returns(P.resolve())
      ProfileService.getByName.returns(P.resolve(found))

      let request = { profileName: params.ProfileID, tier: params.tier, records: [] }
      SoapRequestMapper.mapToCreateUpdateProfileRequest.returns(P.resolve(request))

      let result = {}
      SoapResult.build.returns(result)

      SoapCreateProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateCreateUpdateProfileRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToCreateUpdateProfileRequest.calledWith(params))
          test.ok(ProfileService.getByName.calledWith(request.profileName))
          test.ok(SoapResult.build.calledWith(420, params.TransactionID, ['Invalid Value', 'Profile already exists']))
          test.end()
        })
    })

    executeTest.test('return error if validation error thrown', test => {
      let params = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2 }

      let validationError = new SoapErrors.InvalidValueError('Invalid DNS Profile Id length')
      SoapValidation.validateCreateUpdateProfileRequest.returns(P.reject(validationError))

      let result = {}
      SoapResult.build.returns(result)

      SoapCreateProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateCreateUpdateProfileRequest.calledWith(params))
          test.ok(SoapResult.build.calledWith(validationError.code, params.TransactionID, [validationError.name, validationError.message]))
          test.end()
        })
    })

    executeTest.test('return error if unknown error', test => {
      let params = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2 }

      SoapValidation.validateCreateUpdateProfileRequest.returns(P.resolve())

      let request = { profileName: params.ProfileID, tier: params.tier, records: [] }
      SoapRequestMapper.mapToCreateUpdateProfileRequest.returns(P.resolve(request))

      let error = new Error('Bad stuff')
      let reject = P.reject(error)
      reject.catch(() => {})
      ProfileService.getByName.returns(reject)

      let result = {}
      SoapResult.build.returns(result)

      SoapCreateProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateCreateUpdateProfileRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToCreateUpdateProfileRequest.calledWith(params))
          test.ok(ProfileService.getByName.calledWith(request.profileName))
          test.ok(SoapResult.build.calledWith(500, 0, ['Unknown Error', error.message]))
          test.end()
        })
    })

    executeTest.end()
  })

  soapCreateProfileTest.end()
})
