'use strict'

const src = '../../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Net = require('net')
const EventEmitter = require('events').EventEmitter
const Fixtures = require('../../../../../fixtures')
const BaseServer = require(`${src}/services/query/dns/server/base`)
const TcpServer = require(`${src}/services/query/dns/server/tcp`)
const TcpConnection = require(`${src}/services/query/dns/server/tcp/connection`)

Test('TcpServer', tcpServerTest => {
  let sandbox

  tcpServerTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Net, 'createServer')
    sandbox.stub(TcpConnection, 'create')
    sandbox.stub(BaseServer.prototype, 'handleMessage')
    t.end()
  })

  tcpServerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  tcpServerTest.test('createServer should', createTest => {
    createTest.test('set server type', test => {
      let socket = new EventEmitter()
      Net.createServer.returns(socket)

      let server = TcpServer.createServer()
      test.equal(server.type, 'TCP')
      test.end()
    })

    createTest.end()
  })

  tcpServerTest.test('listen should', listenTest => {
    listenTest.test('call listen method on internal server', test => {
      let port = 1111
      let hostname = 'localhost'

      let socket = new EventEmitter()
      socket.listen = sandbox.stub()

      Net.createServer.returns(socket)

      let tcpServer = TcpServer.createServer()
      tcpServer.listen(port, hostname)

      test.ok(socket.listen.calledOnce)
      test.ok(socket.listen.calledWith(port, hostname))
      test.end()
    })

    listenTest.end()
  })

  tcpServerTest.test('receiving server connection should', serverConnectionTest => {
    serverConnectionTest.test('create TcpConnection', test => {
      let socket = new EventEmitter()
      Net.createServer.returns(socket)

      let conn = sandbox.stub()
      conn.remoteAddress = 'localhost'
      conn.remotePort = 1111

      let tcpConnection = new EventEmitter()
      TcpConnection.create.returns(tcpConnection)

      TcpServer.createServer()

      socket.emit('connection', conn)

      test.ok(TcpConnection.create.calledOnce)
      test.ok(TcpConnection.create.calledWith(conn))
      test.end()
    })

    serverConnectionTest.end()
  })

  tcpServerTest.test('receiving TcpConnection message should', connMessageTest => {
    connMessageTest.test('call handleMessage method on base server', test => {
      let socket = new EventEmitter()
      Net.createServer.returns(socket)

      let conn = sandbox.stub()
      conn.remoteAddress = 'localhost'
      conn.remotePort = 1111

      let tcpConnection = new EventEmitter()
      TcpConnection.create.returns(tcpConnection)

      TcpServer.createServer()

      socket.emit('connection', conn)

      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let receiveBuffer = Fixtures.writePacketToBuffer(packet)

      tcpConnection.emit('message', receiveBuffer)

      test.ok(BaseServer.prototype.handleMessage.called)
      test.ok(BaseServer.prototype.handleMessage.calledWithExactly(receiveBuffer, tcpConnection))
      test.end()
    })

    connMessageTest.end()
  })

  tcpServerTest.end()
})
