var AV = require('leanengine');


// update the users verification and role depending on credentials given
AV.Cloud.beforeUpdate('_User', function(request) {
  console.log('USER SAVE')
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


