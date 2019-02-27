'use strict'

const Model = require('./model')
const Generator = require('../../lib/generator')

exports.create = (number, countryCode, profileId, status) => {
  let phoneId = Generator.generateId()
  return Model.create({ phoneId, number, countryCode, profileId, status })
}

exports.update = (phoneId, fields) => {
  return Model.update(phoneId, fields)
}

exports.removeById = (phoneId) => {
  return Model.removeById(phoneId)
}

exports.getByNumber = (number, countryCode) => {
  return Model.getByNumber(number, countryCode)
}

exports.getByProfileId = (profileId) => {
  return Model.getByProfileId(profileId)
}
