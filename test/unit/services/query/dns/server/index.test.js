'use strict'

const src = '../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const DnsServer = require(`${src}/services/query/dns/server`)
const TcpServer = require(`${src}/services/query/dns/server/tcp`)
const UdpServer = require(`${src}/services/query/dns/server/udp`)

Test('DnsServer', dnsServerTest => {
  let sandbox

  dnsServerTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(TcpServer, 'createServer')
    sandbox.stub(UdpServer, 'createServer')
    t.end()
  })

  dnsServerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  dnsServerTest.test('createServer should', createServerTest => {
    createServerTest.test('create default server', test => {
      let opts = {}
      DnsServer.createServer(opts)

      test.ok(UdpServer.createServer.calledOnce)
      test.ok(UdpServer.createServer.calledWith(opts))
      test.end()
    })

    createServerTest.end()
  })

  dnsServerTest.test('createTcpServer should', createTcpServerTest => {
    createTcpServerTest.test('create TCP server', test => {
      let opts = {}
      DnsServer.createTcpServer(opts)

      test.ok(TcpServer.createServer.calledOnce)
      test.ok(TcpServer.createServer.calledWith(opts))
      test.end()
    })

    createTcpServerTest.end()
  })

  dnsServerTest.test('createUdpServer should', createUdpServerTest => {
    createUdpServerTest.test('create UDP server', test => {
      let opts = {}
      DnsServer.createUdpServer(opts)

      test.ok(UdpServer.createServer.calledOnce)
      test.ok(UdpServer.createServer.calledWith(opts))
      test.end()
    })

    createUdpServerTest.end()
  })

  dnsServerTest.end()
})
