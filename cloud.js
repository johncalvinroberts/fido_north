var AV = require('leanengine');


// update the users verification and role depending on credentials given
AV.Cloud.beforeSave('_User', function(request) {
  var adopterCredentials = request.object.get('personalNote') && request.object.get('wechatId');
  var rescuerCredentials = request.object.get('id_number') && request.object.get('id_type')
  if(adopterCredentials && !rescuerCredentials) {
    request.object.set('adoptVerified', true);
  }
  if (adopterCredentials && rescuerCredentials) {
    request.object.set('adoptVerified', true);
    request.object.set('is_rescuer', true);
  }
});
