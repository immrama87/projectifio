var Session = require("./Session");

var SessionManager = (function(){
  var sessions = {};

  function createId(){
    var template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"

    while(template.indexOf("x") > -1){
      template = template.substring(0, template.indexOf("x")) + Math.floor(Math.random() * 16).toString(16) + template.substring(template.indexOf("x") + 1);
    }

    var yVals = ["8", "9", "a", "b"];
    return template.replace("y", yVals[Math.floor(Math.random()*4)]);
  }

  return {
    createSession: function(username, now){
      var sessionId = createId();
      var session = new Session(username, now);
      sessions[sessionId] = session;

      return sessionId;
    },
    getSession: function(sessionId){
      var session;
      if(sessions.hasOwnProperty(sessionId)){
        if(!sessions[sessionId].isExpired()){
          session = sessions[sessionId];
        }
      }

      return session;
    }
  };
});

module.exports = SessionManager();
