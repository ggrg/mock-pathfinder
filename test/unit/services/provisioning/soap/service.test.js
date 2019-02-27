'use strict'

const src = '../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const SoapActions = require(`${src}/services/provisioning/soap/actions`)
const SoapService = require(`${src}/services/provisioning/soap/service`)

Test('SoapService', soapServiceTest => {
  let sandbox

  soapServiceTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(SoapActions)
    t.end()
  })

  soapServiceTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  soapServiceTest.test('SendRequest should', sendRequestTest => {
    sendRequestTest.test('pass method and params to SoapActions and execute callback', test => {
      let method = 'DefineDNSProfile'
      let params = { 'ProfileID': 'test-profile', 'TransactionID': 1233454, 'Tier': 2 }

      let args = {}
      args[method] = params

      let response = { ResponseCode: 100 }
      SoapActions.process.returns(P.resolve(response))

      SoapService.service.SIPIX.SendRequest.SendRequest(args, (err, result) => {
        test.notOk(err)
        test.equal(result.ResponseCode, response.ResponseCode)
        test.end()
      })
    })

    sendRequestTest.end()
  })

  soapServiceTest.end()
})
