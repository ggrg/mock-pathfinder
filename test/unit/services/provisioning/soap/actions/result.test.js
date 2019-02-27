'use strict'

const src = '../../../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Moment = require('moment')
const SoapResult = require(`${src}/services/provisioning/soap/actions/result`)

const AttributeNamespace = 'http://www.neustar.biz/sip_ix/prov'

Test('SoapResult', soapResultTest => {
  let sandbox

  soapResultTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Moment, 'utc')
    t.end()
  })

  soapResultTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  const testNode = (test, node, value) => {
    test.ok(node)
    test.equal(node['$value'], value)
    test.equal(node['attributes']['xmlns'], AttributeNamespace)
  }

  soapResultTest.test('build should', buildTest => {
    buildTest.test('build result without data', test => {
      let transactionId = 12345
      let returnCode = 201
      let messages = ['Test', 'Test2']

      Moment.utc.returns({ format: sandbox.stub() })

      let result = SoapResult.build(returnCode, transactionId, messages)

      testNode(test, result['TransactionID'], transactionId)
      testNode(test, result['ReturnCode'], returnCode)

      let textMessageNode = result['TextMessage']
      test.ok(textMessageNode)
      testNode(test, textMessageNode[0], messages[0])
      testNode(test, textMessageNode[1], messages[1])

      test.end()
    })

    buildTest.test('build result with data', test => {
      let transactionId = 12345
      let returnCode = 201
      let data = { test: 1 }
      let messages = ['Test', 'Test2']

      Moment.utc.returns({ format: sandbox.stub() })

      let result = SoapResult.build(returnCode, transactionId, messages, data)

      testNode(test, result['TransactionID'], transactionId)
      testNode(test, result['ReturnCode'], returnCode)

      // Test the ResponseData node contains attributes object with xmlns attribute.
      test.notEqual(result['ResponseData'], data)
      test.equal(result['ResponseData']['attributes']['xmlns'], AttributeNamespace)
      test.equal(result['ResponseData']['test'], data['test'])

      // ResponseData should not add a $value property.
      test.notOk(result['ResponseData']['$value'])

      let textMessageNode = result['TextMessage']
      test.ok(textMessageNode)
      testNode(test, textMessageNode[0], messages[0])
      testNode(test, textMessageNode[1], messages[1])

      test.end()
    })

    buildTest.test('build result with data and existing attributes', test => {
      let transactionId = 12345
      let returnCode = 201
      let data = { test: 1, attributes: { id: 5 } }
      let messages = ['Test', 'Test2']

      Moment.utc.returns({ format: sandbox.stub() })

      let result = SoapResult.build(returnCode, transactionId, messages, data)

      testNode(test, result['TransactionID'], transactionId)
      testNode(test, result['ReturnCode'], returnCode)

      // Test the ResponseData node adds an xmlns attribute to existing attributes object.
      test.notEqual(result['ResponseData'], data)
      test.equal(result['ResponseData']['attributes']['id'], data['attributes']['id'])
      test.equal(result['ResponseData']['attributes']['xmlns'], AttributeNamespace)
      test.equal(result['ResponseData']['test'], data['test'])

      // ResponseData should not add a $value property.
      test.notOk(result['ResponseData']['$value'])

      let textMessageNode = result['TextMessage']
      test.ok(textMessageNode)
      testNode(test, textMessageNode[0], messages[0])
      testNode(test, textMessageNode[1], messages[1])

      test.end()
    })

    buildTest.test('add message with current date', test => {
      let transactionId = 12345
      let returnCode = 201
      let messages = ['Test', 'Test2']

      let formattedDate = 'Tue Sep 26 14:59:02 GMT 2017'
      Moment.utc.returns({ format: sandbox.stub().returns(formattedDate) })

      let result = SoapResult.build(returnCode, transactionId, messages)

      let textMessageNode = result['TextMessage']
      test.ok(textMessageNode)
      test.equal(textMessageNode.length, 3)
      testNode(test, textMessageNode[0], messages[0])
      testNode(test, textMessageNode[1], messages[1])
      testNode(test, textMessageNode[2], `Date: ${formattedDate}`)

      test.end()
    })

    buildTest.end()
  })

  soapResultTest.end()
})
