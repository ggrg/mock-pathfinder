'use strict'

exports.mapToPhoneRequest = (params) => {
  return mapToPhone(params)
}

exports.mapToQueryPhoneRequest = (params) => {
  let request = { phone: {}, profileName: '' }
  if ('TN' in params) {
    request.phone = mapToPhone(params)
  } else if ('DNSProfileID' in params) {
    request.profileName = mapToProfileName(params)
  }
  return request
}

exports.mapToQueryProfileRequest = (params) => {
  return {
    profileName: params['ProfileID'].trim()
  }
}

exports.mapToChangePhoneStatusRequest = (params) => {
  return {
    phone: mapToPhone(params),
    profileName: mapToProfileName(params),
    status: (params['Status'] || 'active').toLowerCase()
  }
}

exports.mapToCreateUpdateProfileRequest = (params) => {
  let records = params['NAPTR']
  records = Array.isArray(records) ? records : [records]

  return {
    profileName: params['ProfileID'].trim(),
    tier: parseInt(params['Tier']),
    records: records.map(mapToRecord)
  }
}

const mapToRecord = (record) => {
  return {
    order: parseInt(record.Order),
    preference: parseInt(record.Preference),
    ttl: parseInt(record.attributes.ttl),
    domainName: record.DomainName.trim(),
    flags: record.Flags.trim().toLowerCase(),
    service: record.Service.trim(),
    regexp: record.Regexp.attributes.pattern.trim(),
    uri: record.Regexp.$value.trim(),
    replacement: record.Replacement.trim(),
    partnerId: record.Partner[0].attributes.id.trim(),
    countryCode: false
  }
}

const mapToProfileName = (params) => {
  return params['DNSProfileID'].trim()
}

const mapToPhone = (params) => {
  return {
    number: params['TN']['Base'][0],
    countryCode: params['TN']['CountryCode'] || '1'
  }
}
