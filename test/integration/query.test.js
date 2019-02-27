const Query = require('@mojaloop/pathfinder-query-client')

const client = Query.createClient({ address: 'localhost', port: 15353 })

const phoneNumber1 = '+12024561414'
const phoneNumber2 = '+12024561415'

client.request(phoneNumber1)
  .then(response => {
    console.log('RESPONSE MESSAGE')
    console.log(JSON.stringify(response))
  })
  .catch(err => {
    console.log('ERROR')
    console.log(err)
  })

client.request(phoneNumber2)
  .then(response => {
    console.log('RESPONSE MESSAGE')
    console.log(JSON.stringify(response))
  })
  .catch(err => {
    console.log('ERROR')
    console.log(err)
  })
