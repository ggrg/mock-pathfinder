'use strict'

const src = '../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Fs = require('fs')
const Http = require('http')
const EventEmitter = require('events').EventEmitter
const Logger = require('@mojaloop/central-services-shared').Logger
const Soap = require('soap')
const SoapService = require(`${src}/services/provisioning/soap/service`)
const SoapServer = require(`${src}/services/provisioning/soap/server`)

Test('SoapServer', soapServerTest => {
  let sandbox
  let defaultSettings = { PATH: '/test/service', WSDL_FILE: './test.wsdl' }

  soapServerTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Logger)
    sandbox.stub(Soap)
    sandbox.stub(Http)
    sandbox.stub(Fs, 'readFileSync')
    t.end()
  })

  soapServerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  soapServerTest.test('create should', createTest => {
    createTest.test('create new soap server and setup', test => {
      let httpServer = {}
      Http.createServer.returns(httpServer)

      let service = SoapServer.create(defaultSettings)

      test.notOk(service._bound)
      test.notOk(service._soapServer)
      test.equal(service._path, defaultSettings.PATH)
      test.equal(service._wsdlFile, defaultSettings.WSDL_FILE)
      test.equal(service._httpServer, httpServer)
      test.end()
    })

    createTest.test('setup http server with default handler', test => {
      let request = { url: 'http://localhost:8000/test' }
      let response = { end: sandbox.stub() }
      Http.createServer.returns({})

      SoapServer.create(defaultSettings)

      Http.createServer.callArgWith(0, request, response)

      test.ok(response.end.calledWith('404: Not Found: ' + request.url))
      test.end()
    })

    createTest.end()
  })

  soapServerTest.test('listen should', startTest => {
    startTest.test('call listen method on HTTP server & internal SOAP server and emit listening event', test => {
      let port = 1111

      let wsdl = {}
      Fs.readFileSync.returns(wsdl)

      let httpServer = new EventEmitter()
      httpServer.listen = sandbox.stub()
      Http.createServer.returns(httpServer)

      let internalSoapServer = { }
      Soap.listen.returns(internalSoapServer)

      let listeningSpy = sandbox.spy()

      let server = SoapServer.create(defaultSettings)
      server.on('listening', listeningSpy)

      server.listen(port)

      httpServer.emit('listening')

      test.ok(server._bound)
      test.ok(Fs.readFileSync.calledWith(defaultSettings.WSDL_FILE, 'utf8'))
      test.ok(httpServer.listen.calledWith(port))
      test.ok(Soap.listen.calledWith(httpServer, defaultSettings.PATH, SoapService.service, wsdl))
      test.equal(server._soapServer, internalSoapServer)
      test.ok(listeningSpy.calledOnce)
      test.end()
    })

    startTest.test('setup logging on SOAP server', test => {
      let wsdl = {}
      Fs.readFileSync.returns(wsdl)

      let httpServer = new EventEmitter()
      httpServer.listen = sandbox.stub()
      Http.createServer.returns(httpServer)

      let internalSoapServer = { }
      Soap.listen.returns(internalSoapServer)

      let server = SoapServer.create(defaultSettings)

      server.listen(1111)

      httpServer.emit('listening')

      let type = 'request'
      let data = 'this was a SOAP request'
      internalSoapServer.log(type, data)
      test.ok(Logger.info.calledWith(`SOAP ${type} message: ${data}`))
      test.end()
    })

    startTest.end()
  })

  soapServerTest.end()
})
