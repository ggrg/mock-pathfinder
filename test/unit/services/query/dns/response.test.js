'use strict'

const src = '../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Fixtures = require('../../../fixtures')
const Packet = require('native-dns-packet')
const DnsRequest = require(`${src}/services/query/dns/request`)
const DnsResponse = require(`${src}/services/query/dns/response`)

const createRequest = () => {
  let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
  let receiveBuffer = Fixtures.writePacketToBuffer(packet)

  return DnsRequest.parse(receiveBuffer)
}

let request = createRequest()

Test('DnsResponse', dnsResponseTest => {
  let sandbox

  dnsResponseTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Packet, 'write')
    t.end()
  })

  dnsResponseTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  dnsResponseTest.test('fromRequest should', fromRequestTest => {
    fromRequestTest.test('set fields from request', test => {
      let connection = sandbox.stub()

      let response = DnsResponse.fromRequest(request, connection)
      test.equal(response._connection, connection)
      test.equal(response.header.id, request.header.id)
      test.equal(response.header.qr, 1)
      test.equal(response.question, request.question)
      test.end()
    })

    fromRequestTest.end()
  })

  dnsResponseTest.test('send should', sendTest => {
    sendTest.test('write response to connection', test => {
      let baseSize = 4096
      let baseSizeStub = sandbox.stub().returns(baseSize)
      let sendStub = sandbox.stub()
      let connection = { getBaseSize: baseSizeStub, send: sendStub }

      let length = 50
      Packet.write.returns(length)

      let response = DnsResponse.fromRequest(request, connection)
      response.send()

      test.ok(baseSizeStub.called)
      test.ok(Packet.write.calledWithMatch({ length: baseSize }))
      test.ok(sendStub.calledWithMatch({ length: length }))
      test.end()
    })

    sendTest.end()
  })

  dnsResponseTest.end()
})
