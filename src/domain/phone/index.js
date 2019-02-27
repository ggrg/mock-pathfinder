'use strict'

const Model = require('./model')
const Generator = require('../../lib/generator')

exports.create = async (number, countryCode, profileId, status) => {
  let phoneId = Generator.generateId()
  return Model.create({ phoneId, number, countryCode, profileId, status })
}

exports.update = async (phoneId, fields) => {
  return Model.update(phoneId, fields)
}

exports.removeById = async (phoneId) => {
  return Model.removeById(phoneId)
}

exports.getByNumber = async (number, countryCode) => {
  return Model.getByNumber(number, countryCode)
}

exports.getByProfileId = async (profileId) => {
  return Model.getByProfileId(profileId)
}
