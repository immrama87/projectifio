var chakram = require("chakram"),
  expect = chakram.expect;

var config = require(__filename + ".config");
var SchemaGenerator = require(__dirname + "/../SchemaGenerator");

var sessionId;

describe("POST /login", function () {
  before(function(){
    var userSchema = {
      type: "object",
      properties: {
        created_by: {type: "string"},
        created_on: {type: "number"},
        email: {type: "string"},
        fn: {type: "string"},
        ln: {type: "string"},
        updated_by: {type: "string"},
        updated_on: {type: "number"},
        username: {type: "string"}
      },
      required: ["created_by", "created_on", "fn", "ln", "updated_by", "updated_on", "username"]
    };

    var usersSchemaBuilder = new SchemaGenerator().Builder();
    usersSchemaBuilder.addProperty('users', {
      type: 'array',
      items: userSchema
    }, true);

    var usersResponseSchema = usersSchemaBuilder.build();

    var userSchemaBuilder = new SchemaGenerator().Builder();
    userSchemaBuilder.addProperty('user', userSchema, true);

    var userResponseSchema = userSchemaBuilder.build();

    chakram.addMethod("usersSchema", function(response){
      expect(response).to.have.schema(usersResponseSchema);
    });

    chakram.addMethod("userSchema", function(response){
      expect(response).to.have.schema(userResponseSchema);
    });
  });

  it("Should return 500 when there is insufficient data", function () {
    return chakram.post("http://localhost:3000/login", {
      username: config.users.bad.username
    }).then(function(response){
      expect(response).to.have.status(500);
    });
  });

  it("Should return 401 when the data provided is invalid", function(){
    return chakram.post("http://localhost:3000/login", {
      username: config.users.bad.username,
      password: config.users.bad.password
    }).then(function(response){
      expect(response).to.have.status(401);
    });
  });

  it("Should return 200 and an NSESSIONID cookie when the data provided is valid", function(){
    return chakram.post("http://localhost:3000/login", {
      username: config.users.good.username,
      password: config.users.good.password
    }).then(function(response){
      expect(response).to.have.status(200);
      expect(response).to.have.cookie('NSESSIONID');

      var cookieDec = response.response.rawHeaders.indexOf("Set-Cookie");
      var cookie = response.response.rawHeaders[cookieDec+1];
      sessionId = cookie.substring(cookie.indexOf('NSESSIONID=') + ('NSESSIONID=').length, cookie.indexOf(";", cookie.indexOf('NSESSIONID=')));
    });
  });
});

describe("GET /api/users", function(){
  it("Should return 401 when no SessionID is provided", function(){
    return chakram.get("http://localhost:3000/api/users")
      .then(function(response){
        expect(response).to.have.status(401);
      });
  });

  it("Should return 200 and at least one user entry", function(){
    return chakram.get("http://localhost:3000/api/users", {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(userResponse){
        expect(userResponse).to.have.status(200);
        expect(userResponse).to.have.usersSchema();
      });
  });
});

describe("POST /api/users", function(){
  it("Should return 401 when no SessionID is provided", function(){
    return chakram.post("http://localhost:3000/api/users", {})
      .then(function(response){
        expect(response).to.have.status(401);
      });
  });

  it("Should return 500 when there is insufficient data", function(){
    return chakram.post("http://localhost:3000/api/users", {username: config.users.test.password}, {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(500);
        expect(response).to.have.json('responseDetails.errors[0]', "No value was provided for the following required field(s): 'First Name', 'Last Name', 'Password'.");
      });
  });

  it("Should return 500 when the data provided collides with an existing account", function(){
    return chakram.post("http://localhost:3000/api/users", {
      username: config.users.good.username,
      password: config.users.test.password,
      fn: config.users.test.fn,
      ln: config.users.test.ln
    }, {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(500);
        expect(response).to.have.json('responseDetails.errors[0]', "Could not insert the User object because of a unique index violation on the Username field.");
      });
  });

  it("Should return 200 and a success message otherwise", function(){
    return chakram.post("http://localhost:3000/api/users", config.users.test, {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(200);
      });
  });
});

describe("GET /api/users/me", function(){
  it("Should return 401 when no SessionID is provided", function(){
    return chakram.get("http://localhost:3000/api/users/me")
      .then(function(response){
        expect(response).to.have.status(401);
      });
  });

  it("Should return 200 and the details of the user logged in", function(){
    return chakram.get("http://localhost:3000/api/users/me", {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(200);
        expect(response).to.have.userSchema();
        expect(response).to.have.json('user.username', config.users.good.username);
      });
  });
});

describe("GET /api/users/:username", function(){
  it("Should return 401 when no SessionID is provided", function(){
    return chakram.get("http://localhost:3000/api/users/" + config.users.test.username)
      .then(function(response){
        expect(response).to.have.status(401);
      });
  });

  it("Should return 200 and the details of the user requested", function(){
    return chakram.get("http://localhost:3000/api/users/" + config.users.test.username, {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(200);
        expect(response).to.have.userSchema();
        expect(response).to.have.json('user.username', config.users.test.username);
      });
  })
});

describe("PUT /api/users/:username", function(){
  it("Should return 401 when no SessionID is provided", function(){
    return chakram.put("http://localhost:3000/api/users/" + config.users.test.username)
      .then(function(response){
        expect(response).to.have.status(401);
      });
  });

  it("Should return 200 and an update message", function(){
    return chakram.put("http://localhost:3000/api/users/" + config.users.test.username, config.users.update, {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(200);
        expect(response).to.comprise.of.json({
          update: {
            message: "Successfully updated user '" + config.users.test.username + "'."
          }
        });
      });
  });

  it("and then the user's details should reflect the update", function(){
    return chakram.get("http://localhost:3000/api/users/" + config.users.test.username, {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(200);
        expect(response).to.have.userSchema();

        for(var key in config.users.update){
          expect(response).to.have.json("user." + key, config.users.update[key]);
        }
      });
  });
});

describe("DELETE /api/users/:username", function(){
  it("Should return 401 when no SessionID is provided", function(){
    return chakram.delete("http://localhost:3000/api/users/" + config.users.test.username)
      .then(function(response){
        expect(response).to.have.status(401);
      });
  });

  it("Should return 200 and a deleted count", function(){
    return chakram.delete("http://localhost:3000/api/users/" + config.users.test.username, {}, {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(200);
        expect(response).to.comprise.of.json({
          message: "Successfully deleted user '" + config.users.test.username + "'."
        });
      });
  });

  it("and then the user should no longer exist in the system", function(){
    return chakram.get("http://localhost:3000/api/users/" + config.users.test.username, {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(404);
      });
  });
});

describe("POST /logout", function(){
  it("Should return 200 and destroy the session", function(){
    return chakram.post("http://localhost:3000/logout", {}, {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(200);
      });
  });

  it("and then return a 401 for API requests with that SessionID", function(){
    return chakram.get("http://localhost:3000/api/users/me", {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(401);
      })
  });
});
