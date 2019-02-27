'use strict'

const src = '../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Logger = require('@mojaloop/central-services-shared').Logger
const Db = require(`${src}/lib/db`)
const Config = require(`${src}/lib/config`)
const Migrator = require(`${src}/lib/migrator`)
const QueryService = require(`${src}/services/query`)
const ProvisioningService = require(`${src}/services/provisioning`)

Test('Server', serverTest => {
  let sandbox
  let oldQueryConfig
  let oldProvisioningConfig
  let oldDatabaseUri
  let queryConfig = { PORT: 1234 }
  let provisioningConfig = { PATH: '/test' }
  let databaseUri = 'some-database-uri'

  serverTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Db, 'connect')
    sandbox.stub(Db, 'disconnect')
    sandbox.stub(QueryService, 'create')
    sandbox.stub(ProvisioningService, 'create')
    sandbox.stub(Migrator, 'migrate')
    sandbox.stub(Logger)

    oldQueryConfig = Config.QUERY
    oldDatabaseUri = Config.DATABASE_URI
    oldProvisioningConfig = Config.PROVISIONING

    Config.QUERY = queryConfig
    Config.DATABASE_URI = databaseUri
    Config.PROVISIONING = provisioningConfig

    t.end()
  })

  serverTest.afterEach(t => {
    delete require.cache[require.resolve('../../src/server')]
    sandbox.restore()
    Config.QUERY = oldQueryConfig
    Config.DATABASE_URI = oldDatabaseUri
    Config.PROVISIONING = oldProvisioningConfig
    t.end()
  })

  serverTest.test('setup should', setupTest => {
    setupTest.test('create services and start', test => {
      Db.connect.returns(P.resolve({}))
      Migrator.migrate.returns(P.resolve({}))

      let queryService = { start: sandbox.stub() }
      queryService.start.returns(P.resolve())
      QueryService.create.returns(queryService)

      let provisioningService = { start: sandbox.stub() }
      provisioningService.start.returns(P.resolve())
      ProvisioningService.create.returns(provisioningService)

      require('../../src/server')
        .then(() => {
          test.ok(Migrator.migrate.calledOnce)
          test.ok(Migrator.migrate.calledBefore(Db.connect))
          test.ok(Db.connect.calledOnce)
          test.ok(Db.connect.calledWith(databaseUri))
          test.ok(QueryService.create.calledWith(queryConfig))
          test.ok(queryService.start.calledOnce)
          test.ok(ProvisioningService.create.calledWith(provisioningConfig))
          test.ok(provisioningService.start.calledOnce)
          test.ok(Logger.info.calledWith('mock-pathfinder server started'))
          test.end()
        })
    })

    setupTest.test('cleanup and rethrow on error', test => {
      let error = new Error()
      let reject = P.reject(error)
      reject.catch(() => {})

      Db.connect.returns(P.resolve({}))
      Migrator.migrate.returns(P.resolve({}))

      let startStub = sandbox.stub()
      startStub.returns(reject)

      let query = { start: startStub }
      QueryService.create.returns(query)

      require('../../src/server')
        .then(() => {
          test.fail('Should have thrown error')
          test.end()
        })
        .catch(err => {
          test.ok(Logger.error.calledWith('Fatal error thrown by mock-pathfinder server', error))
          test.ok(Db.disconnect.calledOnce)
          test.equal(err, error)
          test.end()
        })
    })

    setupTest.end()
  })

  serverTest.end()
})
