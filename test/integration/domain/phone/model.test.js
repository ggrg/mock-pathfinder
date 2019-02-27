'use strict'

const Test = require('tape')
const Uuid = require('uuid4')
const ProfileModel = require('../../../../src/domain/profile/model')
const PhoneModel = require('../../../../src/domain/phone/model')
const Db = require('../../../../src/lib/db')
const Config = require('../../../../src/lib/config')

const rand10 = () => {
  return Math.floor(Math.random() * 100000000)
}

Test('Phone model', async modelTest => {
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
    await createTest.test('create a new phone', async test => {
      try {
        const profile = { profileId: Uuid(), name: `PROFILE-${Uuid()}`, tier: 2 }
        const phone = { phoneId: Uuid(), number: `${rand10()}`, countryCode: '1', profileId: profile.profileId, status: 'active' }

        await ProfileModel.create(profile)
        let id = await PhoneModel.create(phone)
        test.equal(id, 0)
        test.end()
      } catch (err) {
        test.fail()
        test.end()
      }
    })
    createTest.end()
  })

  await modelTest.test('getByNumber should', async getByNumberTest => {
    await getByNumberTest.test('retrieve a phone by the number', async test => {
      try {
        const profile = { profileId: Uuid(), name: `PROFILE-${Uuid()}`, tier: 2 }
        const phone = { phoneId: Uuid(), number: `${rand10()}`, countryCode: '1', profileId: profile.profileId, status: 'active' }

        await ProfileModel.create(profile)
        await PhoneModel.create(phone)
        let foundPhone = await PhoneModel.getByNumber(phone.number, phone.countryCode)
        test.equal(foundPhone.phoneId, phone.phoneId)
        test.equal(foundPhone.profileId, phone.profileId)
        test.equal(foundPhone.number, phone.number)
        test.equal(foundPhone.countryCode, phone.countryCode)
        test.equal(foundPhone.status, phone.status)
        test.ok(foundPhone.created)
        test.end()
      } catch (err) {
        test.fail()
        test.end()
      }
    })

    getByNumberTest.end()
  })

  await modelTest.test('removeById should', async removeByIdTest => {
    await removeByIdTest.test('remove a phone by id', async test => {
      try {
        const profile = { profileId: Uuid(), name: `PROFILE-${Uuid()}`, tier: 2 }
        const phone = { phoneId: Uuid(), number: `${rand10()}`, countryCode: '1', profileId: profile.profileId, status: 'active' }

        await ProfileModel.create(profile)
        await PhoneModel.create(phone)
        let removedPhone = await PhoneModel.removeById(phone.phoneId)
        test.ok(removedPhone)
        test.end()
      } catch (err) {
        test.fail()
        test.end()
      }
    })

    removeByIdTest.end()
  })

  await modelTest.test('getByProfileId should', async getByProfileIdTest => {
    await getByProfileIdTest.test('get all phones for a profile and order by created', async test => {
      try {
        const profile = { profileId: Uuid(), name: `PROFILE-${Uuid()}`, tier: 2 }
        const phone = { phoneId: Uuid(), number: `${rand10()}`, countryCode: '1', profileId: profile.profileId, status: 'active' }
        const phone2 = { phoneId: Uuid(), number: `${rand10()}`, countryCode: '1', profileId: profile.profileId, status: 'active' }

        await ProfileModel.create(profile)
        await PhoneModel.create(phone)
        await PhoneModel.create(phone2)
        let found = await PhoneModel.getByProfileId(profile.profileId)
        test.equal(found.length, 2)
        test.ok(found[0].phoneId === phone.phoneId || found[0].phoneId === phone2.phoneId)
        test.ok(found[1].phoneId === phone.phoneId || found[1].phoneId === phone2.phoneId)
        test.end()
      } catch (err) {
        test.fail()
        test.end()
      }
    })

    getByProfileIdTest.end()
  })

  await modelTest.test('update should', async updateTest => {
    await updateTest.test('update phone record', async test => {
      try {
        const profile = { profileId: Uuid(), name: `PROFILE-${Uuid()}`, tier: 2 }
        const profile2 = { profileId: Uuid(), name: `PROFILE-${Uuid()}`, tier: 2 }
        const phone = { phoneId: Uuid(), number: `${rand10()}`, countryCode: '1', profileId: profile.profileId, status: 'active' }

        await ProfileModel.create(profile)
        await ProfileModel.create(profile2)
        await PhoneModel.create(phone)
        await PhoneModel.update(phone.phoneId, { profileId: profile2.profileId, status: 'inactive' })
        let updated = await PhoneModel.getByNumber(phone.number, phone.countryCode)
        test.equal(updated.phoneId, phone.phoneId)
        test.equal(updated.status, 'inactive')
        test.equal(updated.profileId, profile2.profileId)
        test.end()
      } catch (err) {
        test.fail()
        test.end()
      }
    })

    updateTest.end()
  })

  modelTest.end()
})

Test.onFinish(async () => {
  Db.disconnect()
})
