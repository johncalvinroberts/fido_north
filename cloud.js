var Lean = require('leanengine');
var axios = require('axios');
var _isEmpty = require('lodash.isempty');

// add neighborhood after saving animal

Lean.Cloud.afterUpdate('Animal', function(request) {
  return new Promise(function(resolve, reject){
    var count = 0;
    if (request.object.attributes && request.object.attributes.location) {
      var {latitude, longitude} = request.object.attributes.location
      var requestUrl = `https://restapi.amap.com/v3/geocode/regeo?output=json&location=${longitude},${latitude}&key=63c62f4f4a84b92235f7bd33c94ffcfa`
      var getNeighborhood = function () {
        axios.get(requestUrl)
          .then(res => {
            console.log('in the geocode response')
            var addressObj = res.data.regeocode.addressComponent;
            var neighborhood = addressObj.province + addressObj.district + addressObj.township;
            if (!neighborhood) {
              Object.keys(addressObj).map(function(field) {
                if (!_isEmpty(addressObj[field]) && isNaN(addressObj[field]) && addressObj[field] !== null) {
                  if (typeof addressObj[field] !== 'object') {
                    neighborhood = neighborhood + addressObj[field]
                  } else {
                    Object.keys(addressObj[field]).map(function(subField) {
                      var fieldObj = addressObj[field][subField]
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
            if (_isEmpty(neighborhood) || neighborhood == '' || !neighborhood) {
              neighborhood = 'somewhere...'
            }
            request.object.set('neighborhood', neighborhood);
            return request.object.save();
          })
          .then(animal => {
            console.log('updated Neighborhood of animal!!! it is: ' + animal.attributes.neighborhood);
            resolve(animal);
          })
          .catch(err => {
            count++
            console.log(err)
            if (count < 3) {
              console.log('fuck, it broke. trying again in like one second.');
              setTimeout(()=> getNeighborhood(), 1000);
            } else {
              console.log('seems to be a problem that recursive error handling can\'t fix sooo...')
            }
          })
      }
      getNeighborhood()
    }
  });
});

// delete likes and applications when animal is deleted

Lean.Cloud.afterDelete('Animal', function(request) {
  var animal = Lean.Object.createWithoutData('Animal', request.object.id);
  var likesReq = new Lean.Query('Like').equalTo('animal', animal).find();
  var appsReq = new Lean.Query('Application').equalTo('animal', animal).find();
  return Promise.all([likesReq, appsReq])
    .then((likesRes, appsRes) => {
      console.log()
      var likesDelReq = Lean.Object.destroyAll(likesRes)
      var appsDelReq = Lean.Object.destroyAll(appsRes)
      return Promise.all([likesDelReq, appsDelReq])
    })
    .then((likesDelRes, appsDelRes) => {
      console.log('yes, deleted the relations')
    })
    .catch(err=> {
      console.log('oh dear, something went wrong: ' + err.code + ': ' + err.message);
      console.dir(err);
    })
});


// get access code
Lean.Cloud.define('getAccessCode', function (request) {
  var requestUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.appId}&secret=${process.env.secretKey}`
  return new Promise((resolve, reject) => {
    axios.get(requestUrl)
      .then(({data}) => {
        console.log('got dat access token hyuh')
        var token = new Lean.Object('AccessToken', data)
        return token.save()
      })
      .then(res => {
        return resolve(res)
      })
      .catch(err => {
        return reject(new Error(err))
      })
  })
});

Lean.Cloud.define('generateQrCode', function ({params}) {
  console.log(params.id)
  return new Promise((resolve, reject) => {
    const query = new Lean.Query('AccessToken').descending('createdAt').limit(1)
    query.find()
      .then(res => {
        // const requestUrl = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessTokenRes[0].attributes.access_token}`
        const requestUrl = `https://api.weixin.qq.com/wxa/getwxacode?access_token=${res[0].attributes.access_token}`
        const data = {path: `/pages/animal-profile?animal=${params.id}`}
        return axios.post(requestUrl, data)
      })
      .then(({data}) => {
        console.log('successfully got qr code blob')
        return resolve(data)
      })
      .catch(err => {
        console.log('oh dear. it broke.')
        console.log(err)
        return reject(err)
      })
  })
})
