var crypto = require("crypto");

var ModelBase = require("./ModelBase");
var DataTypeAccessor = require("./datatypes/DataTypeAccessor");
var DataResponsePromise = require("./DataResponsePromise");
var ModelListPromise = require("./ModelListPromise");

function hashPassword(password, secret, created){
  var iters = created.toString().substring(created.toString().length - 6);
  var hash = crypto.createHash("sha256");
  while(iters > 0){
    hash.update(password+secret);
    iters--;
  }

  return hash.digest("hex");
}

var User = (function(user){
  user = user || {};
  var u = new ModelBase("users", {
    "username": {
      type: DataTypeAccessor.get("String"),
      required: true,
      protected: true,
      unique: true,
      pk: true
    },
    "fn": {
      type: DataTypeAccessor.get("String"),
      required: true
    },
    "ln": {
      type: DataTypeAccessor.get("String"),
      required: true
    },
    "password": {
      type: DataTypeAccessor.get("String"),
      required: true,
      protected: true,
      restricted: true
    },
    "secret": {
      type: DataTypeAccessor.get("String"),
      required: true,
      protected: true,
      restricted: true
    },
    "mn": {
      type: DataTypeAccessor.get("String")
    },
    "email": {
      type: DataTypeAccessor.get("Email")
    },
    "phone": {
      type: DataTypeAccessor.get("Phone")
    }
  });

  if(user){
    for(var key in user)
      u.setValue(key, user[key]);
  }

  if(user.username)
    u.setProtectedValue("username", user.username);
  if(user.password)
    u.setProtectedValue('password', user.password);

  u.prepareInsertDocument = function(promise, next){
    var secret = crypto.randomBytes(16).toString("hex");
    var password = u.getRestrictedValue('password');
    var created_on = u.getValue('created_on');

    u.setProtectedValue('secret', secret);

    if(password != null){
      u.setProtectedValue('password', hashPassword(password, secret, created_on));
    }
    else {
      u.setProtectedValue('password', "");
    }
    
    next(promise);
  };

  return u;
});

module.exports = User;
module.exports.find = function(query, opts){
  var promise = new ModelListPromise();

  new User().find(query, opts)
    .then(function(response){
      if(response.errors.length > 0){
        promise.fulfill("The following error(s) occurred performing the User lookup:\n" + response.errors.join("\n"));
      }

      else {
        var users = [];
        for(var i=0;i<response.entries.length;i++){
          var user = new User(response.entries[i]);
          user.setProtectedValue('created_on', response.entries[i].created_on);
          user.setProtectedValue('updated_on', response.entries[i].updated_on);
          user.setProtectedValue('created_by', response.entries[i].created_by);
          user.setProtectedValue('updated_by', response.entries[i].updated_by);
          user.setEntryId(response.entries[i]._id);

          user.initialized = true;
          users.push(user);
        }

        promise.fulfill(undefined, users);
      }
    });

  return promise;
};

module.exports.delete = function(query){
  return new User().delete(query);
}

module.exports.authenticate = function(username, password){
  var promise = new DataResponsePromise();
  var user = new User({username: username});
  user.initialize()
    .then(function(response){
      if(response.errors.length > 0){
        for(var i=0;i<response.errors.length;i++){
          promise.addErrorMessage(response.errors[i]);
        }
        promise.setResponseValue("success", false);
      }
      else {
        var secret = user.getRestrictedValue('secret');
        var created_on = user.getValue('created_on');
        if(secret != null && created_on != null){
          var pw = hashPassword(password, secret, created_on);
          promise.setResponseValue("success", (pw == user.getRestrictedValue('password')));
        }
        else {
          promise.addErrorMessage("An error occurred authenticating the user account. The account is not correctly configured. Please consult a system admin.");
          promise.setResponseValue("success", false);
        }
      }

      promise.fulfill();
    });

  return promise;
};
