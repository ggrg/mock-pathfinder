'use strict'

const src = '../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Soap = require(`${src}/services/provisioning/soap`)

Test('Soap', soapTest => {
  let sandbox

  soapTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    t.end()
  })

  soapTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  soapTest.test('exporting should', exportingTest => {
    exportingTest.test('export createServer convenience method', test => {
      test.ok(Soap.createServer)
      test.end()
    })

    exportingTest.end()
  })

  soapTest.end()
})
