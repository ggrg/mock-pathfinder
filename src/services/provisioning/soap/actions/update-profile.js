'use strict'

const P = require('bluebird')
const RequestMapper = require('./mappers/request')
const Result = require('./result')
const Validation = require('./validation')
const Errors = require('../errors')
const ProfileService = require('../../../../domain/profile')

exports.execute = (params) => {
  let transactionId = params['TransactionID']

  return P.try(() => {
    if (!transactionId) {
      throw new Errors.InvalidTransactionIdError('Invalid or null transaction ID - null')
    }

    return Validation.validateCreateUpdateProfileRequest(params)
      .then(() => RequestMapper.mapToCreateUpdateProfileRequest(params))
      .then(request => {
        return ProfileService.getByName(request.profileName)
          .then(found => {
            if (!found) {
              throw new Errors.NotFoundError('DNS profile could not be found')
            }

            return ProfileService.update(found.profileId, request.records)
              .then(created => Result.build(200, transactionId, ['OK', `Profile ${request.profileName} successfully updated`]))
          })
      })
  }).catch(Errors.InvalidTransactionIdError, err => Result.build(err.code, 0, [err.name, err.message]))
    .catch(Errors.BaseError, err => Result.build(err.code, transactionId, [err.name, err.message]))
    .catch(err => Result.build(500, 0, ['Unknown Error', err.message]))
}
