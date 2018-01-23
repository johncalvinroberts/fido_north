var AV = require('leanengine');


// update the users verification and role depending on credentials given
AV.Cloud.beforeUpdate('_User', function(request, response) {
  console.log('user update hook');
  var adopterCredentials = request.object.get('personalNote') && request.object.get('wechatId') && request.object.get('age');
  var rescuerCredentials = request.object.get('id_number') && request.object.get('id_type') && request.object.get('age');
  if(adopterCredentials && !rescuerCredentials) {
    request.object.set('adoptVerified', true);
    request.object.save().then(function(user) {
      console.log('successfully updated adopterVerified');
      return response.success(user);
    });
  }
  if (adopterCredentials && rescuerCredentials) {
    console.log('user verified as rescuer');
    request.object.set('adoptVerified', true);
    request.object.set('is_rescuer', true);
    request.object.save().then(function(user) {
      console.log('successfully updated is_rescuer');
      return response.success(user);
    });
  }
});


