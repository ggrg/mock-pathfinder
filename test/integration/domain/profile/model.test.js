'use strict'

const Test = require('tape')
const Uuid = require('uuid4')
const Model = require('../../../../src/domain/profile/model')
const Db = require('../../../../src/lib/db')
const Config = require('../../../../src/lib/config')

Test('Profile model', async modelTest => {
  await modelTest.test('setup', async (assert) => {
    try {
      await Db.connect(Config.DATABASE_URI).then(async () => {
        assert.pass('setup OK')
        assert.end()
      }).catch(err => {
        assert.fail(`Connecting to database - ${err}`)
        assert.end()
      })
    } catch (err) {
      assert.fail(`Setup for test failed with error - ${err}`)
      assert.end()
    }
  })

  await modelTest.test('create should', async createTest => {
    await createTest.test('create a new profile', async test => {
      try {
        const profile = { profileId: Uuid(), name: `PROFILE-${Uuid()}`, tier: 2 }

        let id = await Model.create(profile)
        test.equal(id, 0)
        test.end()
      } catch (err) {
        test.fail()
        test.end()
      }
    })

    createTest.end()
  })

  await modelTest.test('getById should', async getByIdTest => {
    await getByIdTest.test('get profile by name', async test => {
      try {
        const profileId = Uuid()
        const name = `PROFILE-${Uuid()}`
        const profile = { profileId, name, tier: 2 }

        await Model.create(profile)
        let found = await Model.getById(profileId)
        test.ok(found)
        test.equal(found.profileId, profileId)
        test.equal(found.name, name)
        test.equal(found.tier, profile.tier)
        test.end()
      } catch (err) {
        test.fail()
        test.end()
      }
    })

    getByIdTest.end()
  })

  await modelTest.test('getByName should', async getByNameTest => {
    await getByNameTest.test('get profile by name', async test => {
      try {
        const name = `PROFILE-${Uuid()}`
        const profile = { profileId: Uuid(), name, tier: 2 }

        await Model.create(profile)
        let found = await Model.getByName(name)
        test.ok(found)
        test.equal(found.profileId, profile.profileId)
        test.equal(found.name, profile.name)
        test.equal(found.tier, profile.tier)
        test.end()
      } catch (err) {
        test.fail()
        test.end()
      }
    })

    getByNameTest.end()
  })

  modelTest.end()
})

Test.onFinish(async () => {
  Db.disconnect()
})
