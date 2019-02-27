'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const EventEmitter = require('events').EventEmitter
const Logger = require('@mojaloop/central-services-shared').Logger
const PhoneFormat = require(`${src}/lib/phone`)
const PhoneService = require(`${src}/domain/phone`)
const RecordService = require(`${src}/domain/record`)
const Dns = require(`${src}/services/query/dns`)
const QueryService = require(`${src}/services/query`)

Test('QueryService', queryServiceTest => {
  let sandbox
  let defaultRecord = {}
  let defaultSettings
  const NaptrType = 35

  queryServiceTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Dns, 'NAPTR')
    sandbox.stub(Dns.NAPTR, 'value').value(NaptrType)
    sandbox.stub(Dns, 'createServer')
    sandbox.stub(PhoneFormat, 'enumDomainToParsedPhone')
    sandbox.stub(PhoneService, 'getByNumber')
    sandbox.stub(RecordService, 'getByProfileId')
    sandbox.stub(Logger)

    defaultRecord = {
      order: 10,
      preference: 50,
      flags: 'u',
      service: 'E2U+pstn:tel',
      regexp: '!^(.*)$!tel:\\1;q_stat=102!',
      replacement: '',
      ttl: 900
    }

    defaultSettings = { PORT: 1234, DEFAULT_RECORD: defaultRecord }

    t.end()
  })

  queryServiceTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  queryServiceTest.test('create should', createTest => {
    createTest.test('create new query server and setup', test => {
      let onStub = sandbox.stub()

      let dnsServer = { on: onStub, type: 'UDP' }
      Dns.createServer.returns(dnsServer)

      let service = QueryService.create(defaultSettings)

      test.ok(Dns.createServer.calledOnce)
      test.ok(onStub.calledThrice)
      test.notOk(service._bound)
      test.equal(service._port, defaultSettings.PORT)
      test.equal(service._defaultRecord, defaultSettings.DEFAULT_RECORD)
      test.end()
    })

    createTest.end()
  })

  queryServiceTest.test('start should', startTest => {
    startTest.test('call listen method on DNS server and wait for listening event to resolve', test => {
      let dnsServer = new EventEmitter()
      dnsServer.listen = sandbox.stub()
      dnsServer.type = 'UDP'

      Dns.createServer.returns(dnsServer)

      let service = QueryService.create(defaultSettings)
      test.notOk(service._bound)

      let startPromise = service.start()

      dnsServer.emit('listening')

      startPromise
        .then(() => {
          test.ok(service._bound)
          test.ok(dnsServer.listen.calledOnce)
          test.ok(dnsServer.listen.calledWith(defaultSettings.PORT))
          test.ok(Logger.info.calledWith('Query service listening over %s on port %s', dnsServer.type, defaultSettings.PORT))
          test.end()
        })
    })

    startTest.end()
  })

  queryServiceTest.test('receiving close event should', closeTest => {
    closeTest.test('log close message', test => {
      let dnsServer = new EventEmitter()
      Dns.createServer.returns(dnsServer)

      QueryService.create(defaultSettings)

      dnsServer.emit('close')

      test.ok(Logger.info.calledWith('Query service closed'))
      test.end()
    })

    closeTest.end()
  })

  queryServiceTest.test('receiving error event should', errorTest => {
    errorTest.test('log error message', test => {
      let dnsServer = new EventEmitter()
      Dns.createServer.returns(dnsServer)

      QueryService.create(defaultSettings)

      let err = new Error('Bad stuff')
      dnsServer.emit('error', err)

      test.ok(Logger.error.calledWith('Query service error', err))
      test.end()
    })

    errorTest.end()
  })

  queryServiceTest.test('receiving request event should', requestTest => {
    requestTest.test('log error and return empty response if not NAPTR request', test => {
      let request = {}
      request.question = [{ name: 'test', type: 1 }]

      let response = {}
      response.answer = []
      response.send = sandbox.stub()

      let dnsServer = new EventEmitter()
      Dns.createServer.returns(dnsServer)

      QueryService.create(defaultSettings)

      dnsServer.emit('request', request, response)
      test.ok(Logger.error.withArgs('Unsupported record type: %s', request.question[0].type))
      test.equal(response.answer.length, 0)
      test.ok(response.send.calledOnce)
      test.end()
    })

    requestTest.test('retrieve matching records for name and send response with default record', test => {
      let name = '9.0.3.5.7.6.8.5.5.5.1.e164.enum.net'

      let request = {}
      request.question = [{ name, type: NaptrType }]

      let response = {}
      response.header = {}
      response.answer = []
      response.send = sandbox.stub()

      let dnsServer = new EventEmitter()
      Dns.createServer.returns(dnsServer)

      let parsedPhone = { nationalNumber: '5558675309', countryCode: '1', isValidNumber: true }
      PhoneFormat.enumDomainToParsedPhone.returns(parsedPhone)

      let profileId = 'profile-id'
      let foundPhone = { profileId, status: 'active' }
      let getByNumberPromise = P.resolve(foundPhone)
      PhoneService.getByNumber.returns(getByNumberPromise)

      let records = [{ order: 10, preference: 1, service: 'test', flags: 'u', regexp: '^(.*)', uri: 'mm:001.504@test.org', replacement: '', ttl: 300 }, { order: 10, preference: 2, service: 'test', flags: 'u', regexp: '^(.*)', uri: 'mm:001.506@test.org', replacement: '', ttl: 600 }]
      let getByProfileIdPromise = P.resolve(records)
      RecordService.getByProfileId.returns(getByProfileIdPromise)

      QueryService.create(defaultSettings)

      dnsServer.emit('request', request, response)

      getByNumberPromise
        .then(() => getByProfileIdPromise)
        .then(() => {
          test.ok(Logger.info.withArgs('*** DNS Request ***').calledOnce)
          test.ok(Logger.info.withArgs(request).calledOnce)
          test.ok(PhoneFormat.enumDomainToParsedPhone.calledWith(name))
          test.ok(PhoneService.getByNumber.calledWith(parsedPhone.nationalNumber, parsedPhone.countryCode))
          test.ok(RecordService.getByProfileId.calledWith(profileId))
          test.ok(Dns.NAPTR.calledThrice)
          test.ok(Dns.NAPTR.calledWith(sandbox.match({
            name,
            order: records[0].order,
            preference: records[0].preference,
            flags: records[0].flags,
            service: records[0].service,
            regexp: `!${records[0].regexp}!${records[0].uri}!`,
            replacement: records[0].replacement,
            ttl: records[0].ttl
          })))
          test.ok(Dns.NAPTR.calledWith(sandbox.match({
            name,
            order: records[1].order,
            preference: records[1].preference,
            flags: records[1].flags,
            service: records[1].service,
            regexp: `!${records[1].regexp}!${records[1].uri}!`,
            replacement: records[1].replacement,
            ttl: records[1].ttl
          })))
          test.ok(Dns.NAPTR.calledWith(sandbox.match({
            name,
            order: defaultRecord.order,
            preference: defaultRecord.preference,
            flags: defaultRecord.flags,
            service: defaultRecord.service,
            regexp: defaultRecord.regexp,
            replacement: defaultRecord.replacement,
            ttl: defaultRecord.ttl
          })))
          test.end()
        })
    })

    requestTest.test('convert replacment of . to empty string', test => {
      let name = '9.0.3.5.7.6.8.5.5.5.1.e164.enum.net'

      let request = {}
      request.question = [{ name, type: 35 }]

      let response = {}
      response.header = {}
      response.answer = []
      response.send = sandbox.stub()

      let dnsServer = new EventEmitter()
      Dns.createServer.returns(dnsServer)

      let parsedPhone = { nationalNumber: '5558675309', countryCode: '1', isValidNumber: true }
      PhoneFormat.enumDomainToParsedPhone.returns(parsedPhone)

      let profileId = 'profile-id'
      let foundPhone = { profileId, status: 'active' }
      let getByNumberPromise = P.resolve(foundPhone)
      PhoneService.getByNumber.returns(getByNumberPromise)

      let records = [{ order: 10, preference: 1, service: 'test', flags: 'u', regexp: '^(.*)', uri: 'mm:001.504@test.org', replacement: '.', ttl: 300 }]
      let getByProfileIdPromise = P.resolve(records)
      RecordService.getByProfileId.returns(getByProfileIdPromise)

      QueryService.create(defaultSettings)

      dnsServer.emit('request', request, response)

      getByNumberPromise
        .then(() => getByProfileIdPromise)
        .then(() => {
          test.ok(Logger.info.withArgs('*** DNS Request ***').calledOnce)
          test.ok(Logger.info.withArgs(request).calledOnce)
          test.ok(PhoneFormat.enumDomainToParsedPhone.calledWith(name))
          test.ok(PhoneService.getByNumber.calledWith(parsedPhone.nationalNumber, parsedPhone.countryCode))
          test.ok(RecordService.getByProfileId.calledWith(profileId))
          test.ok(Dns.NAPTR.calledTwice)
          test.ok(Dns.NAPTR.calledWith(sandbox.match({
            name,
            order: records[0].order,
            preference: records[0].preference,
            flags: records[0].flags,
            service: records[0].service,
            regexp: `!${records[0].regexp}!${records[0].uri}!`,
            replacement: '',
            ttl: records[0].ttl
          })))
          test.ok(Dns.NAPTR.calledWith(sandbox.match({
            name,
            order: defaultRecord.order,
            preference: defaultRecord.preference,
            flags: defaultRecord.flags,
            service: defaultRecord.service,
            regexp: defaultRecord.regexp,
            replacement: defaultRecord.replacement,
            ttl: defaultRecord.ttl
          })))
          test.end()
        })
    })

    requestTest.test('send default record if invalid number', test => {
      let name = '9.0.3.5.7.6.8.5.5.5.1.e164.enum.net'

      let request = {}
      request.question = [{ name, type: 35 }]

      let response = {}
      response.header = {}
      response.answer = []
      response.send = sandbox.stub()

      let dnsServer = new EventEmitter()
      Dns.createServer.returns(dnsServer)

      let parsedPhone = { nationalNumber: '5558675309', countryCode: '1', isValidNumber: false }
      PhoneFormat.enumDomainToParsedPhone.returns(parsedPhone)

      QueryService.create(defaultSettings)

      dnsServer.emit('request', request, response)

      test.ok(Logger.info.withArgs('*** DNS Request ***').calledOnce)
      test.ok(Logger.info.withArgs(request).calledOnce)
      test.ok(PhoneFormat.enumDomainToParsedPhone.calledWith(name))
      test.ok(Dns.NAPTR.calledOnce)
      test.ok(Dns.NAPTR.calledWith(sandbox.match({
        name,
        order: defaultRecord.order,
        preference: defaultRecord.preference,
        flags: defaultRecord.flags,
        service: defaultRecord.service,
        regexp: defaultRecord.regexp,
        replacement: defaultRecord.replacement,
        ttl: defaultRecord.ttl
      })))
      test.end()
    })

    requestTest.test('send default record if phone matching name not found', test => {
      let name = '9.0.3.5.7.6.8.5.5.5.1.e164.enum.net'

      let request = {}
      request.question = [{ name, type: 35 }]

      let response = {}
      response.header = {}
      response.answer = []
      response.send = sandbox.stub()

      let dnsServer = new EventEmitter()
      Dns.createServer.returns(dnsServer)

      let parsedPhone = { nationalNumber: '5558675309', countryCode: '1', isValidNumber: true }
      PhoneFormat.enumDomainToParsedPhone.returns(parsedPhone)

      let getByNumberPromise = P.resolve(null)
      PhoneService.getByNumber.returns(getByNumberPromise)

      QueryService.create(defaultSettings)

      dnsServer.emit('request', request, response)

      getByNumberPromise
        .then(() => {
          test.ok(Logger.info.withArgs('*** DNS Request ***').calledOnce)
          test.ok(Logger.info.withArgs(request).calledOnce)
          test.ok(PhoneFormat.enumDomainToParsedPhone.calledWith(name))
          test.ok(PhoneService.getByNumber.calledWith(parsedPhone.nationalNumber, parsedPhone.countryCode))
          test.ok(Dns.NAPTR.calledOnce)
          test.ok(Dns.NAPTR.calledWith(sandbox.match({
            name,
            order: defaultRecord.order,
            preference: defaultRecord.preference,
            flags: defaultRecord.flags,
            service: defaultRecord.service,
            regexp: defaultRecord.regexp,
            replacement: defaultRecord.replacement,
            ttl: defaultRecord.ttl
          })))
          test.end()
        })
    })

    requestTest.test('send default record if inactive phone found for name', test => {
      let name = '9.0.3.5.7.6.8.5.5.5.1.e164.enum.net'

      let request = {}
      request.question = [{ name, type: 35 }]

      let response = {}
      response.header = {}
      response.answer = []
      response.send = sandbox.stub()

      let dnsServer = new EventEmitter()
      Dns.createServer.returns(dnsServer)

      let parsedPhone = { nationalNumber: '5558675309', countryCode: '1', isValidNumber: true }
      PhoneFormat.enumDomainToParsedPhone.returns(parsedPhone)

      let profileId = 'profile-id'
      let foundPhone = { profileId, status: 'inactive' }
      let getByNumberPromise = P.resolve(foundPhone)
      PhoneService.getByNumber.returns(getByNumberPromise)

      QueryService.create(defaultSettings)

      dnsServer.emit('request', request, response)

      getByNumberPromise
        .then(() => {
          test.ok(Logger.info.withArgs('*** DNS Request ***').calledOnce)
          test.ok(Logger.info.withArgs(request).calledOnce)
          test.ok(PhoneFormat.enumDomainToParsedPhone.calledWith(name))
          test.ok(PhoneService.getByNumber.calledWith(parsedPhone.nationalNumber, parsedPhone.countryCode))
          test.ok(Dns.NAPTR.calledOnce)
          test.ok(Dns.NAPTR.calledWith(sandbox.match({
            name,
            order: defaultRecord.order,
            preference: defaultRecord.preference,
            flags: defaultRecord.flags,
            service: defaultRecord.service,
            regexp: defaultRecord.regexp,
            replacement: defaultRecord.replacement,
            ttl: defaultRecord.ttl
          })))
          test.end()
        })
    })

    requestTest.test('send default record if no records found for name', test => {
      let name = '9.0.3.5.7.6.8.5.5.5.1.e164.enum.net'

      let request = {}
      request.question = [{ name, type: 35 }]

      let response = {}
      response.header = {}
      response.answer = []
      response.send = sandbox.stub()

      let dnsServer = new EventEmitter()
      Dns.createServer.returns(dnsServer)

      let parsedPhone = { nationalNumber: '5558675309', countryCode: '1', isValidNumber: true }
      PhoneFormat.enumDomainToParsedPhone.returns(parsedPhone)

      let profileId = 'profile-id'
      let foundPhone = { profileId, status: 'active' }
      let getByNumberPromise = P.resolve(foundPhone)
      PhoneService.getByNumber.returns(getByNumberPromise)

      let records = []
      let getByProfileIdPromise = P.resolve(records)
      RecordService.getByProfileId.returns(getByProfileIdPromise)

      QueryService.create(defaultSettings)

      dnsServer.emit('request', request, response)

      getByNumberPromise
        .then(() => getByProfileIdPromise)
        .then(() => {
          test.ok(Logger.info.withArgs('*** DNS Request ***').calledOnce)
          test.ok(Logger.info.withArgs(request).calledOnce)
          test.ok(PhoneFormat.enumDomainToParsedPhone.calledWith(name))
          test.ok(PhoneService.getByNumber.calledWith(parsedPhone.nationalNumber, parsedPhone.countryCode))
          test.ok(RecordService.getByProfileId.calledWith(profileId))
          test.ok(Dns.NAPTR.calledOnce)
          test.ok(Dns.NAPTR.calledWith(sandbox.match({
            name,
            order: defaultRecord.order,
            preference: defaultRecord.preference,
            flags: defaultRecord.flags,
            service: defaultRecord.service,
            regexp: defaultRecord.regexp,
            replacement: defaultRecord.replacement,
            ttl: defaultRecord.ttl
          })))
          test.end()
        })
    })

    requestTest.end()
  })

  queryServiceTest.end()
})
