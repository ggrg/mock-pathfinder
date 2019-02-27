'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const EventEmitter = require('events').EventEmitter
const Logger = require('@mojaloop/central-services-shared').Logger
const Soap = require(`${src}/services/provisioning/soap`)
const ProvisioningService = require(`${src}/services/provisioning`)

Test('ProvisioningService', provisioningServiceTest => {
  let sandbox
  let defaultSettings = { PORT: 1234, PATH: '/test/service', WSDL_FILE: './test.wsdl' }

  provisioningServiceTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Logger)
    sandbox.stub(Soap)
    t.end()
  })

  provisioningServiceTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  provisioningServiceTest.test('create should', createTest => {
    createTest.test('create new provisioning service and setup', test => {
      let soapServer = {}
      Soap.createServer.returns(soapServer)

      let service = ProvisioningService.create(defaultSettings)

      test.notOk(service._bound)
      test.equal(service._port, defaultSettings.PORT)
      test.equal(service._soapServer, soapServer)
      test.ok(Soap.createServer.calledWith(defaultSettings))
      test.end()
    })

    createTest.end()
  })

  provisioningServiceTest.test('start should', startTest => {
    startTest.test('call listen method on SOAP server and wait for listening event to resolve', test => {
      let soapServer = new EventEmitter()
      soapServer.listen = sandbox.stub()

      Soap.createServer.returns(soapServer)

      let service = ProvisioningService.create(defaultSettings)
      test.notOk(service._bound)

      let startPromise = service.start()

      soapServer.emit('listening')

      startPromise
        .then(() => {
          test.ok(service._bound)
          test.ok(soapServer.listen.calledOnce)
          test.ok(soapServer.listen.calledWith(defaultSettings.PORT))
          test.ok(Logger.info.calledWith('Provisioning service listening on port %s', defaultSettings.PORT))
          test.end()
        })
    })

    startTest.end()
  })

  provisioningServiceTest.end()
})
