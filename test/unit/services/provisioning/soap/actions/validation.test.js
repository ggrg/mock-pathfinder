'use strict'

const src = '../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const SoapErrors = require(`${src}/services/provisioning/soap/errors`)
const SoapValidation = require(`${src}/services/provisioning/soap/actions/validation`)

Test('Validation', soapValidationTest => {
  let sandbox

  soapValidationTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(SoapValidation, 'validateRecordRequest')
    t.end()
  })

  soapValidationTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  soapValidationTest.test('validatePhoneRequest should', validatePhoneRequestTest => {
    validatePhoneRequestTest.test('validate phone', test => {
      let params = { TN: { Base: ['', ''] } }

      SoapValidation.validatePhoneRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.NotImplementedError, err => {
          test.equal(err.message, 'Function has not been implemented for multiple single TNs')
          test.end()
        })
    })

    validatePhoneRequestTest.test('throw error if no TN present', test => {
      let params = { }

      SoapValidation.validatePhoneRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'Query input parameter is missing')
          test.end()
        })
    })

    validatePhoneRequestTest.test('pass validation', test => {
      let params = { TN: { Base: '5558675309', CountryCode: '1' } }

      SoapValidation.validatePhoneRequest(params)
        .then(() => {
          test.pass()
          test.end()
        })
    })

    validatePhoneRequestTest.end()
  })

  soapValidationTest.test('validateQueryPhoneRequest should', validateQueryPhoneRequestTest => {
    validateQueryPhoneRequestTest.test('throw error if neither TN or DNSProfileID present', test => {
      let params = { }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'Query input parameter is missing')
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('throw error if empty ProfileID', test => {
      let params = { DNSProfileID: '' }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Invalid DNS Profile Id length')
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('pass validation if DNSProfileID present', test => {
      let params = { DNSProfileID: 'TestProfile' }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.pass()
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('throw error if no Base present', test => {
      let params = { TN: { } }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'TN base length is invalid')
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('throw error if empty Base', test => {
      let params = { TN: { Base: '     ' } }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'TN base length is invalid')
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('throw error if Base is array', test => {
      let params = { TN: { Base: ['', ''] } }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.NotImplementedError, err => {
          test.equal(err.message, 'Function has not been implemented for multiple single TNs')
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('throw error if Stop present', test => {
      let params = { TN: { Base: '5558675309', Stop: '5158676309', CountryCode: '1' } }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.NotImplementedError, err => {
          test.equal(err.message, 'Function has not been implemented for multiple TNs using Stop')
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('throw error if Size present', test => {
      let params = { TN: { Base: '5558675309', Size: '10', CountryCode: '1' } }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.NotImplementedError, err => {
          test.equal(err.message, 'Function has not been implemented for multiple TNs using Size')
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('throw error if CountryCode not integer', test => {
      let params = { TN: { Base: '5558675309', CountryCode: 'a' } }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Invalid country code')
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('throw error if CountryCode too long', test => {
      let params = { TN: { Base: '5558675309', CountryCode: '1111' } }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Invalid country code')
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('use default CountryCode if missing', test => {
      let params = { TN: { Base: '5558675309' } }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.pass()
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('validate TN but not DNSProfileID if both present', test => {
      let params = { TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: '' }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.pass()
          test.end()
        })
    })

    validateQueryPhoneRequestTest.test('pass validation if both TN and DNSProfileID present', test => {
      let params = { TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: 'TestProfile' }

      SoapValidation.validateQueryPhoneRequest(params)
        .then(() => {
          test.pass()
          test.end()
        })
    })

    validateQueryPhoneRequestTest.end()
  })

  soapValidationTest.test('validateChangePhoneStatusRequest should', validateChangePhoneStatusRequestTest => {
    validateChangePhoneStatusRequestTest.test('throw error if no TN present', test => {
      let params = { DNSProfileID: 'TestProfile' }

      SoapValidation.validateChangePhoneStatusRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'Query input parameter is missing')
          test.end()
        })
    })

    validateChangePhoneStatusRequestTest.test('throw error if no DNSProfileID present', test => {
      let params = { TN: { Base: '5558675309', CountryCode: '1' } }

      SoapValidation.validateChangePhoneStatusRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'DNS Profile Id value is missing')
          test.end()
        })
    })

    validateChangePhoneStatusRequestTest.test('validate phone', test => {
      let params = { TN: { Base: ['', ''] }, DNSProfileID: '' }

      SoapValidation.validateChangePhoneStatusRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.NotImplementedError, err => {
          test.equal(err.message, 'Function has not been implemented for multiple single TNs')
          test.end()
        })
    })

    validateChangePhoneStatusRequestTest.test('throw error if empty ProfileID', test => {
      let params = { TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: '' }

      SoapValidation.validateChangePhoneStatusRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Invalid DNS Profile Id length')
          test.end()
        })
    })

    validateChangePhoneStatusRequestTest.test('throw error if status not valid', test => {
      let params = { TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: 'Test-Profile', Status: 'meh' }

      SoapValidation.validateChangePhoneStatusRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Status must be active or inactive')
          test.end()
        })
    })

    validateChangePhoneStatusRequestTest.test('set default status to active if not found and pass', test => {
      let params = { TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: 'Test-Profile' }

      SoapValidation.validateChangePhoneStatusRequest(params)
        .then(() => {
          test.pass()
          test.end()
        })
    })

    validateChangePhoneStatusRequestTest.test('pass validation', test => {
      let params = { TN: { Base: '5558675309', CountryCode: '1' }, DNSProfileID: 'Test-Profile', Status: 'active' }

      SoapValidation.validateChangePhoneStatusRequest(params)
        .then(() => {
          test.pass()
          test.end()
        })
    })

    validateChangePhoneStatusRequestTest.end()
  })

  soapValidationTest.test('validateQueryProfileRequest should', validateQueryProfileRequestTest => {
    validateQueryProfileRequestTest.test('throw error if no ProfileID present', test => {
      let params = { }

      SoapValidation.validateQueryProfileRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'DNS Profile Id value is missing')
          test.end()
        })
    })

    validateQueryProfileRequestTest.test('throw error if empty ProfileID', test => {
      let params = { ProfileID: '' }

      SoapValidation.validateQueryProfileRequest(params)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Invalid DNS Profile Id length')
          test.end()
        })
    })

    validateQueryProfileRequestTest.test('pass validation', test => {
      let params = { ProfileID: 'Test-Profile' }

      SoapValidation.validateQueryProfileRequest(params)
        .then(() => {
          test.pass()
          test.end()
        })
    })

    validateQueryProfileRequestTest.end()
  })

  soapValidationTest.test('validateCreateUpdateProfileRequest should', validateCreateUpdateProfileRequestTest => {
    validateCreateUpdateProfileRequestTest.test('throw error if no ProfileID present', test => {
      let profile = { TransactionID: 12345 }

      SoapValidation.validateCreateUpdateProfileRequest(profile)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Invalid DNS Profile Id length')
          test.end()
        })
    })

    validateCreateUpdateProfileRequestTest.test('throw error if empty ProfileID present', test => {
      let profile = { TransactionID: 12345, ProfileID: '      ' }

      SoapValidation.validateCreateUpdateProfileRequest(profile)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Invalid DNS Profile Id length')
          test.end()
        })
    })

    validateCreateUpdateProfileRequestTest.test('throw error if no Tier present', test => {
      let profile = { TransactionID: 12345, ProfileID: 'TestProfile' }

      SoapValidation.validateCreateUpdateProfileRequest(profile)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Tier value for DNS profile is invalid')
          test.end()
        })
    })

    validateCreateUpdateProfileRequestTest.test('throw error if unauthorized Tier value of 0', test => {
      let profile = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 0 }

      SoapValidation.validateCreateUpdateProfileRequest(profile)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.UnauthorizedError, err => {
          test.equal(err.message, 'Customer is not authorized for provisioning Tier 0/1 DNS profiles')
          test.end()
        })
    })

    validateCreateUpdateProfileRequestTest.test('throw error if unauthorized Tier value of 1', test => {
      let profile = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 1 }

      SoapValidation.validateCreateUpdateProfileRequest(profile)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.UnauthorizedError, err => {
          test.equal(err.message, 'Customer is not authorized for provisioning Tier 0/1 DNS profiles')
          test.end()
        })
    })

    validateCreateUpdateProfileRequestTest.test('throw error if no NAPTR records', test => {
      let profile = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2 }

      SoapValidation.validateCreateUpdateProfileRequest(profile)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'Tier 2 DNS profile does not contain NAPTR records')
          test.end()
        })
    })

    validateCreateUpdateProfileRequestTest.test('throw error if too many NAPTR records', test => {
      let naptrRecords = []
      for (let x = 0; x <= 17; x++) {
        naptrRecords.push({})
      }

      let profile = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2, NAPTR: naptrRecords }

      SoapValidation.validateCreateUpdateProfileRequest(profile)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Number of NAPTR records exceeds the maximum limit - 16')
          test.end()
        })
    })

    validateCreateUpdateProfileRequestTest.test('call validateRecordRequest if only one NAPTR request and resolve promise', test => {
      let naptr1 = { Order: 1 }

      let profile = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2, NAPTR: naptr1 }

      SoapValidation.validateRecordRequest.returns(P.resolve())

      SoapValidation.validateCreateUpdateProfileRequest(profile)
        .then(() => {
          test.ok(SoapValidation.validateRecordRequest.calledOnce)
          test.ok(SoapValidation.validateRecordRequest.calledWith(naptr1))
          test.end()
        })
    })

    validateCreateUpdateProfileRequestTest.test('call validateRecordRequest for each NAPTR record and resolve promise', test => {
      let naptr1 = { Order: 1 }
      let naptr2 = { Order: 2 }

      let profile = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2, NAPTR: [naptr1, naptr2] }

      SoapValidation.validateRecordRequest.returns(P.resolve())

      SoapValidation.validateCreateUpdateProfileRequest(profile)
        .then(() => {
          test.ok(SoapValidation.validateRecordRequest.calledTwice)
          test.ok(SoapValidation.validateRecordRequest.calledWith(naptr1))
          test.ok(SoapValidation.validateRecordRequest.calledWith(naptr2))
          test.end()
        })
    })

    validateCreateUpdateProfileRequestTest.test('return first error from validateRecordRequest', test => {
      let naptr1 = { Order: 1 }
      let naptr2 = { Order: 2 }

      let profile = { TransactionID: 12345, ProfileID: 'TestProfile', Tier: 2, NAPTR: [naptr1, naptr2] }

      let err1 = new SoapErrors.InvalidValueError('Bad first NAPTR')
      let err2 = new SoapErrors.InvalidValueError('Bad second NAPTR')

      SoapValidation.validateRecordRequest.withArgs(naptr1).returns(P.reject(err1))
      SoapValidation.validateRecordRequest.withArgs(naptr2).returns(P.reject(err2))

      SoapValidation.validateCreateUpdateProfileRequest(profile)
        .then(() => {
          SoapValidation.validateRecordRequest.restore()
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, err1.message)
          test.end()
        })
    })

    validateCreateUpdateProfileRequestTest.end()
  })

  soapValidationTest.test('validateRecordRequest should', validateRecordRequestTest => {
    validateRecordRequestTest.test('throw error if no Order present', test => {
      let record = {}

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR order value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if Order is not an integer', test => {
      let record = { Order: 'a' }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR order value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if Order is less than 1', test => {
      let record = { Order: -1 }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR order value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if Order is invalid integer', test => {
      let record = { Order: 65536 }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR order value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if no Preference present', test => {
      let record = { Order: 1 }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR preference value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if Preference is not an integer', test => {
      let record = { Order: 1, Preference: 'a' }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR preference value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if Preference is less than 1', test => {
      let record = { Order: 1, Preference: -1 }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR preference value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if Preference is invalid integer', test => {
      let record = { Order: 1, Preference: 65536 }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR preference value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if no DomainName present', test => {
      let record = { Order: 1, Preference: 10 }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Invalid domain name')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if empty DomainName', test => {
      let record = { Order: 1, Preference: 10, DomainName: '      ' }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'Invalid domain name')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if no Service present', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net' }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'NAPTR service missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if empty Service', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: '      ' }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'NAPTR service missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if no Regexp present', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test' }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'NAPTR regexp pattern missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if no Regexp pattern present', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: {} }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'NAPTR regexp pattern missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if empty Regexp pattern', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '    ' } } }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'NAPTR regexp pattern missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if no Regexp URI present', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' } } }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'NAPTR regexp missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if empty Regexp URI', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: '      ' } }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'NAPTR regexp missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if no Flags present', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' } }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR flags value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if invalid Flags', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'C' }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR flags value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if no attributes present', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'U' }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR ttl value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if no TTL attribute present', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'U', attributes: {} }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR ttl value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if invalid TTL', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'U', attributes: { ttl: 'a' } }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.InvalidValueError, err => {
          test.equal(err.message, 'NAPTR ttl value invalid')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if no Replacement present', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'U', attributes: { ttl: 900 } }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'NAPTR replacement missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if empty Replacement', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'U', attributes: { ttl: 900 }, Replacement: '    ' }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'NAPTR replacement missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if no Partner attribute present', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'U', attributes: { ttl: 900 }, Replacement: '.' }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'Partner value is missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if empty Partner attributes', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'U', attributes: { ttl: 900 }, Replacement: '.', Partner: { attributes: {} } }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'Partner value is missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('throw error if empty Partner id', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'U', attributes: { ttl: 900 }, Replacement: '.', Partner: { attributes: { id: '    ' } } }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.fail('No exception thrown')
          test.end()
        })
        .catch(SoapErrors.ValueMissingError, err => {
          test.equal(err.message, 'Partner value is missing')
          test.end()
        })
    })

    validateRecordRequestTest.test('resolve promise if no errors', test => {
      let record = { Order: 1, Preference: 10, DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'U', attributes: { ttl: 900 }, Replacement: '.', Partner: { attributes: { id: 'ALL' } } }

      SoapValidation.validateRecordRequest.restore()

      SoapValidation.validateRecordRequest(record)
        .then(() => {
          test.pass()
          test.end()
        })
        .catch(e => {
          test.fail('Should have not thrown exception')
          test.end()
        })
    })

    validateRecordRequestTest.end()
  })

  soapValidationTest.end()
})
