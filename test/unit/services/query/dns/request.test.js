'use strict'

const src = '../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Packet = require('native-dns-packet')
const Fixtures = require('../../../fixtures')
const DnsRequest = require(`${src}/services/query/dns/request`)

Test('DnsRequest', dnsRequestTest => {
  let sandbox

  dnsRequestTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Packet, 'parse')
    t.end()
  })

  dnsRequestTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  dnsRequestTest.test('constructor should', constructorTest => {
    constructorTest.test('create empty request that inherits from Packet', test => {
      let request = new DnsRequest()
      test.ok(request.header)
      test.ok(request.question)
      test.ok(request.answer)
      test.ok(request.authority)
      test.ok(request.additional)
      test.end()
    })

    constructorTest.end()
  })

  dnsRequestTest.test('parse should', parseTest => {
    parseTest.test('call Packet to parse message and return request object', test => {
      let packet = Fixtures.createNaptrPacket('4.3.2.1.9.9.9.1.0.9.3.6.e164.enum.net')
      let receiveBuffer = Fixtures.writePacketToBuffer(packet)

      Packet.parse.withArgs(receiveBuffer).returns(packet)

      let request = new DnsRequest()
      let parsed = request.parse(receiveBuffer)
      test.equal(parsed, packet)
      test.end()
    })

    parseTest.end()
  })

  dnsRequestTest.end()
})
