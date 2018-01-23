var AV = require('leanengine');


AV.Cloud.beforeSave('_User', function(request) {
  console.log('user save hook')
})

// update the users verification and role depending on credentials given
AV.Cloud.beforeUpdate('_User', function(request) {
  console.log('user update hook')
  var adopterCredentials = request.object.get('personalNote') && request.object.get('wechatId');
  var rescuerCredentials = request.object.get('id_number') && request.object.get('id_type')
  if(adopterCredentials && !rescuerCredentials) {
    console.log('verify as adopter');
    request.object.set('adoptVerified', true);
    request.object.save().then(function(obj) {
      console.log('successfully updated adoptVerified');
      return request;
    });
  }
  if (adopterCredentials && rescuerCredentials) {
    console.log('user verified as rescuer');
    request.object.set('adoptVerified', true);
    request.object.set('is_rescuer', true);
    request.object.save().then(function(obj) {
      console.log('successfully updated is_rescuer');
      return request;
    });
  }
});


