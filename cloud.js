const Lean = require('leanengine')
const axios = require('axios')
const _isEmpty = require('lodash.isempty')


//Parse response from geocode API endpoint
async function _handleGeoResponse (res) {
  const addressObj = res.data.regeocode.addressComponent;
  let neighborhood = addressObj.province + addressObj.district + addressObj.township
  if (!neighborhood) {
    Object.keys(addressObj).map(function(field) {
      if (!_isEmpty(addressObj[field]) && isNaN(addressObj[field]) && addressObj[field] !== null) {
        if (typeof addressObj[field] !== 'object') {
          neighborhood = neighborhood + addressObj[field]
        } else {
          Object.keys(addressObj[field]).map(function(subField) {
            const fieldObj = addressObj[field][subField]
            if (!_isEmpty(fieldObj) && isNaN(fieldObj) && fieldObj !== null && typeof fieldObj !== 'object') {
              if (subField !== 'location') {
                neighborhood = neighborhood + fieldObj
              }
            }
          })
        }
      }
    })
  }
  if (!neighborhood) neighborhood = 'somewhere...'
  return neighborhood
}


// Fetch the the geo info and handle the response
async function _getGeoCode (requestUrl) {
  return new Promise ( async (resolve, reject) => {
    let count = 0
    const getNeighborhood = async () => {
      try {
        const geoRes = await axios.get(requestUrl)
        const neighborhood = _handleGeoResponse(geoRes)
        return neighborhood
      } catch (err) {
        count++
        console.log(err)
        if (count < 3) {
          console.log('fuck, it broke. trying again in like one second.')
          setTimeout(()=> getNeighborhood(), 1000)
        } else {
          return Promise.reject(err)
          console.log('seems to be a problem that recursive error handling can\'t fix sooo...')
        }
      }
    }
    try {
      const neighborhood = await getNeighborhood()
      return resolve(neighborhood)
    } catch (err) {
      return reject(err)
    }
  })
}

// set qrCodeUrl and neighborhood of an animal after they are updated
Lean.Cloud.afterUpdate('Animal', function(request) {
  return new Promise( async (resolve, reject) => {
    if (request.object.attributes && request.object.attributes.location) {
      const {latitude, longitude} = request.object.attributes.location
      const id = request.object.attributes.objectId
      const requestUrl = `https://restapi.amap.com/v3/geocode/regeo?output=json&location=${longitude},${latitude}&key=63c62f4f4a84b92235f7bd33c94ffcfa`
      try {
        const neighborhoodPromise = _getGeoCode(requestUrl)
        const qrCodePromise = request.object.attributes.qrCodeUrl ? setTimeout(() => request.object.attributes.qrCodeUrl, 0) : Lean.Cloud.run('generateQrCode', {id})
        const [neighborhood, qrCodeRes] = await Promise.all([neighborhoodPromise, qrCodePromise])
        const qrCodeUrl = qrCodeRes.attributes.url
        request.object.set({neighborhood, qrCodeUrl})
        const animal = await request.object.save()
        console.log(`Updated animal ${animal.attributes.name} qrCodeUrl and neighborhood. neighborhood: ${animal.attributes.neighborhood}`)
        return resolve(animal)
      } catch (err) {
        console.error('oh dear (◐‿◑)﻿, seems to be a mistake.')
        return reject(err)
      }
    }
  })
})

// delete likes and applications when animal is deleted
Lean.Cloud.afterDelete('Animal', (request) => {
  return new Promise (async (resolve, reject) => {
    try {
      const animal = Lean.Object.createWithoutData('Animal', request.object.id)
      const likesReq = new Lean.Query('Like').equalTo('animal', animal).find()
      const appsReq = new Lean.Query('Application').equalTo('animal', animal).find()
      const [likesRes, appsRes] = await Promise.all([likesReq, appsReq])
      const likesDelReq = Lean.Object.destroyAll(likesRes)
      const appsDelReq = Lean.Object.destroyAll(appsRes)
      await Promise.all([likesDelReq, appsDelReq])
      console.log('yes, deleted the relations and animal')
      return resolve()
    } catch (err) {
      return reject(err)
    }
  })
});


// get access code
Lean.Cloud.define('getAccessCode', () => {
  var requestUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.appId}&secret=${process.env.secretKey}`
  return new Promise(async (resolve, reject) => {
    try {
      const {data} = await axios.get(requestUrl)
      process.env['wx_access_token'] = data.access_token
      console.log(`Got WX access token. `)
      return resolve()
    } catch (err) {
      return reject(new Error(err))
    }
  })
})

async function _getQrCode (id) {
  const requestUrl = `https://api.weixin.qq.com/wxa/getwxacode?access_token=${process.env.wx_access_token}`
  const data = {path: `/pages/animal-profile?animal=${id}`}
  try {
    const rawQrCode = await axios.post(requestUrl, data, {responseType: 'arraybuffer'})
    var file = new Lean.File(`qr_${id}.png`, rawQrCode.data, 'image/png')
    const saveRes = await file.save()
    return saveRes
  } catch (err) {
    Promise.reject(err)
  }
}

Lean.Cloud.define('generateQrCode', ({params}) => {
  console.log('（；￣ェ￣）generating qr code!!')
  return new Promise(async (resolve, reject) => {
    try {
      if (!process.env.wx_access_token) {
       await Lean.Cloud.run('getAccessCode')
     }
      const qrCodeRes = await _getQrCode(params.id)
      return resolve(qrCodeRes)
    } catch (err) {
      return reject(err)
    }
  })
})


Lean.Cloud.define('updateAnimalAges', function (request) {
  return new Promise(async (resolve, reject) => {
    try {
      const query = new Lean.Query('Animal')
      const animals = await query.find()
      animals.map(animal => animal.set({age: animal.attributes.age + 1}))
      const res = await Lean.Object.saveAll(animals)
      console.log('Successfully updated the animals( ^ω^ )')
      return resolve(res)
    } catch (err) {
      return reject(err)
    }
  })
})





