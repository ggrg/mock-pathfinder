'use strict'

const Test = require('tape')
const Uuid = require('uuid4')
const ProfileModel = require('../../../../src/domain/profile/model')
const RecordModel = require('../../../../src/domain/record/model')
const Db = require('../../../../src/lib/db')
const Config = require('../../../../src/lib/config')

Test('Record model', async (modelTest) => {
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

  await modelTest.test('create should', async (createTest) => {
    await createTest.test('create a new record', async (test) => {
      try {
        const profile = { profileId: Uuid(), name: `PROFILE-${Uuid()}`, tier: 2 }
        const record = {
          recordId: Uuid(),
          profileId: profile.profileId,
          order: 1,
          preference: 10,
          domainName: 'e164enum.net',
          ttl: 900,
          flags: 'u',
          service: 'E2U+mm',
          regexp: '^.*$',
          uri: 'mm:001.505@test.org',
          replacement: '.'
        }

        await ProfileModel.create(profile)
        let id = await RecordModel.create(record)
        test.equal(id, 0)
        test.end()
      } catch (err) {
        test.fail()
        test.end()
      }
    })

    createTest.end()
  })

  await modelTest.test('getByProfileId should', async (getByProfileIdTest) => {
    await getByProfileIdTest.test('return records for profile ordered by order then preference', async (test) => {
      try {
        const profile = { profileId: Uuid(), name: `PROFILE-${Uuid()}`, tier: 2 }
        const record1 = {
          recordId: Uuid(),
          profileId: profile.profileId,
          order: 15,
          preference: 1,
          domainName: 'e164enum.net',
          ttl: 900,
          flags: 'u',
          service: 'E2U+mm',
          regexp: '^.*$',
          uri: 'mm:001.505@test.org',
          replacement: '.'
        }

        const record2 = {
          recordId: Uuid(),
          profileId: profile.profileId,
          order: 10,
          preference: 2,
          domainName: 'e164enum.net',
          ttl: 900,
          flags: 'u',
          service: 'E2U+mm',
          regexp: '^.*$',
          uri: 'mm:001.506@test.org',
          replacement: '.'
        }

        const record3 = {
          recordId: Uuid(),
          profileId: profile.profileId,
          order: 10,
          preference: 1,
          domainName: 'e164enum.net',
          ttl: 900,
          flags: 'u',
          service: 'E2U+mm',
          regexp: '^.*$',
          uri: 'mm:001.507@test.org',
          replacement: '.'
        }

        await ProfileModel.create(profile)
        await RecordModel.create(record1)
        await RecordModel.create(record2)
        await RecordModel.create(record3)
        let found = await RecordModel.getByProfileId(profile.profileId)
        test.equal(found.length, 3)
        test.equal(found[0].recordId, record3.recordId)
        test.equal(found[1].recordId, record2.recordId)
        test.equal(found[2].recordId, record1.recordId)
        test.end()
      } catch (err) {
        test.fail()
        test.end()
      }
    })

    getByProfileIdTest.end()
  })

  await modelTest.test('removeForProfileId should', async (removeForProfileIdTest) => {
    await removeForProfileIdTest.test('remove records for profile', async (test) => {
      try {
        const profile = { profileId: Uuid(), name: `PROFILE-${Uuid()}`, tier: 2 }
        const record1 = {
          recordId: Uuid(),
          profileId: profile.profileId,
          order: 15,
          preference: 1,
          domainName: 'e164enum.net',
          ttl: 900,
          flags: 'u',
          service: 'E2U+mm',
          regexp: '^.*$',
          uri: 'mm:001.505@test.org',
          replacement: '.'
        }

        const record2 = {
          recordId: Uuid(),
          profileId: profile.profileId,
          order: 10,
          preference: 2,
          domainName: 'e164enum.net',
          ttl: 900,
          flags: 'u',
          service: 'E2U+mm',
          regexp: '^.*$',
          uri: 'mm:001.506@test.org',
          replacement: '.'
        }

        await ProfileModel.create(profile)
        await RecordModel.create(record1)
        await RecordModel.create(record2)
        let found = await RecordModel.getByProfileId(profile.profileId)
        test.equal(found.length, 2)
        await RecordModel.removeForProfileId(profile.profileId)
        let found2 = await RecordModel.getByProfileId(profile.profileId)
        test.equal(found2.length, 0)
        test.end()
      } catch (err) {
        test.fail()
        test.end()
      }
    })

    removeForProfileIdTest.end()
  })

  modelTest.end()
})

Test.onFinish(async () => {
  Db.disconnect()
})
