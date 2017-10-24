var User = require("../models/User");
var Group = require("../models/Group");
var Status = require("./Status");
var ResponseHandler = require("./ResponseHandler");

var Router = (function(express){
  var router = express.Router();

  router.get("/", function(req, res){
    User.find({})
      .then(function(err, iter){
        var handler = new ResponseHandler({}, req.session.getLocale())
          .assert(function(response, body){
            return body.error == undefined;
          }, {
            status: Status.error
          });

        if(err){
          handler.addBodyPart('error', err);
        }
        else {
          var users = [];
          while(iter.hasNext()){
            users.push(iter.next().toJSON());
          }

          handler.addBodyPart('users', users);
        }

        handler.send(res);
      });
  });

  router.post("/", function(req, res){
    var user = new User(req.body);
    user.create(req.session.getUserId())
      .then(function(response){
        var handler = new ResponseHandler(response, req.session.getLocale())
          .assert(function(response, body){
            return response.errors.length > 0;
          },{
            message: i18n.getTranslatedText("users.messages.success", req.session.getLocale()).format(req.body.username, "created")
          });

        handler.send(res);
      });
  });

  router.get("/me", function(req, res, next){
    var user = new User({username: req.session.getUserId()});
    user.initialize()
      .then(function(response){
        var handler = new ResponseHandler(response, req.session.getLocale())
          .assert(function(response, body){
            return response.errors.length > 0;
          }, {
            handler: function(response, body){
              body.user = user.toJSON();
            }
          });

        handler.send(res);
      });
  });

  router.param("username", function(req, res, next, username){
    req.username = username;
    next();
  });

  router.get("/:username", function(req, res){
    var user = new User({username: req.username});
    user.initialize()
      .then(function(response){
        var handler = new ResponseHandler(response, req.session.getLocale())
          .assert(function(response, body){
            return response.values.entrycount > 0;
          }, {
            i18nKey: "users.errors.none",
            i18nData: req.username,
            status: Status.notfound
          })
          .assert(function(response, body){
            return response.values.entrycount < 2;
          }, {
            i18nKey: "users.errors.multiple",
            i18nData: req.username,
            status: Status.error
          })
          .assert(function(response, body){
            return response.values.entrycount != 1;
          }, {
            handler: function(response, body){
              body.user = user.toJSON();
            }
          });

        handler.send(res);
      });
  });

  router.get("/:username/groups", function(req, res){
    Group.find({members: req.username}, {name: 1, description: 1})
      .then(function(err, iter){
        var handler = new ResponseHandler({}, req.session.getLocale())
          .assert(function(response, body){
            return body.error == undefined;
          }, {
            status: Status.error
          });

        if(err){
          handler.addBodyPart('error', err);
        }
        else {
          var groups = [];
          while(iter.hasNext()){
            groups.push(iter.next().toJSON());
          }

          handler.addBodyPart('groups', groups);
        }

        handler.send(res);
      });
  });

  router.put("/:username", function(req, res){
    var user = new User({username: req.username});
    user.initialize()
      .then(function(response){
        var handler = new ResponseHandler(response, req.session.getLocale());
        if(!handler.getStatus()){
          for(var key in req.body){
            user.setValue(key, req.body[key]);
          }
          user.update(req.session.getUserId())
            .then(function(updateRes){
              var updateHandler = new ResponseHandler(updateRes, req.session.getLocale())
                .assert(function(updateRes, body){
                  return updateRes.errors.length > 0;
                }, {
                  message: i18n.getTranslatedText("users.messages.success", req.session.getLocale()).format(req.username, "updated")
                });

              handler.addBodyPart("update", updateHandler.toJSON());
              handler.setStatus(updateHandler.getStatus());
              handler.send(res);
            });
        }
        else {
          handler.send(res);
        }
      });
  });

  router.delete("/:username", function(req, res){
    User.delete({username: req.username})
      .then(function(response){
        var handler = new ResponseHandler(response, req.session.getLocale())
          .assert(function(response, body){
            return response.errors.length > 0;
          }, {
            message: i18n.getTranslatedText("users.messages.success", req.session.getLocale()).format(req.username, "deleted")
          });

        handler.send(res);
      });
  });

  return router;
});

module.exports = Router;
