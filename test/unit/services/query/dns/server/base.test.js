'use strict'

const src = '../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const EventEmitter = require('events').EventEmitter
const Fixtures = require('../../../../fixtures')
const DnsRequest = require(`${src}/services/query/dns/request`)
const DnsResponse = require(`${src}/services/query/dns/response`)
const BaseServer = require(`${src}/services/query/dns/server/base`)

// TestServer to allow us to test BaseServer functionality
class TestServer extends BaseServer {
  constructor (socket, opts = {}) {
    super(opts)

    this._socket = socket
    this._setupSocket()
  }
}

Test('BaseServer', baseServerTest => {
  let sandbox

  baseServerTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(DnsRequest, 'parse')
    sandbox.stub(DnsResponse, 'fromRequest')
    t.end()
  })

  baseServerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  baseServerTest.test('listen should', listenTest => {
    listenTest.test('throw exception in base class', test => {
      let server = new TestServer(new EventEmitter())
      test.throws(() => server.listen(1111, 'localhost'), /The listen method must be overridden!/)
      test.end()
    })

    listenTest.end()
  })

  baseServerTest.test('close should', closeTest => {
    closeTest.test('call close method on internal socket and emit close event', test => {
      let socket = new EventEmitter()
      socket.close = sandbox.stub()
      socket.close.callsArg(0)

      let closeSpy = sandbox.spy()

      let server = new TestServer(socket)
      server._bound = true
      server.on('close', closeSpy)

      server.close()

      test.ok(closeSpy.called)
      test.ok(socket.close.calledOnce)
      test.notOk(server._bound)
      test.end()
    })

    closeTest.test('do nothing if internal server not bound', test => {
      let socket = new EventEmitter()
      socket.close = sandbox.stub()

      let server = new TestServer(socket)
      server._bound = false

      server.close()

      test.notOk(socket.close.called)
      test.end()
    })

    closeTest.end()
  })

  baseServerTest.test('handleMessage should', handleMessageTest => {
    handleMessageTest.test('parse message and emit request event', test => {
      let server = new TestServer(new EventEmitter())

      let requestSpy = sandbox.spy()
      server.on('request', requestSpy)

      let dnsRequest = {}
      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let receiveBuffer = Fixtures.writePacketToBuffer(packet)
      DnsRequest.parse.withArgs(receiveBuffer).returns(dnsRequest)

      let dnsResponse = {}
      let connection = {}
      DnsResponse.fromRequest.withArgs(dnsRequest, connection).returns(dnsResponse)

      server.handleMessage(receiveBuffer, connection)

      test.ok(requestSpy.called)
      test.ok(requestSpy.calledWithExactly(dnsRequest, dnsResponse))
      test.end()
    })

    handleMessageTest.test('emit error event if exception parsing request object', test => {
      let server = new TestServer(new EventEmitter())

      let requestSpy = sandbox.spy()
      let errorSpy = sandbox.spy()
      server.on('error', errorSpy)
      server.on('request', requestSpy)

      let connection = {}
      let receiveBuffer = Buffer.from('junk data')
      let parseError = new Error('Error parsing request')
      DnsRequest.parse.withArgs(receiveBuffer).throws(parseError)

      server.handleMessage(receiveBuffer, connection)

      test.notOk(requestSpy.called)
      test.ok(errorSpy.calledWith(parseError))
      test.end()
    })

    handleMessageTest.test('emit error event if exception creating response object', test => {
      let server = new TestServer(new EventEmitter())

      let requestSpy = sandbox.spy()
      let errorSpy = sandbox.spy()
      server.on('error', errorSpy)
      server.on('request', requestSpy)

      let dnsRequest = {}
      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let receiveBuffer = Fixtures.writePacketToBuffer(packet)
      DnsRequest.parse.withArgs(receiveBuffer).returns(dnsRequest)

      let connection = {}
      let fromRequestError = new Error('Error creating response')
      DnsResponse.fromRequest.withArgs(dnsRequest, connection).throws(fromRequestError)

      server.handleMessage(receiveBuffer, connection)

      test.notOk(requestSpy.called)
      test.ok(errorSpy.calledWith(fromRequestError))
      test.end()
    })

    handleMessageTest.end()
  })

  baseServerTest.test('receiving server listening should', serverListeningTest => {
    serverListeningTest.test('emit listening event and set bound flag', test => {
      let socket = new EventEmitter()

      let listeningSpy = sandbox.spy()

      let server = new TestServer(socket)
      test.notOk(server._bound)

      server.on('listening', listeningSpy)

      socket.emit('listening')

      test.ok(listeningSpy.called)
      test.ok(server._bound)
      test.end()
    })

    serverListeningTest.end()
  })

  baseServerTest.test('receiving server close should', serverCloseTest => {
    serverCloseTest.test('call close method on internal server and emit close event', test => {
      let socket = new EventEmitter()
      socket.close = sandbox.stub()
      socket.close.callsArg(0)

      let closeSpy = sandbox.spy()

      let server = new TestServer(socket)
      server._bound = true
      server.on('close', closeSpy)

      socket.emit('close')

      test.ok(closeSpy.called)
      test.ok(socket.close.calledOnce)
      test.notOk(server._bound)
      test.end()
    })

    serverCloseTest.end()
  })

  baseServerTest.test('receiving server error should', serverErrorTest => {
    serverErrorTest.test('emit error event with existing error object', test => {
      let socket = new EventEmitter()

      let errorSpy = sandbox.spy()

      let error = new Error('bad stuff in server')

      let server = new TestServer(socket)
      server.on('error', errorSpy)

      socket.emit('error', error)

      test.ok(errorSpy.called)
      test.ok(errorSpy.calledWith(error))
      test.end()
    })

    serverErrorTest.end()
  })

  baseServerTest.end()
})
