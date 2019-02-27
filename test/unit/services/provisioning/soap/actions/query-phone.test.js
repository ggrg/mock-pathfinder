'use strict'

const src = '../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Uuid = require('uuid4')
const Config = require(`${src}/lib/config`)
const PhoneService = require(`${src}/domain/phone`)
const ProfileService = require(`${src}/domain/profile`)
const SoapErrors = require(`${src}/services/provisioning/soap/errors`)
const SoapRequestMapper = require(`${src}/services/provisioning/soap/actions/mappers/request`)
const SoapResponseMapper = require(`${src}/services/provisioning/soap/actions/mappers/response`)
const SoapResult = require(`${src}/services/provisioning/soap/actions/result`)
const SoapValidation = require(`${src}/services/provisioning/soap/actions/validation`)
const SoapQueryPhone = require(`${src}/services/provisioning/soap/actions/query-phone`)

Test('SoapQueryPhone', soapQueryPhoneTest => {
  let sandbox
  let oldCustomerId
  let customerId = 1234

  soapQueryPhoneTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(SoapResult, 'build')
    sandbox.stub(SoapRequestMapper, 'mapToQueryPhoneRequest')
    sandbox.stub(SoapResponseMapper, 'mapToPhoneNumberResponse')
    sandbox.stub(SoapValidation, 'validateQueryPhoneRequest')
    sandbox.stub(ProfileService)
    sandbox.stub(PhoneService)

    oldCustomerId = Config.PROVISIONING.DEFAULT_CUSTOMER_ID
    Config.PROVISIONING.DEFAULT_CUSTOMER_ID = customerId

    t.end()
  })

  soapQueryPhoneTest.afterEach(t => {
    sandbox.restore()
    Config.PROVISIONING.DEFAULT_CUSTOMER_ID = oldCustomerId
    t.end()
  })

  soapQueryPhoneTest.test('execute should', executeTest => {
    executeTest.test('query by phone and return result', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, Tier: 2 }

      SoapValidation.validateQueryPhoneRequest.returns(P.resolve())

      let query = { phone: { number: params.TN.Base, countryCode: params.TN.CountryCode }, profileName: '' }
      SoapRequestMapper.mapToQueryPhoneRequest.returns(P.resolve(query))

      let profileId = Uuid()
      let phone = { phoneId: Uuid(), profileId, number: query.number, countryCode: query.countryCode, status: 'active' }
      PhoneService.getByNumber.returns(P.resolve(phone))

      let profile = { profileId, name: 'Test-Profile', tier: 2 }
      ProfileService.getById.returns(P.resolve(profile))

      let mappedResponse = { TNData: { } }
      SoapResponseMapper.mapToPhoneNumberResponse.returns(mappedResponse)

      let result = {}
      SoapResult.build.returns(result)

      SoapQueryPhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryPhoneRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToQueryPhoneRequest.calledWith(params))
          test.ok(PhoneService.getByNumber.calledWith(query.phone.number, query.phone.countryCode))
          test.ok(ProfileService.getById.calledWith(profileId))
          test.ok(SoapResponseMapper.mapToPhoneNumberResponse.calledWith(phone, profile, customerId))
          test.ok(SoapResult.build.calledWith(200, params.TransactionID, ['OK', '1 TN profile is queried successfully'], mappedResponse))
          test.end()
        })
    })

    executeTest.test('return error if phone not found while querying by phone', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, Tier: 2 }

      SoapValidation.validateQueryPhoneRequest.returns(P.resolve())

      let query = { phone: { number: params.TN.Base, countryCode: params.TN.CountryCode }, profileName: '' }
      SoapRequestMapper.mapToQueryPhoneRequest.returns(P.resolve(query))

      PhoneService.getByNumber.returns(P.resolve(null))

      let result = {}
      SoapResult.build.returns(result)

      SoapQueryPhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryPhoneRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToQueryPhoneRequest.calledWith(params))
          test.ok(PhoneService.getByNumber.calledWith(query.phone.number, query.phone.countryCode))
          test.ok(SoapResult.build.calledWith(404, params.TransactionID, ['Not Found', 'No TN profile could be found']))
          test.end()
        })
    })

    executeTest.test('return error if profile not found while querying by phone', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, Tier: 2 }

      SoapValidation.validateQueryPhoneRequest.returns(P.resolve())

      let query = { phone: { number: params.TN.Base, countryCode: params.TN.CountryCode }, profileName: '' }
      SoapRequestMapper.mapToQueryPhoneRequest.returns(P.resolve(query))

      let profileId = Uuid()
      let phone = { phoneId: Uuid(), profileId, number: query.phone.number, countryCode: query.phone.countryCode, status: 'active' }
      PhoneService.getByNumber.returns(P.resolve(phone))

      ProfileService.getById.returns(P.resolve(null))

      let result = {}
      SoapResult.build.returns(result)

      SoapQueryPhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryPhoneRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToQueryPhoneRequest.calledWith(params))
          test.ok(PhoneService.getByNumber.calledWith(query.phone.number, query.phone.countryCode))
          test.ok(ProfileService.getById.calledWith(profileId))
          test.ok(SoapResult.build.calledWith(404, params.TransactionID, ['Not Found', 'DNS profile does not exist']))
          test.end()
        })
    })

    executeTest.test('query by profile name and return result', test => {
      let params = { TransactionID: 12345, DNSProfileID: 'TestProfile', Tier: 2 }

      SoapValidation.validateQueryPhoneRequest.returns(P.resolve())

      let query = { phone: {}, profileName: params.DNSProfileID }
      SoapRequestMapper.mapToQueryPhoneRequest.returns(P.resolve(query))

      let profileId = Uuid()

      let profile = { profileId, name: query.profileName, tier: 2 }
      ProfileService.getByName.returns(P.resolve(profile))

      let phone = { phoneId: Uuid(), profileId, number: query.number, countryCode: query.countryCode, status: 'active' }
      PhoneService.getByProfileId.returns(P.resolve([phone]))

      let mappedResponse = { TNData: { } }
      SoapResponseMapper.mapToPhoneNumberResponse.returns(mappedResponse)

      let result = {}
      SoapResult.build.returns(result)

      SoapQueryPhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryPhoneRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToQueryPhoneRequest.calledWith(params))
          test.ok(ProfileService.getByName.calledWith(query.profileName))
          test.ok(PhoneService.getByProfileId.calledWith(profileId))
          test.ok(SoapResponseMapper.mapToPhoneNumberResponse.calledWith([phone], profile, customerId))
          test.ok(SoapResult.build.calledWith(200, params.TransactionID, ['OK', '1 TN profiles are queried successfully'], mappedResponse))
          test.end()
        })
    })

    executeTest.test('return error if profile not found while querying by profile name', test => {
      let params = { TransactionID: 12345, DNSProfileID: 'TestProfile', Tier: 2 }

      SoapValidation.validateQueryPhoneRequest.returns(P.resolve())

      let query = { phone: {}, profileName: params.DNSProfileID }
      SoapRequestMapper.mapToQueryPhoneRequest.returns(P.resolve(query))

      ProfileService.getByName.returns(P.resolve(null))

      let result = {}
      SoapResult.build.returns(result)

      SoapQueryPhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryPhoneRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToQueryPhoneRequest.calledWith(params))
          test.ok(ProfileService.getByName.calledWith(query.profileName))
          test.ok(SoapResult.build.calledWith(404, params.TransactionID, ['Not Found', 'No TN profile could be found']))
          test.end()
        })
    })

    executeTest.test('return error if not phones found while querying by profile name', test => {
      let params = { TransactionID: 12345, DNSProfileID: 'TestProfile', Tier: 2 }

      SoapValidation.validateQueryPhoneRequest.returns(P.resolve())

      let query = { phone: {}, profileName: params.DNSProfileID }
      SoapRequestMapper.mapToQueryPhoneRequest.returns(P.resolve(query))

      let profileId = Uuid()

      let profile = { profileId, name: query.profileName, tier: 2 }
      ProfileService.getByName.returns(P.resolve(profile))

      PhoneService.getByProfileId.returns(P.resolve([]))

      let result = {}
      SoapResult.build.returns(result)

      SoapQueryPhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryPhoneRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToQueryPhoneRequest.calledWith(params))
          test.ok(ProfileService.getByName.calledWith(query.profileName))
          test.ok(PhoneService.getByProfileId.calledWith(profileId))
          test.ok(SoapResult.build.calledWith(404, params.TransactionID, ['Not Found', 'No TN profile could be found']))
          test.end()
        })
    })

    executeTest.test('return error if no TransactionID present', test => {
      let params = { TN: { Base: '5558675309', CountryCode: '1' }, Tier: 2 }

      let result = {}
      SoapResult.build.returns(result)

      SoapQueryPhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapResult.build.calledWith(420, 0, ['Invalid Value', 'Invalid or null transaction ID - null']))
          test.end()
        })
    })

    executeTest.test('return error if validation error thrown', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, Tier: 2 }

      let validationError = new SoapErrors.InvalidValueError('TN base length is invalid')
      SoapValidation.validateQueryPhoneRequest.returns(P.reject(validationError))

      let result = {}
      SoapResult.build.returns(result)

      SoapQueryPhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryPhoneRequest.calledWith(params))
          test.ok(SoapResult.build.calledWith(validationError.code, params.TransactionID, [validationError.name, validationError.message]))
          test.end()
        })
    })

    executeTest.test('return error if unknown error', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, Tier: 2 }

      SoapValidation.validateQueryPhoneRequest.returns(P.resolve())

      let error = new Error('Bad stuff')
      let reject = P.reject(error)
      reject.catch(() => {})
      SoapRequestMapper.mapToQueryPhoneRequest.returns(reject)

      let result = {}
      SoapResult.build.returns(result)

      SoapQueryPhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateQueryPhoneRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToQueryPhoneRequest.calledWith(params))
          test.ok(SoapResult.build.calledWith(500, 0, ['Unknown Error', error.message]))
          test.end()
        })
    })

    executeTest.end()
  })

  soapQueryPhoneTest.end()
})
