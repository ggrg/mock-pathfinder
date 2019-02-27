'use strict'

const P = require('bluebird')
const RequestMapper = require('./mappers/request')
const ResponseMapper = require('./mappers/response')
const Result = require('./result')
const Validation = require('./validation')
const Errors = require('../errors')
const Config = require('../../../../lib/config')
const RecordService = require('../../../../domain/record')
const ProfileService = require('../../../../domain/profile')

exports.execute = (params) => {
  let transactionId = params['TransactionID']

  return P.try(() => {
    if (!transactionId) {
      throw new Errors.InvalidTransactionIdError('Invalid or null transaction ID - null')
    }

    return Validation.validateQueryProfileRequest(params)
      .then(() => RequestMapper.mapToQueryProfileRequest(params))
      .then(request => {
        return ProfileService.getByName(request.profileName)
          .then(profile => {
            if (!profile) {
              throw new Errors.NotFoundError('DNS profile does not exist')
            }

            return RecordService.getByProfileId(profile.profileId)
              .then(records => Result.build(200, transactionId, ['OK', 'DNS profile queried successfully'], ResponseMapper.mapToProfileResponse(profile, records, Config.PROVISIONING.DEFAULT_CUSTOMER_ID)))
          })
      })
  }).catch(Errors.InvalidTransactionIdError, err => Result.build(err.code, 0, [err.name, err.message]))
    .catch(Errors.BaseError, err => Result.build(err.code, transactionId, [err.name, err.message]))
    .catch(err => Result.build(500, 0, ['Unknown Error', err.message]))
}
