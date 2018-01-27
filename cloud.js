var AV = require('leanengine');


// update the users verification and role depending on credentials given

// AV.Cloud.afterUpdate('_User', function(request) {
//   console.log('user update hook');
//   return new Promise(function(resolve, reject){
//     var adopterCredentials = request.object.get('personalNote') && request.object.get('wxUsername') && request.object.get('age');
//     var rescuerCredentials = request.object.get('idNumber') && request.object.get('idType') && request.object.get('age');
//     if(adopterCredentials && rescuerCredentials) {
//       request.object.set('adoptVerified', true);
//       request.object
//         .save()
//         .then(function(user) {
//         console.log('successfully updated adopterVerified');
//         resolve(user);
//       })
//         .catch(err => reject(err));
//     }
//   });
// });
