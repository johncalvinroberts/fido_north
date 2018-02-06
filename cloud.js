var Lean = require('leanengine');
var axios = require('axios');


Lean.Cloud.afterUpdate('Animal', function(request) {
  return new Promise(function(resolve, reject){
    var count = 0;
    if (request.object.attributes && request.object.attributes.location) {
      var {latitude, longitude} = request.object.attributes.location
      var requestUrl = `https://restapi.amap.com/v3/geocode/regeo?output=json&location=${longitude},${latitude}&key=63c62f4f4a84b92235f7bd33c94ffcfa`
      var getNeighborhood = function() {
        axios.get(requestUrl)
          .then(res => {
            var addressObj = res.data.regeocode.addressComponent;
            var neighborhood = addressObj.province + addressObj.district + addressObj.township;
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
