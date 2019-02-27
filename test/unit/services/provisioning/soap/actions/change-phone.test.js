'use strict'

const src = '../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const PhoneService = require(`${src}/domain/phone`)
const ProfileService = require(`${src}/domain/profile`)
const SoapErrors = require(`${src}/services/provisioning/soap/errors`)
const SoapRequestMapper = require(`${src}/services/provisioning/soap/actions/mappers/request`)
const SoapResult = require(`${src}/services/provisioning/soap/actions/result`)
const SoapValidation = require(`${src}/services/provisioning/soap/actions/validation`)
const SoapChangePhone = require(`${src}/services/provisioning/soap/actions/change-phone`)

Test('SoapChangePhone', soapChangePhoneTest => {
  let sandbox

  soapChangePhoneTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(SoapResult, 'build')
    sandbox.stub(SoapRequestMapper, 'mapToChangePhoneStatusRequest')
    sandbox.stub(SoapValidation, 'validateChangePhoneStatusRequest')
    sandbox.stub(PhoneService)
    sandbox.stub(ProfileService)
    t.end()
  })

  soapChangePhoneTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  soapChangePhoneTest.test('execute should', executeTest => {
    executeTest.test('update phone and return result', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: 'TestProfile', Status: 'inactive', Tier: 2 }

      SoapValidation.validateChangePhoneStatusRequest.returns(P.resolve())

      let profile = { profileId: 'profile-id' }
      ProfileService.getByName.returns(P.resolve(profile))

      PhoneService.update.returns(P.resolve({}))

      let phone = { phoneId: 'phone-id' }
      PhoneService.getByNumber.returns(P.resolve(phone))

      let phoneRequest = { profileName: params.ProfileID, status: params.Status, phone: { number: params.TN.Base, countryCode: params.TN.CountryCode } }
      SoapRequestMapper.mapToChangePhoneStatusRequest.returns(P.resolve(phoneRequest))

      let result = {}
      SoapResult.build.returns(result)

      SoapChangePhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateChangePhoneStatusRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToChangePhoneStatusRequest.calledWith(params))
          test.ok(PhoneService.getByNumber.calledWith(phoneRequest.phone.number, phoneRequest.phone.countryCode))
          test.ok(ProfileService.getByName.calledWith(phoneRequest.profileName))
          test.ok(PhoneService.update.calledWith(phone.phoneId, sandbox.match({
            profileId: profile.profileId,
            status: phoneRequest.status
          })))
          test.ok(SoapResult.build.calledWith(200, params.TransactionID, ['OK', 'TN profile updated successfully']))
          test.end()
        })
    })

    executeTest.test('return error if no TransactionID present', test => {
      let params = { ProfileID: 'TestProfile', Tier: 2 }

      let result = {}
      SoapResult.build.returns(result)

      SoapChangePhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapResult.build.calledWith(420, 0, ['Invalid Value', 'Invalid or null transaction ID - null']))
          test.end()
        })
    })

    executeTest.test('return error if phone not found', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: 'TestProfile', Status: 'inactive', Tier: 2 }

      SoapValidation.validateChangePhoneStatusRequest.returns(P.resolve())

      PhoneService.getByNumber.returns(P.resolve(null))

      let phoneRequest = { profileName: params.ProfileID, status: params.Status, phone: { number: params.TN.Base, countryCode: params.TN.CountryCode } }
      SoapRequestMapper.mapToChangePhoneStatusRequest.returns(P.resolve(phoneRequest))

      let result = {}
      SoapResult.build.returns(result)

      SoapChangePhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateChangePhoneStatusRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToChangePhoneStatusRequest.calledWith(params))
          test.ok(PhoneService.getByNumber.calledWith(phoneRequest.phone.number, phoneRequest.phone.countryCode))
          test.ok(SoapResult.build.calledWith(420, params.TransactionID, ['Invalid Value', `TN ${phoneRequest.phone.number} WAS NOT PROVISIONED`]))
          test.end()
        })
    })

    executeTest.test('return error if proflie does not exist', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: 'TestProfile', Status: 'active', Tier: 2 }

      SoapValidation.validateChangePhoneStatusRequest.returns(P.resolve())
      ProfileService.getByName.returns(P.resolve(null))

      let phone = { phoneId: 'phone-id' }
      PhoneService.getByNumber.returns(P.resolve(phone))

      let phoneRequest = { profileName: params.ProfileID, status: params.Status, phone: { number: params.TN.Base, countryCode: params.TN.CountryCode } }
      SoapRequestMapper.mapToChangePhoneStatusRequest.returns(P.resolve(phoneRequest))

      let result = {}
      SoapResult.build.returns(result)

      SoapChangePhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateChangePhoneStatusRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToChangePhoneStatusRequest.calledWith(params))
          test.ok(PhoneService.getByNumber(phoneRequest.phone.number, phoneRequest.phone.countryCode))
          test.ok(ProfileService.getByName.calledWith(phoneRequest.profileName))
          test.ok(SoapResult.build.calledWith(421, params.TransactionID, ['Value Missing', 'DNS PROFILE DOES NOT EXIST']))
          test.end()
        })
    })

    executeTest.test('return error if validation error thrown', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: '', Status: 'active', Tier: 2 }

      let validationError = new SoapErrors.InvalidValueError('Invalid DNS Profile Id length')
      SoapValidation.validateChangePhoneStatusRequest.returns(P.reject(validationError))

      let result = {}
      SoapResult.build.returns(result)

      SoapChangePhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateChangePhoneStatusRequest.calledWith(params))
          test.ok(SoapResult.build.calledWith(validationError.code, params.TransactionID, [validationError.name, validationError.message]))
          test.end()
        })
    })

    executeTest.test('return error if unknown error', test => {
      let params = { TransactionID: 12345, TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: 'TestProfile', Status: 'active', Tier: 2 }

      SoapValidation.validateChangePhoneStatusRequest.returns(P.resolve())

      let phoneRequest = { profileName: params.ProfileID, status: params.Status, phone: { number: params.TN.Base, countryCode: params.TN.CountryCode } }
      SoapRequestMapper.mapToChangePhoneStatusRequest.returns(P.resolve(phoneRequest))

      let error = new Error('Bad stuff')
      let reject = P.reject(error)
      reject.catch(() => {})
      PhoneService.getByNumber.returns(reject)

      let result = {}
      SoapResult.build.returns(result)

      SoapChangePhone.execute(params)
        .then(r => {
          test.equal(r, result)
          test.ok(SoapValidation.validateChangePhoneStatusRequest.calledWith(params))
          test.ok(SoapRequestMapper.mapToChangePhoneStatusRequest.calledWith(params))
          test.ok(PhoneService.getByNumber.calledWith(phoneRequest.phone.number, phoneRequest.phone.countryCode))
          test.ok(SoapResult.build.calledWith(500, 0, ['Unknown Error', error.message]))
          test.end()
        })
    })

    executeTest.end()
  })

  soapChangePhoneTest.end()
})
