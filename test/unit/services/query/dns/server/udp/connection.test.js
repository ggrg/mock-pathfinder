'use strict'

const src = '../../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const EventEmitter = require('events').EventEmitter
const Fixtures = require('../../../../../fixtures')
const UdpConnection = require(`${src}/services/query/dns/server/udp/connection`)

Test('UdpConnection', udpConnTest => {
  let sandbox

  udpConnTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    t.end()
  })

  udpConnTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  udpConnTest.test('getBaseSize should', baseSizeTest => {
    baseSizeTest.test('return default base message size', test => {
      let conn = UdpConnection.create({}, {})

      test.equal(conn.getBaseSize(), 512)
      test.end()
    })

    baseSizeTest.end()
  })

  udpConnTest.test('send should', sendTest => {
    sendTest.test('write data to socket', test => {
      let sendStub = sandbox.stub()
      let socket = new EventEmitter()
      socket.send = sendStub

      let remote = { port: 1111, address: '0.0.0.0' }

      let conn = UdpConnection.create(socket, remote)

      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let buffer = Fixtures.writePacketToBuffer(packet)

      conn.send(buffer)

      test.ok(sendStub.calledWith(buffer, 0, buffer.length, remote.port, remote.address))
      test.end()
    })

    sendTest.end()
  })

  udpConnTest.end()
})
