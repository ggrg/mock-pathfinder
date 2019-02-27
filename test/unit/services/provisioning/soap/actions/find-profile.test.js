'use strict'

const src = '../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Config = require(`${src}/lib/config`)
const RecordService = require(`${src}/domain/record`)
const ProfileService = require(`${src}/domain/profile`)
const SoapErrors = require(`${src}/services/provisioning/soap/errors`)
const SoapRequestMapper = require(`${src}/services/provisioning/soap/actions/mappers/request`)
const SoapResponseMapper = require(`${src}/services/provisioning/soap/actions/mappers/response`)
const SoapResult = require(`${src}/services/provisioning/soap/actions/result`)
const SoapValidation = require(`${src}/services/provisioning/soap/actions/validation`)
const SoapFindProfile = require(`${src}/services/provisioning/soap/actions/find-profile`)

Test('SoapFindProfile', soapFindProfileTest => {
  let sandbox
  let oldCustomerId
  let customerId = 1234

  soapFindProfileTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(SoapResult, 'build')
    sandbox.stub(SoapRequestMapper, 'mapToQueryProfileRequest')
    sandbox.stub(SoapResponseMapper, 'mapToProfileResponse')
    sandbox.stub(SoapValidation, 'validateQueryProfileRequest')
    sandbox.stub(ProfileService)
    sandbox.stub(RecordService)

    oldCustomerId = Config.PROVISIONING.DEFAULT_CUSTOMER_ID
    Config.PROVISIONING.DEFAULT_CUSTOMER_ID = customerId

    t.end()
  })

  soapFindProfileTest.afterEach(t => {
    sandbox.restore()
    Config.PROVISIONING.DEFAULT_CUSTOMER_ID = oldCustomerId
    t.end()
  })

  soapFindProfileTest.test('execute should', executeTest => {
    executeTest.test('find profile and records and return result', test => {
      let params = { TransactionID: 12345, ProfileID: 'Test-Profile' }

      SoapValidation.validateQueryProfileRequest.returns(P.resolve())

      let query = { profileName: params.ProfileID }
      SoapRequestMapper.mapToQueryProfileRequest.returns(P.resolve(query))

      let profileId = Uuid()
      let profile = { profileId, name: params.ProfileID, tier: 2 }
      ProfileService.getByName.returns(P.resolve(profile))

      let records = [{ recordId: Uuid(), profileId }, { recordId: Uuid(), profileId }]
      RecordService.getByProfileId.returns(P.resolve(records))

      let mappedResponse = { TNData: { } }
      SoapResponseMapper.mapToProfileResponse.returns(mappedResponse)

      let result = {}
      SoapResult.build.returns(result)

      SoapFindProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryProfileRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToQueryProfileRequest.calledWith(params))
          test.ok(ProfileService.getByName.calledWith(query.profileName))
          test.ok(RecordService.getByProfileId.calledWith(profileId))
          test.ok(SoapResponseMapper.mapToProfileResponse.calledWith(profile, records, customerId))
          test.ok(SoapResult.build.calledWith(200, params.TransactionID, ['OK', 'DNS profile queried successfully'], mappedResponse))
          test.end()
        })
    })

    executeTest.test('return error if profile not found', test => {
      let params = { TransactionID: 12345, ProfileID: 'Test-Profile' }

      SoapValidation.validateQueryProfileRequest.returns(P.resolve())

      let query = { profileName: params.ProfileID }
      SoapRequestMapper.mapToQueryProfileRequest.returns(P.resolve(query))

      ProfileService.getByName.returns(P.resolve(null))

      let result = {}
      SoapResult.build.returns(result)

      SoapFindProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryProfileRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToQueryProfileRequest.calledWith(params))
          test.ok(ProfileService.getByName.calledWith(query.profileName))
          test.ok(SoapResult.build.calledWith(404, params.TransactionID, ['Not Found', 'DNS profile does not exist']))
          test.end()
        })
    })

    executeTest.test('return error if no TransactionID present', test => {
      let params = { ProfileID: 'Test-Profile' }

      let result = {}
      SoapResult.build.returns(result)

      SoapFindProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapResult.build.calledWith(420, 0, ['Invalid Value', 'Invalid or null transaction ID - null']))
          test.end()
        })
    })

    executeTest.test('return error if validation error thrown', test => {
      let params = { TransactionID: 12345, ProfileID: 'Test-Profile' }

      let validationError = new SoapErrors.InvalidValueError('Invalid DNS Profile Id length')
      SoapValidation.validateQueryProfileRequest.returns(P.reject(validationError))

      let result = {}
      SoapResult.build.returns(result)

      SoapFindProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryProfileRequest.calledWith(params))
          test.ok(SoapResult.build.calledWith(validationError.code, params.TransactionID, [validationError.name, validationError.message]))
          test.end()
        })
    })

    executeTest.test('return error if unknown error', test => {
      let params = { TransactionID: 12345, ProfileID: 'Test-Profile' }

      SoapValidation.validateQueryProfileRequest.returns(P.resolve())

      let error = new Error('Bad stuff')
      let reject = P.reject(error)
      reject.catch(() => {})
      SoapRequestMapper.mapToQueryProfileRequest.returns(reject)

      let result = {}
      SoapResult.build.returns(result)

      SoapFindProfile.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryProfileRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToQueryProfileRequest.calledWith(params))
          test.ok(SoapResult.build.calledWith(500, 0, ['Unknown Error', error.message]))
          test.end()
        })
    })

    executeTest.end()
  })

  soapFindProfileTest.end()
})
