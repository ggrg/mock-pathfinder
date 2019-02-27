'use strict'

const src = '../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Consts = require('native-dns-packet').consts
const Dns = require(`${src}/services/query/dns`)

Test('Dns', dnsTest => {
  let sandbox

  dnsTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    t.end()
  })

  dnsTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  dnsTest.test('exporting should', exportingTest => {
    exportingTest.test('export all supported DNS record types', test => {
      test.ok(Dns.NAPTR)
      test.equal(Dns.NAPTR.value, Consts.nameToQtype('NAPTR'))
      test.end()
    })

    exportingTest.test('export createServer convenience methods', test => {
      test.ok(Dns.createServer)
      test.ok(Dns.createTcpServer)
      test.ok(Dns.createUdpServer)
      test.end()
    })

    exportingTest.end()
  })

  dnsTest.test('create record type from options', createTest => {
    createTest.test('assign default properties if none provided', test => {
      let record = Dns.NAPTR()
      test.ok(record)
      test.equal(record.type, Consts.nameToQtype('NAPTR'))
      test.equal(record.class, Consts.NAME_TO_QCLASS.IN)
      test.end()
    })

    createTest.test('assign additional properties to created record', test => {
      let name = 'name'
      let address = '127.0.0.2'
      let ttl = 600

      let record = Dns.NAPTR({ name: name, address: address, ttl: ttl })
      test.ok(record)
      test.equal(record.type, Consts.nameToQtype('NAPTR'))
      test.equal(record.class, Consts.NAME_TO_QCLASS.IN)
      test.equal(record.name, name)
      test.equal(record.address, address)
      test.equal(record.ttl, ttl)
      test.end()
    })

    createTest.test('ignore default properties if passed in', test => {
      let name = 'name'
      let type = 'type'

      let record = Dns.NAPTR({ name: name, type: type })
      test.ok(record)
      test.equal(record.class, Consts.NAME_TO_QCLASS.IN)
      test.equal(record.name, name)
      test.notEqual(record.type, type)
      test.end()
    })

    createTest.end()
  })

  dnsTest.end()
})
