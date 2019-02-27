'use strict'

const src = '../../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const SoapRequestMapper = require(`${src}/services/provisioning/soap/actions/mappers/request`)

Test('SoapRequestMapper', soapRequestMapperTest => {
  let sandbox

  soapRequestMapperTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    t.end()
  })

  soapRequestMapperTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  soapRequestMapperTest.test('mapToQueryProfileRequest should', mapToQueryProfileRequestTest => {
    mapToQueryProfileRequestTest.test('map params to query profile object', test => {
      let params = { ProfileID: 'Test-Profile' }

      let mapped = SoapRequestMapper.mapToQueryProfileRequest(params)
      test.equal(mapped.profileName, params.ProfileID)
      test.end()
    })

    mapToQueryProfileRequestTest.end()
  })

  soapRequestMapperTest.test('mapToCreateUpdateProfileRequest should', mapToCreateUpdateProfileRequestTest => {
    mapToCreateUpdateProfileRequestTest.test('map params to profile object', test => {
      let record = { Order: '10', Preference: '1', DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'U', attributes: { ttl: '900' }, Replacement: '.', Partner: [{ attributes: { id: 'ALL' } }] }
      let profile = { ProfileID: 'TestProfile', Tier: '2', NAPTR: record }

      let mapped = SoapRequestMapper.mapToCreateUpdateProfileRequest(profile)
      test.equal(mapped.profileName, profile.ProfileID)
      test.equal(mapped.tier, parseInt(profile.Tier))
      test.equal(mapped.records.length, 1)

      let mappedRecord = mapped.records[0]
      test.equal(mappedRecord.order, parseInt(record.Order))
      test.equal(mappedRecord.preference, parseInt(record.Preference))
      test.equal(mappedRecord.ttl, parseInt(record.attributes.ttl))
      test.equal(mappedRecord.domainName, record.DomainName)
      test.equal(mappedRecord.flags, record.Flags.toLowerCase())
      test.equal(mappedRecord.service, record.Service)
      test.equal(mappedRecord.regexp, record.Regexp.attributes.pattern)
      test.equal(mappedRecord.uri, record.Regexp.$value)
      test.equal(mappedRecord.replacement, record.Replacement)
      test.equal(mappedRecord.partnerId, record.Partner[0].attributes.id)
      test.equal(mappedRecord.countryCode, false)
      test.end()
    })

    mapToCreateUpdateProfileRequestTest.test('map params to profile object with multiple records', test => {
      let record = { Order: '10', Preference: '1', DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.505@test.org' }, Flags: 'U', attributes: { ttl: '900' }, Replacement: '.', Partner: [{ attributes: { id: 'ALL' } }] }
      let record2 = { Order: '10', Preference: '2', DomainName: 'e164enum.net', Service: 'test', Regexp: { attributes: { pattern: '^.*$' }, $value: 'mm:001.506@test.org' }, Flags: 'U', attributes: { ttl: '900' }, Replacement: '.', Partner: [{ attributes: { id: 'ALL' } }] }
      let profile = { ProfileID: 'TestProfile', Tier: '2', NAPTR: [record, record2] }

      let mapped = SoapRequestMapper.mapToCreateUpdateProfileRequest(profile)
      test.equal(mapped.profileName, profile.ProfileID)
      test.equal(mapped.tier, parseInt(profile.Tier))
      test.equal(mapped.records.length, 2)

      let mappedRecord = mapped.records[0]
      test.equal(mappedRecord.order, parseInt(record.Order))
      test.equal(mappedRecord.preference, parseInt(record.Preference))
      test.equal(mappedRecord.ttl, parseInt(record.attributes.ttl))
      test.equal(mappedRecord.domainName, record.DomainName)
      test.equal(mappedRecord.flags, record.Flags.toLowerCase())
      test.equal(mappedRecord.service, record.Service)
      test.equal(mappedRecord.regexp, record.Regexp.attributes.pattern)
      test.equal(mappedRecord.uri, record.Regexp.$value)
      test.equal(mappedRecord.replacement, record.Replacement)
      test.equal(mappedRecord.partnerId, record.Partner[0].attributes.id)
      test.equal(mappedRecord.countryCode, false)

      let mappedRecord2 = mapped.records[1]
      test.equal(mappedRecord2.order, parseInt(record2.Order))
      test.equal(mappedRecord2.preference, parseInt(record2.Preference))
      test.equal(mappedRecord2.ttl, parseInt(record2.attributes.ttl))
      test.equal(mappedRecord2.domainName, record2.DomainName)
      test.equal(mappedRecord2.flags, record2.Flags.toLowerCase())
      test.equal(mappedRecord2.service, record2.Service)
      test.equal(mappedRecord2.regexp, record2.Regexp.attributes.pattern)
      test.equal(mappedRecord2.uri, record2.Regexp.$value)
      test.equal(mappedRecord2.replacement, record2.Replacement)
      test.equal(mappedRecord2.partnerId, record2.Partner[0].attributes.id)
      test.equal(mappedRecord2.countryCode, false)

      test.end()
    })

    mapToCreateUpdateProfileRequestTest.end()
  })

  soapRequestMapperTest.test('mapToPhoneRequest should', mapToPhoneRequestTest => {
    mapToPhoneRequestTest.test('map params to phone query object', test => {
      let params = { TN: { Base: ['5158675309'], CountryCode: '6' } }

      let mapped = SoapRequestMapper.mapToPhoneRequest(params)
      test.equal(mapped.number, params.TN.Base[0])
      test.equal(mapped.countryCode, params.TN.CountryCode)
      test.end()
    })

    mapToPhoneRequestTest.test('use default for countryCode if not present', test => {
      let params = { TN: { Base: ['5158675309'] } }

      let mapped = SoapRequestMapper.mapToPhoneRequest(params)
      test.equal(mapped.number, params.TN.Base[0])
      test.equal(mapped.countryCode, '1')
      test.end()
    })

    mapToPhoneRequestTest.end()
  })

  soapRequestMapperTest.test('mapToChangePhoneStatusRequest should', mapToChangePhoneStatusRequestTest => {
    mapToChangePhoneStatusRequestTest.test('map params to phone and profile name', test => {
      let params = { TN: { Base: ['5158675309'], CountryCode: '6' }, DNSProfileID: 'Test-Profile', Status: 'active' }

      let mapped = SoapRequestMapper.mapToChangePhoneStatusRequest(params)
      test.equal(mapped.phone.number, params.TN.Base[0])
      test.equal(mapped.phone.countryCode, params.TN.CountryCode)
      test.equal(mapped.profileName, params.DNSProfileID)
      test.equal(mapped.status, params.Status)
      test.end()
    })

    mapToChangePhoneStatusRequestTest.test('use default status of active if Status missing', test => {
      let params = { TN: { Base: '5158675309', CountryCode: '6' }, DNSProfileID: 'Test-Profile' }

      let mapped = SoapRequestMapper.mapToChangePhoneStatusRequest(params)
      test.equal(mapped.status, 'active')
      test.end()
    })

    mapToChangePhoneStatusRequestTest.test('lowercase status value if present', test => {
      let params = { TN: { Base: '5158675309', CountryCode: '6' }, DNSProfileID: 'Test-Profile', Status: 'ACTIVE' }

      let mapped = SoapRequestMapper.mapToChangePhoneStatusRequest(params)
      test.equal(mapped.status, params.Status.toLowerCase())
      test.end()
    })

    mapToChangePhoneStatusRequestTest.end()
  })

  soapRequestMapperTest.test('mapToQueryPhoneRequest should', mapToQueryPhoneRequestTest => {
    mapToQueryPhoneRequestTest.test('map params to phone query object', test => {
      let params = { TN: { Base: ['5158675309'], CountryCode: '6' } }

      let mapped = SoapRequestMapper.mapToQueryPhoneRequest(params)
      test.equal(mapped.phone.number, params.TN.Base[0])
      test.equal(mapped.phone.countryCode, params.TN.CountryCode)
      test.equal(mapped.profileName, '')
      test.end()
    })

    mapToQueryPhoneRequestTest.test('map params to profile name', test => {
      let params = { DNSProfileID: 'TestProfile' }

      let mapped = SoapRequestMapper.mapToQueryPhoneRequest(params)
      test.equal(mapped.profileName, params.DNSProfileID)
      test.ok(mapped.phone)
      test.notOk(mapped.phone.number)
      test.notOk(mapped.phone.countryCode)
      test.end()
    })

    mapToQueryPhoneRequestTest.test('map to phone if both present', test => {
      let params = { TN: { Base: ['5158675309'], CountryCode: '6' }, DNSProfileID: 'TestProfile' }

      let mapped = SoapRequestMapper.mapToQueryPhoneRequest(params)
      test.equal(mapped.phone.number, params.TN.Base[0])
      test.equal(mapped.phone.countryCode, params.TN.CountryCode)
      test.end()
    })

    mapToQueryPhoneRequestTest.test('map to empty object if none present', test => {
      let params = {}

      let mapped = SoapRequestMapper.mapToQueryPhoneRequest(params)
      test.equal(mapped.profileName, '')
      test.ok(mapped.phone)
      test.notOk(mapped.phone.number)
      test.notOk(mapped.phone.countryCode)
      test.end()
    })

    mapToQueryPhoneRequestTest.end()
  })

  soapRequestMapperTest.end()
})
