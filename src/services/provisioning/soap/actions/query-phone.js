'use strict'

const P = require('bluebird')
const Result = require('./result')
const Validation = require('./validation')
const RequestMapper = require('./mappers/request')
const ResponseMapper = require('./mappers/response')
const Errors = require('../errors')
const Config = require('../../../../lib/config')
const PhoneService = require('../../../../domain/phone')
const ProfileService = require('../../../../domain/profile')

exports.execute = (params) => {
  let transactionId = params['TransactionID']

  return P.try(() => {
    if (!transactionId) {
      throw new Errors.InvalidTransactionIdError('Invalid or null transaction ID - null')
    }

    return Validation.validateQueryPhoneRequest(params)
      .then(() => RequestMapper.mapToQueryPhoneRequest(params))
      .then(request => {
        if (request.phone.number) {
          return PhoneService.getByNumber(request.phone.number, request.phone.countryCode)
            .then(phone => {
              if (!phone) {
                throw new Errors.NotFoundError('No TN profile could be found')
              }

              return ProfileService.getById(phone.profileId)
                .then(profile => {
                  if (!profile) {
                    throw new Errors.NotFoundError('DNS profile does not exist')
                  }
                  return Result.build(200, transactionId, ['OK', '1 TN profile is queried successfully'], ResponseMapper.mapToPhoneNumberResponse(phone, profile, Config.PROVISIONING.DEFAULT_CUSTOMER_ID))
                })
            })
        } else {
          return ProfileService.getByName(request.profileName)
            .then(profile => {
              if (!profile) {
                throw new Errors.NotFoundError('No TN profile could be found')
              }

              return PhoneService.getByProfileId(profile.profileId)
                .then(phones => {
                  if (!phones || phones.length === 0) {
                    throw new Errors.NotFoundError('No TN profile could be found')
                  }

                  return Result.build(200, transactionId, ['OK', `${phones.length} TN profiles are queried successfully`], ResponseMapper.mapToPhoneNumberResponse(phones, profile, Config.PROVISIONING.DEFAULT_CUSTOMER_ID))
                })
            })
        }
      })
  }).catch(Errors.InvalidTransactionIdError, err => Result.build(err.code, 0, [err.name, err.message]))
    .catch(Errors.BaseError, err => Result.build(err.code, transactionId, [err.name, err.message]))
    .catch(err => Result.build(500, 0, ['Unknown Error', err.message]))
}
