'use strict'

const P = require('bluebird')
const RequestMapper = require('./mappers/request')
const Result = require('./result')
const Validation = require('./validation')
const Errors = require('../errors')
const PhoneService = require('../../../../domain/phone')
const ProfileService = require('../../../../domain/profile')

exports.execute = (params) => {
  let transactionId = params['TransactionID']

  return P.try(() => {
    if (!transactionId) {
      throw new Errors.InvalidTransactionIdError('Invalid or null transaction ID - null')
    }

    return Validation.validateChangePhoneStatusRequest(params)
      .then(() => RequestMapper.mapToChangePhoneStatusRequest(params))
      .then(request => {
        return PhoneService.getByNumber(request.phone.number, request.phone.countryCode)
          .then(existingPhone => {
            if (existingPhone) {
              throw new Errors.InvalidValueError(`TN ${request.phone.number} is already provisioned`)
            }

            return ProfileService.getByName(request.profileName)
              .then(foundProfile => {
                if (!foundProfile) {
                  throw new Errors.ValueMissingError('DNS PROFILE DOES NOT EXIST')
                }

                return PhoneService.create(request.phone.number, request.phone.countryCode, foundProfile.profileId, request.status)
                  .then(created => Result.build(201, transactionId, ['Created', 'TN provisioned successfully']))
              })
          })
      })
  }).catch(Errors.InvalidTransactionIdError, err => Result.build(err.code, 0, [err.name, err.message]))
    .catch(Errors.BaseError, err => Result.build(err.code, transactionId, [err.name, err.message]))
    .catch(err => Result.build(500, 0, ['Unknown Error', err.message]))
}
