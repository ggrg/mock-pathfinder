'use strict'

const src = '../../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Dgram = require('dgram')
const EventEmitter = require('events').EventEmitter
const Fixtures = require('../../../../../fixtures')
const BaseServer = require(`${src}/services/query/dns/server/base`)
const UdpServer = require(`${src}/services/query/dns/server/udp`)
const UdpConnection = require(`${src}/services/query/dns/server/udp/connection`)

Test('UdpServer', udpServerTest => {
  let sandbox

  udpServerTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Dgram, 'createSocket')
    sandbox.stub(UdpConnection, 'create')
    sandbox.stub(BaseServer.prototype, 'handleMessage')
    t.end()
  })

  udpServerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  udpServerTest.test('createServer should', createTest => {
    createTest.test('set server type', test => {
      let socket = new EventEmitter()
      Dgram.createSocket.returns(socket)

      let server = UdpServer.createServer()
      test.equal(server.type, 'UDP')
      test.end()
    })

    createTest.test('set dgram type if supplied', test => {
      let dgramType = 'udp6'

      let socket = new EventEmitter()
      Dgram.createSocket.returns(socket)

      UdpServer.createServer({ dgramType: dgramType })

      test.ok(Dgram.createSocket.calledWith(dgramType))
      test.end()
    })

    createTest.test('use default dgram type if not supplied', test => {
      let defaultDgramType = 'udp4'

      let socket = new EventEmitter()
      Dgram.createSocket.returns(socket)

      UdpServer.createServer()

      test.ok(Dgram.createSocket.calledWith(defaultDgramType))
      test.end()
    })

    createTest.end()
  })

  udpServerTest.test('listen should', listenTest => {
    listenTest.test('call bind method on internal server', test => {
      let port = 1111
      let hostname = 'localhost'

      let socket = new EventEmitter()
      socket.bind = sandbox.stub()

      Dgram.createSocket.returns(socket)

      let listeningSpy = sandbox.spy()

      let udpServer = UdpServer.createServer()
      udpServer.on('listening', listeningSpy)

      udpServer.listen(port, hostname)

      test.ok(socket.bind.calledOnce)
      test.ok(socket.bind.calledWith(port, hostname))
      test.ok(listeningSpy.notCalled)
      test.end()
    })

    listenTest.end()
  })

  udpServerTest.test('receiving server message should', serverMessageTest => {
    serverMessageTest.test('call handleMessage method on base server', test => {
      let socket = new EventEmitter()
      Dgram.createSocket.returns(socket)

      let remote = { port: 1111, address: 'localhost' }

      let udpConnection = new EventEmitter()
      UdpConnection.create.withArgs(socket, remote).returns(udpConnection)

      UdpServer.createServer()

      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let receiveBuffer = Fixtures.writePacketToBuffer(packet)

      socket.emit('message', receiveBuffer, remote)

      test.ok(BaseServer.prototype.handleMessage.called)
      test.ok(BaseServer.prototype.handleMessage.calledWithExactly(receiveBuffer, udpConnection))
      test.end()
    })

    serverMessageTest.end()
  })

  udpServerTest.end()
})
