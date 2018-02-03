const Lean = require('leanengine');
const axios = require('axios');

Lean.Cloud.afterUpdate('Animal', function(request) {
  return new Promise(function(resolve, reject){
    //
    if (request.object.attributes && request.object.attributes.location) {
      const {latitude, longitude} = request.object.attributes.location
      const requestUrl = `https://restapi.amap.com/v3/geocode/regeo?output=json&location=${longitude},${latitude}&key=63c62f4f4a84b92235f7bd33c94ffcfa`
      axios.get(requestUrl)
        .then(res => {
          const neighborhood = res.data.regeocode.formatted_address
          request.object.set('neighborhood', neighborhood)
          return request.object.save()
        })
        .then(animal => {
          console.log('updated Neighborhood of animal!!! it is: ' + animal.attributes.neighborhood)
          resolve(animal)
        })
        .catch(err => console.log(err))
    }
  });
});
