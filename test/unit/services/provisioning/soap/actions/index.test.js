'use strict'

const src = '../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const SoapActions = require(`${src}/services/provisioning/soap/actions`)
const QueryPhoneAction = require(`${src}/services/provisioning/soap/actions/query-phone`)
const ChangePhoneAction = require(`${src}/services/provisioning/soap/actions/change-phone`)
const ActivatePhoneAction = require(`${src}/services/provisioning/soap/actions/activate-phone`)
const DeactivatePhoneAction = require(`${src}/services/provisioning/soap/actions/deactivate-phone`)
const FindProfileAction = require(`${src}/services/provisioning/soap/actions/find-profile`)
const CreateProfileAction = require(`${src}/services/provisioning/soap/actions/create-profile`)
const UpdateProfileAction = require(`${src}/services/provisioning/soap/actions/update-profile`)

Test('SoapActions', soapActionsTest => {
  let sandbox

  soapActionsTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(FindProfileAction)
    sandbox.stub(CreateProfileAction)
    sandbox.stub(UpdateProfileAction)
    sandbox.stub(QueryPhoneAction)
    sandbox.stub(ChangePhoneAction)
    sandbox.stub(ActivatePhoneAction)
    sandbox.stub(DeactivatePhoneAction)
    t.end()
  })

  soapActionsTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  soapActionsTest.test('process should', processTest => {
    processTest.test('execute CreateProfile for method DefineDNSProfile', test => {
      let method = 'DefineDNSProfile'
      let params = {}

      let response = { ReturnCode: 100 }
      CreateProfileAction.execute.returns(P.resolve(response))

      SoapActions.process(method, params)
        .then(resp => {
          test.ok(CreateProfileAction.execute.calledWith(params))
          test.equal(resp, response)
          test.end()
        })
    })

    processTest.test('execute UpdateProfile for method UpdateDNSProfile', test => {
      let method = 'UpdateDNSProfile'
      let params = {}

      let response = { ReturnCode: 100 }
      UpdateProfileAction.execute.returns(P.resolve(response))

      SoapActions.process(method, params)
        .then(resp => {
          test.ok(UpdateProfileAction.execute.calledWith(params))
          test.equal(resp, response)
          test.end()
        })
    })

    processTest.test('execute QueryPhone for method QueryTN', test => {
      let method = 'QueryTN'
      let params = {}

      let response = { ReturnCode: 100 }
      QueryPhoneAction.execute.returns(P.resolve(response))

      SoapActions.process(method, params)
        .then(resp => {
          test.ok(QueryPhoneAction.execute.calledWith(params))
          test.equal(resp, response)
          test.end()
        })
    })

    processTest.test('execute FindProfile for method QueryDNSProfile', test => {
      let method = 'QueryDNSProfile'
      let params = {}

      let response = { ReturnCode: 100 }
      FindProfileAction.execute.returns(P.resolve(response))

      SoapActions.process(method, params)
        .then(resp => {
          test.ok(FindProfileAction.execute.calledWith(params))
          test.equal(resp, response)
          test.end()
        })
    })

    processTest.test('execute ActivatePhone for method Activate', test => {
      let method = 'Activate'
      let params = {}

      let response = { ReturnCode: 100 }
      ActivatePhoneAction.execute.returns(P.resolve(response))

      SoapActions.process(method, params)
        .then(resp => {
          test.ok(ActivatePhoneAction.execute.calledWith(params))
          test.equal(resp, response)
          test.end()
        })
    })

    processTest.test('execute ChangePhone for method ChangeTN', test => {
      let method = 'ChangeTN'
      let params = {}

      let response = { ReturnCode: 100 }
      ChangePhoneAction.execute.returns(P.resolve(response))

      SoapActions.process(method, params)
        .then(resp => {
          test.ok(ChangePhoneAction.execute.calledWith(params))
          test.equal(resp, response)
          test.end()
        })
    })

    processTest.test('execute DeactivatePhone for method Deactivate', test => {
      let method = 'Deactivate'
      let params = {}

      let response = { ReturnCode: 100 }
      DeactivatePhoneAction.execute.returns(P.resolve(response))

      SoapActions.process(method, params)
        .then(resp => {
          test.ok(DeactivatePhoneAction.execute.calledWith(params))
          test.equal(resp, response)
          test.end()
        })
    })

    processTest.test('do nothing if unknown method', test => {
      let method = 'FindDNSProfile'
      let params = {}

      SoapActions.process(method, params)
        .then(() => {
          test.end()
        })
    })

    processTest.end()
  })

  soapActionsTest.end()
})
