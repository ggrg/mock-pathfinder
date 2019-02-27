'use strict'

const src = '../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')

Test('Generator', generatorTest => {
  let sandbox
  let uuidStub
  let Generator

  generatorTest.beforeEach((t) => {
    sandbox = Sinon.createSandbox()

    uuidStub = sandbox.stub()

    Generator = Proxyquire(`${src}/lib/generator`, { 'uuid4': uuidStub })

    t.end()
  })

  generatorTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  generatorTest.test('generateId should', generateId => {
    generateId.test('return new uuid', test => {
      let id = 'profile-id'

      uuidStub.returns(id)

      let generatedId = Generator.generateId()
      test.equal(generatedId, id)
      test.end()
    })

    generateId.end()
  })

  generatorTest.end()
})
