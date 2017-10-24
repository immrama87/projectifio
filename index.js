var express = require("express");
var multer = require("multer");
var mongodb = require("mongodb");
var bodyParser = require("body-parser");
var mime = require("mime-types");
var sass = require('node-sass');
var path = require("path");

var API = require("./node/api/router");
var DB = require("./node/db/db");
var User = require("./node/models/User");
var i18n = require("./node/i18n/i18n");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const SessionManager = require("./node/sessions/SessionManager");

global.db = new DB(mongodb);
global.i18n = new i18n();

app.all("*", function(req, res, next){
  res.setHeader("Content-Type", "application/json");
  if(req.url.indexOf(".") > -1){
    next();
  }
  else if(req.url == "/login" && req.method == "POST"){
    next();
  }
  else {
    var session;
    var cookies = [];
    if(req.headers.cookie != undefined){
      cookies = req.headers.cookie.split(";");
    }
    for(var i=0;i<cookies.length;i++){
      var cookie = cookies[i].split("=");
      if(cookie[0] == "NSESSIONID"){
        session = SessionManager.getSession(cookie[1]);
        break;
      }
    }

    if(session == undefined || session == null){
      if(req.url.indexOf("/api") != 0){
        req.url = "/login";
        res.setHeader("Content-Type", "text/html");
      }
      else {
        res.status(401).end();
        return;
      }
    }
    else {
      session.setExpires(Date.now() + (60*60*1000));
      req.session = session;
    }
    next();
  }
});

app.post('/logout', function(req, res){
  if(req.session != undefined){
    req.session.setExpires(-1);
  }

  res.status(200).end(JSON.stringify({message: "Successfully logged out."}));
});

app.post('/login', function(req, res){
  if(!req.body.username || !req.body.password){
    res.status(500).end(JSON.stringify({message: "Provide a username and password to login."}));
    return;
  }

  User.authenticate(req.body.username, req.body.password)
    .then(function(response){
      if(response.values.success){
        var now = Date.now();
        var sessionId = SessionManager.createSession(req.body.username, now);
        var expires = now + (60*60*1000);
        res.writeHead(200, {
          "Set-Cookie": "NSESSIONID=" + sessionId + "; path=/; expires=" + new Date(expires).toUTCString()
        });
        res.end(JSON.stringify({message: "Successfully logged in."}));
      }
      else {
        res.status(401).end(JSON.stringify({message: "Could not authenticate with the provided credentials."}));
      }
    });
});

app.use("/api", new API(express));
app.use("/node_modules", express.static("node_modules", {
  etag: false,
  setHeaders: function(res, path){
    res.setHeader("Content-Type", mime.lookup(path) || "text/plain");
  }
}));

app.get('/**', function(req, res, next){
  if(req.url.indexOf(".") == -1)
    req.url = "/html/index.html";

  next();
});

app.get("**/*.scss", function(req, res, next){
  var file = path.join(__dirname, "web-content", req.url);
  sass.render({
    file: file
  }, function(err, result){
    if(err){
      res.status(500).end(err);
    }
    else {
      res.setHeader("Content-Type", "text/css");
      res.status(200).end(result.css);
    }
  })
});

app.use(express.static("web-content", {
  etag: false,
  setHeaders: function(res, path){
    res.setHeader("Content-Type", mime.lookup(path) || "text/plain");
  }
}));

app.listen(3000, function(){
  console.log("Started on port 3000");
});
