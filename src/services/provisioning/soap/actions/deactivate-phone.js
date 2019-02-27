'use strict'

const P = require('bluebird')
const RequestMapper = require('./mappers/request')
const Result = require('./result')
const Validation = require('./validation')
const Errors = require('../errors')
const PhoneService = require('../../../../domain/phone')

exports.execute = (params) => {
  let transactionId = params['TransactionID']

  return P.try(() => {
    if (!transactionId) {
      throw new Errors.InvalidTransactionIdError('Invalid or null transaction ID - null')
    }

    return Validation.validatePhoneRequest(params)
      .then(() => RequestMapper.mapToPhoneRequest(params))
      .then(request => {
        return PhoneService.getByNumber(request.number, request.countryCode)
          .then(existingPhone => {
            if (!existingPhone) {
              throw new Errors.InvalidValueError(`TN ${request.number} was not activated`)
            }

            return PhoneService.removeById(existingPhone.phoneId)
              .then(created => Result.build(200, transactionId, ['OK', 'TNs deactivated successfully']))
          })
      })
  }).catch(Errors.InvalidTransactionIdError, err => Result.build(err.code, 0, [err.name, err.message]))
    .catch(Errors.BaseError, err => Result.build(err.code, transactionId, [err.name, err.message]))
    .catch(err => Result.build(500, 0, ['Unknown Error', err.message]))
}
