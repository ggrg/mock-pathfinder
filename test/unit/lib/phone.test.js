'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')

Test('Phone', phoneTest => {
  let sandbox
  let phoneNumberStub
  let phoneUtilInstance
  let PhoneNumberUtil
  let PhoneNumberFormat
  let Phone

  phoneTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()

    phoneNumberStub = sandbox.stub()
    phoneUtilInstance = { parse: sandbox.stub(), format: sandbox.stub(), isValidNumber: sandbox.stub() }
    PhoneNumberUtil = { getInstance: sandbox.stub().returns(phoneUtilInstance) }
    PhoneNumberFormat = { 'E164': 1 }

    Phone = Proxyquire(`${src}/lib/phone`, { 'google-libphonenumber': { PhoneNumberFormat, PhoneNumberUtil, PhoneNumber: phoneNumberStub } })

    t.end()
  })

  phoneTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  phoneTest.test('parse should', parseTest => {
    parseTest.test('parse number to get number and country code', test => {
      let countryCode = 1
      let nationalNumber = 5158675309
      let phoneNumber = `+${countryCode}${nationalNumber}`

      let parsed = sandbox.stub()
      parsed.getCountryCode = sandbox.stub().returns(countryCode)
      parsed.getNationalNumber = sandbox.stub().returns(nationalNumber)

      phoneUtilInstance.parse.returns(parsed)
      phoneUtilInstance.isValidNumber.returns(true)

      let res = Phone.parse(phoneNumber)
      test.ok(phoneUtilInstance.parse.calledWith(phoneNumber))
      test.ok(phoneUtilInstance.isValidNumber.calledWith(parsed))
      test.equal(res.nationalNumber, nationalNumber)
      test.equal(res.countryCode, countryCode)
      test.ok(res.isValidNumber)
      test.end()
    })

    parseTest.test('handle non-E164 formatted phone numbers', test => {
      let countryCode = 1
      let nationalNumber = 5158675309
      let phoneNumber = `${countryCode}-515-867-5309`
      let e164PhoneNumber = `+${countryCode}${nationalNumber}`

      let parsed = sandbox.stub()
      parsed.getCountryCode = sandbox.stub().returns(countryCode)
      parsed.getNationalNumber = sandbox.stub().returns(nationalNumber)

      phoneUtilInstance.parse.returns(parsed)
      phoneUtilInstance.isValidNumber.returns(true)

      let res = Phone.parse(phoneNumber)
      test.ok(phoneUtilInstance.parse.calledWith(e164PhoneNumber))
      test.ok(phoneUtilInstance.isValidNumber.calledWith(parsed))
      test.equal(res.nationalNumber, nationalNumber)
      test.equal(res.countryCode, countryCode)
      test.ok(res.isValidNumber)
      test.end()
    })

    parseTest.test('return isValidNumber false if invalid number', test => {
      let countryCode = 1
      let nationalNumber = 5158675309
      let phoneNumber = `+${countryCode}${nationalNumber}`

      let parsed = sandbox.stub()
      parsed.getCountryCode = sandbox.stub().returns(countryCode)
      parsed.getNationalNumber = sandbox.stub().returns(nationalNumber)

      phoneUtilInstance.parse.returns(parsed)
      phoneUtilInstance.isValidNumber.returns(false)

      let res = Phone.parse(phoneNumber)
      test.ok(phoneUtilInstance.parse.calledWith(phoneNumber))
      test.ok(phoneUtilInstance.isValidNumber.calledWith(parsed))
      test.equal(res.nationalNumber, nationalNumber)
      test.equal(res.countryCode, countryCode)
      test.notOk(res.isValidNumber)
      test.end()
    })

    parseTest.end()
  })

  phoneTest.test('format should', formatTest => {
    formatTest.test('format national number and currency code into an E.164 format', test => {
      let countryCode = 1
      let nationalNumber = 5158675309
      let phoneNumber = `+${countryCode}${nationalNumber}`

      let phoneNumberObj = { setNationalNumber: sandbox.stub(), setCountryCode: sandbox.stub() }
      phoneNumberStub.returns(phoneNumberObj)

      phoneUtilInstance.format.returns(phoneNumber)

      let formatted = Phone.format(nationalNumber, countryCode)
      test.ok(phoneNumberStub.calledWithNew())
      test.ok(phoneNumberObj.setCountryCode.calledWith(countryCode))
      test.ok(phoneNumberObj.setNationalNumber.calledWith(nationalNumber))
      test.ok(phoneUtilInstance.format.calledWith(phoneNumberObj, PhoneNumberFormat.E164))
      test.equal(formatted, phoneNumber)
      test.end()
    })

    formatTest.end()
  })

  phoneTest.test('enumDomainToParsedPhone should', enumToParsedPhoneTest => {
    enumToParsedPhoneTest.test('convert ENUM domain to parsed phone number', test => {
      let countryCode = 1
      let nationalNumber = 5551234567
      let phoneNumber = `+${countryCode}${nationalNumber}`
      const enumDomain = `7.6.5.4.3.2.1.5.5.5.1.e164enum.net`

      let parsed = sandbox.stub()
      parsed.getCountryCode = sandbox.stub().returns(countryCode)
      parsed.getNationalNumber = sandbox.stub().returns(nationalNumber)

      phoneUtilInstance.parse.returns(parsed)
      phoneUtilInstance.isValidNumber.returns(true)

      let res = Phone.enumDomainToParsedPhone(enumDomain)
      test.ok(phoneUtilInstance.parse.calledWith(phoneNumber))
      test.ok(phoneUtilInstance.isValidNumber.calledWith(parsed))
      test.equal(res.nationalNumber, nationalNumber)
      test.equal(res.countryCode, countryCode)
      test.ok(res.isValidNumber)
      test.end()
    })

    enumToParsedPhoneTest.end()
  })

  phoneTest.end()
})
