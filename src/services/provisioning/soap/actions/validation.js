'use strict'

const P = require('bluebird')
const Errors = require('../errors')

const MaxRecords = 16
const UnauthorizedTiers = [0, 1]
const ValidFlags = ['P', 'U', 'A', 'S']
const ValidStatuses = ['ACTIVE', 'INACTIVE']
const validTnRecords = 1

exports.validatePhoneRequest = (params) => {
  if (!('TN' in params)) {
    return P.reject(new Errors.ValueMissingError('Query input parameter is missing'))
  }

  return validateTn(params['TN'])
}

exports.validateQueryPhoneRequest = (params) => {
  let tnPresent = ('TN' in params)
  let profilePresent = ('DNSProfileID' in params)

  if (tnPresent) {
    return validateTn(params['TN'])
  } else if (profilePresent) {
    return validateDnsProfileId(params['DNSProfileID'])
  } else {
    return P.reject(new Errors.ValueMissingError('Query input parameter is missing'))
  }
}

exports.validateQueryProfileRequest = (params) => {
  return new P((resolve, reject) => {
    if (!('ProfileID' in params)) {
      return reject(new Errors.ValueMissingError('DNS Profile Id value is missing'))
    }

    let profileName = params['ProfileID']
    if (!profileName.trim()) {
      return reject(new Errors.InvalidValueError('Invalid DNS Profile Id length'))
    }

    resolve()
  })
}

exports.validateChangePhoneStatusRequest = (params) => {
  if (!('TN' in params)) {
    return P.reject(new Errors.ValueMissingError('Query input parameter is missing'))
  }

  if (!('DNSProfileID' in params)) {
    return P.reject(new Errors.ValueMissingError('DNS Profile Id value is missing'))
  }

  return validateTn(params['TN'])
    .then(() => validateDnsProfileId(params['DNSProfileID']))
    .then(() => {
      let status = params['Status'] || 'active'
      if (!ValidStatuses.includes(status.trim().toUpperCase())) {
        return P.reject(new Errors.InvalidValueError('Status must be active or inactive'))
      }

      return P.resolve()
    })
}

exports.validateCreateUpdateProfileRequest = (params) => {
  return new P((resolve, reject) => {
    let profileId = params['ProfileID'] || ''
    if (!profileId.trim()) {
      return reject(new Errors.InvalidValueError('Invalid DNS Profile Id length'))
    }

    let tier = parseInt(params['Tier'])
    if (tier !== 2) {
      if (UnauthorizedTiers.includes(tier)) {
        return reject(new Errors.UnauthorizedError('Customer is not authorized for provisioning Tier 0/1 DNS profiles'))
      }
      return reject(new Errors.InvalidValueError('Tier value for DNS profile is invalid'))
    }

    let records = params['NAPTR'] || []
    records = Array.isArray(records) ? records : [records]

    if (records.length === 0) {
      return reject(new Errors.ValueMissingError('Tier 2 DNS profile does not contain NAPTR records'))
    }

    if (records.length > MaxRecords) {
      return reject(new Errors.InvalidValueError(`Number of NAPTR records exceeds the maximum limit - ${MaxRecords}`))
    }

    resolve(P.race(records.map(x => exports.validateRecordRequest(x))))
  })
}

exports.validateRecordRequest = (record) => {
  return new P((resolve, reject) => {
    let order = record['Order'] || 0
    if (!isValidInteger(order)) {
      return reject(new Errors.InvalidValueError('NAPTR order value invalid'))
    }

    let pref = record['Preference'] || 0
    if (!isValidInteger(pref)) {
      return reject(new Errors.InvalidValueError('NAPTR preference value invalid'))
    }

    let domainName = record['DomainName'] || ''
    if (!domainName.trim()) {
      return reject(new Errors.InvalidValueError('Invalid domain name'))
    }

    let service = record['Service'] || ''
    if (!service.trim()) {
      return reject(new Errors.ValueMissingError('NAPTR service missing'))
    }

    let regexp = record['Regexp'] || {}
    if (!regexp.attributes) {
      regexp.attributes = {}
    }

    let regexpPattern = regexp['attributes']['pattern'] || ''
    if (!regexpPattern.trim()) {
      return reject(new Errors.ValueMissingError('NAPTR regexp pattern missing'))
    }

    let uri = regexp['$value'] || ''
    if (!uri.trim()) {
      return reject(new Errors.ValueMissingError('NAPTR regexp missing'))
    }

    let flags = record['Flags'] || ''
    if (!ValidFlags.includes(flags.toUpperCase())) {
      return reject(new Errors.InvalidValueError('NAPTR flags value invalid'))
    }

    if (!record.attributes) {
      record.attributes = {}
    }

    let ttl = parseInt(record['attributes']['ttl'])
    if (isNaN(ttl)) {
      return reject(new Errors.InvalidValueError('NAPTR ttl value invalid'))
    }

    let replacement = record['Replacement'] || ''
    if (!replacement.trim()) {
      return reject(new Errors.ValueMissingError('NAPTR replacement missing'))
    }
    let partner = (Array.isArray(record.Partner) ? record.Partner[0] : record.Partner) || {}
    if (!partner.attributes) {
      partner.attributes = {}
    }

    let partnerId = partner['attributes']['id'] || ''
    if (!partnerId.trim()) {
      return reject(new Errors.ValueMissingError('Partner value is missing'))
    }

    resolve()
  })
}

const validateDnsProfileId = (dnsProfileId) => {
  if (!dnsProfileId.trim()) {
    return P.reject(new Errors.InvalidValueError('Invalid DNS Profile Id length'))
  }

  return P.resolve()
}

const validateTn = (tn) => {
  let base = Array.isArray(tn.Base) ? (tn.Base.length === validTnRecords ? tn.Base[0] : tn.Base) : (tn['Base'] || '')

  if (Array.isArray(base)) {
    return P.reject(new Errors.NotImplementedError('Function has not been implemented for multiple single TNs'))
  }

  if (!base.trim()) {
    return P.reject(new Errors.InvalidValueError('TN base length is invalid'))
  }

  let stop = tn['Stop'] || ''
  if (stop.trim()) {
    return P.reject(new Errors.NotImplementedError('Function has not been implemented for multiple TNs using Stop'))
  }

  let size = tn['Size'] || ''
  if (size.trim()) {
    return P.reject(new Errors.NotImplementedError('Function has not been implemented for multiple TNs using Size'))
  }

  let countryCode = parseInt(tn['CountryCode'] || 1)
  if (isNaN(countryCode) || countryCode.toString().length > 3) {
    return P.reject(new Errors.InvalidValueError('Invalid country code'))
  }

  return P.resolve()
}

const isValidInteger = (val) => {
  let int = parseInt(val)
  return !isNaN(int) && (int > 0 && int <= 65535)
}
