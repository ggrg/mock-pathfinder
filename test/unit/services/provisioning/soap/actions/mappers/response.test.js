'use strict'

const src = '../../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Uuid = require('uuid4')
const Moment = require('moment')
const SoapResponseMapper = require(`${src}/services/provisioning/soap/actions/mappers/response`)

Test('SoapResponseMapper', soapResponseMapperTest => {
  let sandbox

  soapResponseMapperTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Moment, 'utc')
    t.end()
  })

  soapResponseMapperTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  const testNaptr = (test, naptr, record) => {
    test.ok(naptr)
    test.equal(naptr.attributes.ttl, record.ttl)
    test.equal(naptr.DomainName, record.domainName)
    test.equal(naptr.Preference, record.preference)
    test.equal(naptr.Order, record.order)
    test.equal(naptr.Flags, record.flags.toLowerCase())
    test.equal(naptr.Service, record.service)
    test.equal(naptr.Regexp.attributes.pattern, record.regexp)
    test.equal(naptr.Regexp.$value, record.uri)
    test.equal(naptr.Replacement, record.replacement)
    test.equal(naptr.CountryCode, false)
    test.equal(naptr.Partner.attributes.id, record.partnerId)
  }

  soapResponseMapperTest.test('mapToProfileResponse should', mapToProfileResponseTest => {
    mapToProfileResponseTest.test('map profile and records to profile response object', test => {
      let profileId = Uuid()
      let customerId = 1111

      let created = Moment()

      let profile = { profileId, name: 'Test-Profile', tier: 2, created }
      let records = [{
        recordId: Uuid(),
        profileId,
        ttl: 900,
        domainName: 'e164enum.net',
        preference: 1,
        order: 10,
        flags: 'u',
        service: 'E2U+mm',
        regexp: '^.*$',
        uri: 'mm:001.504@test.org',
        replacement: '.',
        partnerId: '-1'
      }, {
        recordId: Uuid(),
        profileId,
        ttl: 900,
        domainName: 'e164enum.net',
        preference: 2,
        order: 10,
        flags: 'u',
        service: 'E2U+mm',
        regexp: '^.*$',
        uri: 'mm:001.505@test.org',
        replacement: '.',
        partnerId: '-1'
      }]

      let formattedDate = created.format()
      Moment.utc.withArgs(created).returns({ format: sandbox.stub().returns(formattedDate) })

      let mapped = SoapResponseMapper.mapToProfileResponse(profile, records, customerId)

      test.ok(mapped['DNSProfileData'])

      let profData = mapped['DNSProfileData']
      test.equal(profData['ProfileID'], profile.name)
      test.equal(profData['Customer']['attributes']['id'], customerId)
      test.equal(profData['DateCreated'], formattedDate)
      test.equal(profData['IsInUse'], false)
      test.equal(profData['Tier'], profile.tier)

      let naptrData = profData['NAPTR']
      test.equal(naptrData.length, 2)
      testNaptr(test, naptrData[0], records[0])
      testNaptr(test, naptrData[1], records[1])

      test.end()
    })

    mapToProfileResponseTest.end()
  })

  soapResponseMapperTest.test('mapToPhoneNumberResponse should', mapPhoneNumberResponseTest => {
    mapPhoneNumberResponseTest.test('map phone and profile to phone number response array', test => {
      let profileId = Uuid()
      let customerId = 1111

      let created = Moment()

      let phone = { phoneId: Uuid(), profileId, number: '5558675309', countryCode: '1', status: 'active', created }
      let profile = { profileId, name: 'Test-Profile', tier: 2 }

      let formattedDate = created.format('ddd MMM DD HH:mm:ss [GMT] YYYY')
      Moment.utc.withArgs(created).returns({ format: sandbox.stub().returns(formattedDate) })

      let mapped = SoapResponseMapper.mapToPhoneNumberResponse(phone, profile, customerId)

      test.ok(mapped['TNData'])

      let tnData = mapped['TNData']
      test.equal(tnData.length, 1)

      test.equal(tnData[0]['TN']['Base'], phone.number)
      test.equal(tnData[0]['TN']['CountryCode'], phone.countryCode)
      test.equal(tnData[0]['Customer']['attributes']['id'], customerId)
      test.equal(tnData[0]['DateCreated'], formattedDate)
      test.equal(tnData[0]['DateUpdated'], formattedDate)
      test.equal(tnData[0]['Status'], phone.status)
      test.equal(tnData[0]['DNSProfileID'], profile.name)
      test.equal(tnData[0]['Tier'], profile.tier)
      test.end()
    })

    mapPhoneNumberResponseTest.test('map phone array and profile to phone number response array', test => {
      let profileId = Uuid()
      let customerId = 1111

      let created = Moment()

      let phone = { phoneId: Uuid(), profileId, number: '5558675309', countryCode: '1', status: 'active', created }
      let phone2 = { phoneId: Uuid(), profileId, number: '5558675310', countryCode: '1', status: 'active', created }
      let profile = { profileId, name: 'Test-Profile', tier: 2 }

      let formattedDate = created.format('ddd MMM DD HH:mm:ss [GMT] YYYY')
      Moment.utc.withArgs(created).returns({ format: sandbox.stub().returns(formattedDate) })

      let mapped = SoapResponseMapper.mapToPhoneNumberResponse([phone, phone2], profile, customerId)

      test.ok(mapped['TNData'])

      let tnData = mapped['TNData']
      test.equal(tnData.length, 2)

      test.equal(tnData[0]['TN']['Base'], phone.number)
      test.equal(tnData[0]['TN']['CountryCode'], phone.countryCode)
      test.equal(tnData[0]['Customer']['attributes']['id'], customerId)
      test.equal(tnData[0]['DateCreated'], formattedDate)
      test.equal(tnData[0]['DateUpdated'], formattedDate)
      test.equal(tnData[0]['Status'], phone.status)
      test.equal(tnData[0]['DNSProfileID'], profile.name)
      test.equal(tnData[0]['Tier'], profile.tier)

      test.equal(tnData[1]['TN']['Base'], phone2.number)
      test.equal(tnData[1]['TN']['CountryCode'], phone2.countryCode)
      test.equal(tnData[1]['Customer']['attributes']['id'], customerId)
      test.equal(tnData[1]['DateCreated'], formattedDate)
      test.equal(tnData[1]['DateUpdated'], formattedDate)
      test.equal(tnData[1]['Status'], phone2.status)
      test.equal(tnData[1]['DNSProfileID'], profile.name)
      test.equal(tnData[1]['Tier'], profile.tier)

      test.end()
    })

    mapPhoneNumberResponseTest.end()
  })

  soapResponseMapperTest.end()
})
