var AV = require('leanengine');


AV.Cloud.beforeSave('_User', function(request) {
  console.log('user save hook')
})

// update the users verification and role depending on credentials given
AV.Cloud.afterUpdate('_User', function(request) {
  console.log('USER UPDATE')
  var adopterCredentials = request.object.get('personalNote') && request.object.get('wechatId');
  var rescuerCredentials = request.object.get('id_number') && request.object.get('id_type')
  if(adopterCredentials && !rescuerCredentials) {
    console.log('user verified as adopter')
    request.object.set('adoptVerified', true);
  }
  if (adopterCredentials && rescuerCredentials) {
    console.log('user verified as rescuer')
    request.object.set('adoptVerified', true);
    request.object.set('is_rescuer', true);
  }
});


