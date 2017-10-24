var chakram = require("chakram"),
  expect = chakram.expect;

var config = require(__filename + ".config");

var sessionId;

describe("POST /login", function () {
  it("Should return 200 and an NSESSIONID cookie when the data provided is valid", function(){
    return chakram.post("http://localhost:3000/login", config.user).then(function(response){
      expect(response).to.have.status(200);
      expect(response).to.have.cookie('NSESSIONID');

      var cookieDec = response.response.rawHeaders.indexOf("Set-Cookie");
      var cookie = response.response.rawHeaders[cookieDec+1];
      sessionId = cookie.substring(cookie.indexOf('NSESSIONID=') + ('NSESSIONID=').length, cookie.indexOf(";", cookie.indexOf('NSESSIONID=')));
    });
  });
});

describe("GET /api/groups", function(){
  it("Should return 401 when no NSESSIONID is provided", function(){
    return chakram.get("http://localhost:3000/api/groups")
      .then(function(response){
        expect(response).to.have.status(401);
      });
  });

  it("Should return 200 and a list of all groups in the system", function(){
    return chakram.get("http://localhost:3000/api/groups", {headers: {'Cookie': "NSESSIONID=" + sessionId + ";"}})
      .then(function(response){
        expect(response).to.have.status(200);
      });
  });
})
