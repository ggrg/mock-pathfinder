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
const SoapUpdateProfile = require(`${src}/services/provisioning/soap/actions/update-profile`)

Test('SoapUpdateProfile', soapUpdateProfileTest => {
  let sandbox

  soapUpdateProfileTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(SoapResult, 'build')
    sandbox.stub(SoapRequestMapper, 'mapToCreateUpdateProfileRequest')
    sandbox.stub(SoapValidation, 'validateCreateUpdateProfileRequest')
    sandbox.stub(ProfileService)
    t.end()
  })

  soapUpdateProfileTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  soapUpdateProfileTest.test('execute should', executeTest => {
    executeTest.test('update profile records and return result', test => {
      let params = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2 }

      let foundProfile = { profileId: 'profile-id' }

      SoapValidation.validateCreateUpdateProfileRequest.returns(P.resolve())
      ProfileService.getByName.returns(P.resolve(foundProfile))
      ProfileService.update.returns(P.resolve({}))

      let request = { profileName: params.ProfileID, tier: params.tier, records: [{}, {}] }
      SoapRequestMapper.mapToCreateUpdateProfileRequest.returns(P.resolve(request))

      let result = {}
      SoapResult.build.returns(result)

      SoapUpdateProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateCreateUpdateProfileRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToCreateUpdateProfileRequest.calledWith(params))
          test.ok(ProfileService.getByName.calledWith(request.profileName))
          test.ok(ProfileService.update.calledWith(foundProfile.profileId, request.records))
          test.ok(SoapResult.build.calledWith(200, params.TransactionID, ['OK', `Profile ${request.profileName} successfully updated`]))
          test.end()
        })
    })

    executeTest.test('return error if no TransactionID present', test => {
      let params = { ProfileID: 'TestProfile', Tier: 2 }

      let result = {}
      SoapResult.build.returns(result)

      SoapUpdateProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapResult.build.calledWith(420, 0, ['Invalid Value', 'Invalid or null transaction ID - null']))
          test.end()
        })
    })

    executeTest.test('return error if proflie does not exist', test => {
      let params = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2 }

      SoapValidation.validateCreateUpdateProfileRequest.returns(P.resolve())
      ProfileService.getByName.returns(P.resolve(null))

      let request = { profileName: params.ProfileID, tier: params.tier, records: [] }
      SoapRequestMapper.mapToCreateUpdateProfileRequest.returns(P.resolve(request))

      let result = {}
      SoapResult.build.returns(result)

      SoapUpdateProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateCreateUpdateProfileRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToCreateUpdateProfileRequest.calledWith(params))
          test.ok(ProfileService.getByName.calledWith(request.profileName))
          test.ok(SoapResult.build.calledWith(404, params.TransactionID, ['Not Found', 'DNS profile could not be found']))
          test.end()
        })
    })

    executeTest.test('return error if validation error thrown', test => {
      let params = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2 }

      let validationError = new SoapErrors.InvalidValueError('Invalid DNS Profile Id length')
      SoapValidation.validateCreateUpdateProfileRequest.returns(P.reject(validationError))

      let result = {}
      SoapResult.build.returns(result)

      SoapUpdateProfile.execute(params)
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

      SoapUpdateProfile.execute(params)
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

  soapUpdateProfileTest.end()
})
