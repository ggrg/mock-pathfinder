'use strict'

const src = '../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const PhoneService = require(`${src}/domain/phone`)
const SoapErrors = require(`${src}/services/provisioning/soap/errors`)
const SoapRequestMapper = require(`${src}/services/provisioning/soap/actions/mappers/request`)
const SoapResult = require(`${src}/services/provisioning/soap/actions/result`)
const SoapValidation = require(`${src}/services/provisioning/soap/actions/validation`)
const SoapDeactivatePhone = require(`${src}/services/provisioning/soap/actions/deactivate-phone`)

Test('SoapDeactivatePhone', soapDeactivatePhoneTest => {
  let sandbox

  soapDeactivatePhoneTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(SoapResult, 'build')
    sandbox.stub(SoapRequestMapper, 'mapToPhoneRequest')
    sandbox.stub(SoapValidation, 'validatePhoneRequest')
    sandbox.stub(PhoneService)
    t.end()
  })

  soapDeactivatePhoneTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  soapDeactivatePhoneTest.test('execute should', executeTest => {
    executeTest.test('deactivate phone and return result', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, Tier: 2 }

      SoapValidation.validatePhoneRequest.returns(P.resolve())

      let phone = { phoneId: 'phone-id' }
      PhoneService.getByNumber.returns(P.resolve(phone))
      PhoneService.removeById.returns(P.resolve({}))

      let query = { number: params.TN.Base, countryCode: params.TN.CountryCode }
      SoapRequestMapper.mapToPhoneRequest.returns(P.resolve(query))

      let result = {}
      SoapResult.build.returns(result)

      SoapDeactivatePhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validatePhoneRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToPhoneRequest.calledWith(params))
          test.ok(PhoneService.getByNumber.calledWith(query.number, query.countryCode))
          test.ok(PhoneService.removeById.calledWith(phone.phoneId))
          test.ok(SoapResult.build.calledWith(200, params.TransactionID, ['OK', 'TNs deactivated successfully']))
          test.end()
        })
    })

    executeTest.test('return error if no TransactionID present', test => {
      let params = { Tier: 2 }

      let result = {}
      SoapResult.build.returns(result)

      SoapDeactivatePhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapResult.build.calledWith(420, 0, ['Invalid Value', 'Invalid or null transaction ID - null']))
          test.end()
        })
    })

    executeTest.test('return error if phone not provisioned', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: 'TestProfile', Status: 'active', Tier: 2 }

      SoapValidation.validatePhoneRequest.returns(P.resolve())

      PhoneService.getByNumber.returns(P.resolve(null))

      let query = { number: params.TN.Base, countryCode: params.TN.CountryCode }
      SoapRequestMapper.mapToPhoneRequest.returns(P.resolve(query))

      let result = {}
      SoapResult.build.returns(result)

      SoapDeactivatePhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validatePhoneRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToPhoneRequest.calledWith(params))
          test.ok(PhoneService.getByNumber.calledWith(query.number, query.countryCode))
          test.ok(SoapResult.build.calledWith(420, params.TransactionID, ['Invalid Value', `TN ${query.number} was not activated`]))
          test.end()
        })
    })

    executeTest.test('return error if validation error thrown', test => {
      let params = { TransactionID: 12345, TN: { Base: '', CountryCode: '1' }, Tier: 2 }

      let validationError = new SoapErrors.InvalidValueError('TN base length is invalid')
      SoapValidation.validatePhoneRequest.returns(P.reject(validationError))

      let result = {}
      SoapResult.build.returns(result)

      SoapDeactivatePhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validatePhoneRequest.calledWith(params))
          test.ok(SoapResult.build.calledWith(validationError.code, params.TransactionID, [validationError.name, validationError.message]))
          test.end()
        })
    })

    executeTest.test('return error if unknown error', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, Tier: 2 }

      SoapValidation.validatePhoneRequest.returns(P.resolve())

      let query = { number: params.TN.Base, countryCode: params.TN.CountryCode }
      SoapRequestMapper.mapToPhoneRequest.returns(P.resolve(query))

      let error = new Error('Bad stuff')
      let reject = P.reject(error)
      reject.catch(() => {})
      PhoneService.getByNumber.returns(reject)

      let result = {}
      SoapResult.build.returns(result)

      SoapDeactivatePhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validatePhoneRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToPhoneRequest.calledWith(params))
          test.ok(PhoneService.getByNumber.calledWith(query.number, query.countryCode))
          test.ok(SoapResult.build.calledWith(500, 0, ['Unknown Error', error.message]))
          test.end()
        })
    })

    executeTest.end()
  })

  soapDeactivatePhoneTest.end()
})
