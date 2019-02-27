'use strict'

const src = '../../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const EventEmitter = require('events').EventEmitter
const Fixtures = require('../../../../../fixtures')
const TcpConnection = require(`${src}/services/query/dns/server/tcp/connection`)

Test('TcpConnection', tcpConnTest => {
  let sandbox

  tcpConnTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    t.end()
  })

  tcpConnTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  tcpConnTest.test('getBaseSize should', baseSizeTest => {
    baseSizeTest.test('return default base message size', test => {
      let socket = new EventEmitter()

      let conn = TcpConnection.create(socket)

      test.equal(conn.getBaseSize(), 4096)
      test.end()
    })

    baseSizeTest.end()
  })

  tcpConnTest.test('send should', sendTest => {
    sendTest.test('prepend length to data and write to socket', test => {
      let writeStub = sandbox.stub()
      let socket = new EventEmitter()
      socket.write = writeStub

      let conn = TcpConnection.create(socket)

      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let buffer = Fixtures.writePacketToBuffer(packet)
      let bufferWithLength = Fixtures.writePacketToBufferWithLength(packet)

      conn.send(buffer)

      test.ok(writeStub.calledWith(bufferWithLength))
      test.end()
    })

    sendTest.test('convert data to buffer and send', test => {
      let writeStub = sandbox.stub()
      let socket = new EventEmitter()
      socket.write = writeStub

      let conn = TcpConnection.create(socket)

      let data = 'test'
      let dataBuffer = Buffer.from(data)
      let length = dataBuffer.length

      let bufferWithLength = Buffer.alloc(length + 2)
      bufferWithLength.writeUInt16BE(length, 0)
      dataBuffer.copy(bufferWithLength, 2)

      conn.send(data)

      test.ok(writeStub.calledWith(bufferWithLength))
      test.end()
    })

    sendTest.end()
  })

  tcpConnTest.test('receiving socket close should', receiveCloseTest => {
    receiveCloseTest.test('emit close event', test => {
      let socket = new EventEmitter()
      let closeSpy = sandbox.spy()

      let conn = TcpConnection.create(socket)
      conn.on('close', closeSpy)

      socket.emit('close')

      test.ok(closeSpy.called)
      test.end()
    })

    receiveCloseTest.end()
  })

  tcpConnTest.test('receving socket error should', receiveErrorTest => {
    receiveErrorTest.test('emit error event with existing error object', test => {
      let socket = new EventEmitter()
      let errorSpy = sandbox.spy()

      let socketErr = new Error('this is bad')

      let conn = TcpConnection.create(socket)
      conn.on('error', errorSpy)

      socket.emit('error', socketErr)

      test.ok(errorSpy.called)
      test.ok(errorSpy.calledWith(socketErr))
      test.end()
    })

    receiveErrorTest.end()
  })

  tcpConnTest.test('receiving socket data should', receiveDataTest => {
    receiveDataTest.test('handle request and emit message event', test => {
      let socket = new EventEmitter()
      let messageSpy = sandbox.spy()

      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let sendBuffer = Fixtures.writePacketToBufferWithLength(packet)
      let receiveBuffer = Fixtures.writePacketToBuffer(packet)

      let conn = TcpConnection.create(socket)
      conn.on('message', messageSpy)

      socket.emit('data', sendBuffer)

      test.ok(messageSpy.called)
      test.ok(messageSpy.calledWith(receiveBuffer))
      test.end()
    })

    receiveDataTest.test('handle multiple requests sent sequentially', test => {
      let socket = new EventEmitter()
      let messageSpy = sandbox.spy()
      let receiveBuffers = []

      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let sendBuffer = Fixtures.writePacketToBufferWithLength(packet)
      receiveBuffers.push(Fixtures.writePacketToBuffer(packet))

      let packet2 = Fixtures.createNaptrPacket('5.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let sendBuffer2 = Fixtures.writePacketToBufferWithLength(packet2)
      receiveBuffers.push(Fixtures.writePacketToBuffer(packet2))

      let packet3 = Fixtures.createNaptrPacket('9.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let sendBuffer3 = Fixtures.writePacketToBufferWithLength(packet3)
      receiveBuffers.push(Fixtures.writePacketToBuffer(packet3))

      let conn = TcpConnection.create(socket)
      conn.on('message', messageSpy)

      socket.emit('data', sendBuffer)
      socket.emit('data', sendBuffer2)
      socket.emit('data', sendBuffer3)

      test.equal(messageSpy.callCount, receiveBuffers.length)
      receiveBuffers.forEach((b) => {
        test.ok(messageSpy.calledWith(b))
      })
      test.end()
    })

    receiveDataTest.test('handle request split over multiple events', test => {
      let socket = new EventEmitter()
      let messageSpy = sandbox.spy()

      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let sendBuffer = Fixtures.writePacketToBufferWithLength(packet)
      let receiveBuffer = Fixtures.writePacketToBuffer(packet)

      let partialBuffer1 = sendBuffer.slice(0, 5)
      let partialBuffer2 = sendBuffer.slice(5)

      let conn = TcpConnection.create(socket)
      conn.on('message', messageSpy)

      socket.emit('data', partialBuffer1)
      socket.emit('data', partialBuffer2)

      test.ok(messageSpy.called)
      test.ok(messageSpy.calledWith(receiveBuffer))
      test.end()
    })

    receiveDataTest.test('handle multiple requests split over multiple events', test => {
      let socket = new EventEmitter()
      let messageSpy = sandbox.spy()
      let receiveBuffers = []

      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let sendBuffer = Fixtures.writePacketToBufferWithLength(packet)
      receiveBuffers.push(Fixtures.writePacketToBuffer(packet))

      let packet2 = Fixtures.createNaptrPacket('5.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let sendBuffer2 = Fixtures.writePacketToBufferWithLength(packet2)
      receiveBuffers.push(Fixtures.writePacketToBuffer(packet2))

      // Append the beginning of the second buffer to the first buffer.
      let partialBuffer1 = Fixtures.appendToBuffer(sendBuffer, sendBuffer2.slice(0, 5))
      let partialBuffer2 = sendBuffer2.slice(5)

      let conn = TcpConnection.create(socket)
      conn.on('message', messageSpy)

      socket.emit('data', partialBuffer1)
      socket.emit('data', partialBuffer2)

      test.equal(messageSpy.callCount, receiveBuffers.length)
      receiveBuffers.forEach((b) => {
        test.ok(messageSpy.calledWith(b))
      })
      test.end()
    })

    receiveDataTest.test('handle multiple requests in one data event', test => {
      let socket = new EventEmitter()
      let messageSpy = sandbox.spy()
      let receiveBuffers = []

      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let sendBuffer = Fixtures.writePacketToBufferWithLength(packet)
      receiveBuffers.push(Fixtures.writePacketToBuffer(packet))

      let packet2 = Fixtures.createNaptrPacket('5.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let sendBuffer2 = Fixtures.writePacketToBufferWithLength(packet2)
      receiveBuffers.push(Fixtures.writePacketToBuffer(packet2))

      let combinedBuffer = Fixtures.appendToBuffer(sendBuffer, sendBuffer2)

      let conn = TcpConnection.create(socket)
      conn.on('message', messageSpy)

      socket.emit('data', combinedBuffer)

      test.equal(messageSpy.callCount, receiveBuffers.length)
      receiveBuffers.forEach((b) => {
        test.ok(messageSpy.calledWith(b))
      })
      test.end()
    })

    receiveDataTest.test('not emit message event if sent non-DNS data', test => {
      let socket = new EventEmitter()
      let messageSpy = sandbox.spy()

      let sendBuffer = Buffer.from('junk data')

      let conn = TcpConnection.create(socket)
      conn.on('message', messageSpy)

      socket.emit('data', sendBuffer)

      test.notOk(messageSpy.called)
      test.end()
    })

    receiveDataTest.end()
  })

  tcpConnTest.end()
})
