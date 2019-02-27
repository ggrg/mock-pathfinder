const Provisioning = require('@mojaloop/pathfinder-provisioning-client')

const profileId = '12128d22-5034-4916-9cbb-c59387f56fa1'
const client = Provisioning.createClient({ address: 'http://localhost:8080/nrs-pi/services/SIPIX/SendRequest' })
let record = Provisioning.Record({ order: 10, preference: 1, service: 'E2U+mm', regexp: { pattern: '^.*$', replace: 'mm:001.001@@mojaloop.org' } })
let profile = Provisioning.Profile({ id: profileId, records: [record] })

client.createProfile(profile)
  .then(response => {
    console.log('RESPONSE MESSAGE')
    console.dir(response, { depth: null })
    client.activatePhoneNumber('+12024561414', profileId)
  })
  .catch(err => {
    console.log('ERROR')
    console.log(err)
  })
