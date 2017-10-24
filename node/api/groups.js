var Group = require("../models/Group");
var Status = require("./Status");
var ResponseHandler = require("./ResponseHandler");

var Router = (function(express){
  var router = express.Router();

  router.get("/", function(req, res){
    Group.find({})
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

  router.post("/", function(req, res){
    var group = new Group(req.body);
    group.create(req.session.getUserId())
      .then(function(response){
        var handler = new ResponseHandler(response, req.session.getLocale())
          .assert(function(response, body){
            return response.errors.length > 0;
          }, {
            message: i18n.getTranslatedText('groups.messages.success', req.session.getLocale()).format(req.body.name, "created")
          });

        handler.send(res);
      })
  });

  router.param("name", function(req, res, next, name){
    req.name = name;
    next();
  });

  router.get("/:name", function(req, res){
    var group = new Group({name: req.name});
    group.initialize()
      .then(function(response){
        var handler = new ResponseHandler(response, req.session.getLocale())
          .assert(function(response, body){
            return response.values.entrycount > 0;
          }, {
            i18nKey: "groups.errors.none",
            i18nData: req.name,
            status: Status.notfound
          })
          .assert(function(response, body){
            return response.values.entrycount < 2;
          }, {
            i18nKey: "groups.errors.multiple",
            i18nData: req.name,
            status: Status.error
          })
          .assert(function(response, body){
            return response.errors.length > 0;
          }, {
            handler: function(response, body){
              body.group = group.toJSON();
            }
          });

        handler.send(res);
      });
  });

  router.put("/:name", function(req, res){
    var group = new Group({name: req.name});
    group.initialize()
      .then(function(response){
        var handler = new ResponseHandler(response, req.session.getLocale());

        if(!handler.getStatus()){
          for(var key in req.body){
            group.setValue(key, req.body[key]);
          }

          group.update(req.session.getUserId())
            .then(function(updateRes){
              var updateHandler = new ResponseHandler(updateRes, req.session.getLocale())
                .assert(function(updateRes, body){
                  return updateRes.errors.length > 0;
                }, {
                  message: i18n.getTranslatedText("groups.messages.success", req.session.getLocale()).format(req.name, "updated")
                });

              handler.addBodyPart('update', updateHandler.toJSON());
              handler.setStatus(updateHandler.getStatus());
              handler.send(res);
            });
        }
        else {
          handler.send(res);
        }
      })
  });

  router.delete("/:name", function(req, res){
    Group.delete({name: req.name})
      .then(function(response){
        var handler = new ResponseHandler(response, req.session.getLocale())
          .assert(function(response, body){
            return response.errors.length > 0;
          }, {
            message: i18n.getTranslatedText('groups.messages.success', req.session.getLocale()).format(req.name, "deleted")
          });

        handler.send(res);
      });
  });

  router.post("/:name/members", function(req, res){
    if(req.body.username == undefined){
      var handler = new ResponseHandler({errors: ["groups.errors.create.member.nouser"]}, req.session.getLocale());
      handler.send(res);
    }
    else {
      var group = new Group({name: req.name});
      group.initialize()
        .then(function(response){
          var handler = new ResponseHandler(response, req.session.getLocale());

          if(!handler.getStatus()){
            var members = group.getValue('members');
            if(!Array.isArray(members)){
              members = [];
            }

            if(members.indexOf(req.body.username) > -1){
              var updateResponse = new ResponseHandler({errors: [i18n.getTranslatedText('groups.errors.create.member.exists', req.session.getLocale()).format(req.body.username)]}, req.session.getLocale());
              handler.addBodyPart('update', updateResponse.toJSON());
              handler.setStatus(Status.error);
              handler.send(res);
            }
            else {
              members.push(req.body.username);
              group.setProtectedValue('members', members);
              group.update(req.session.getUserId())
                .then(function(updateRes){
                  var updateHandler = new ResponseHandler(updateRes, req.session.getLocale())
                    .assert(function(updateRes, body){
                      return updateRes.errors.length < 0;
                    }, {
                      message: i18n.getTranslatedText('groups.messages.success', req.session.getLocale()).format(req.name, "updated")
                    });

                  handler.addBodyPart('update', updateHandler.toJSON());
                  handler.setStatus(updateHandler.getStatus());
                  handler.send(res);
                });
            }
          }
          else {
            handler.send(res);
          }
      });
    }
  });

  router.param("username", function(req, res, next, username){
    req.username = username;
    next();
  });

  router.delete("/:name/members/:username", function(req, res){
    var group = new Group({name: req.name});
    group.initialize()
      .then(function(response){
        var handler = new ResponseHandler(response, req.session.getLocale());

        if(!handler.getStatus()){
          var members = group.getValue('members');
          if(!Array.isArray(members) || members.indexOf(req.username) == -1){
            var updateResponse = new ResponseHandler({errors: [i18n.getTranslatedText('groups.errors.delete.member.notfound', req.session.getLocale()).format(req.username)]});
            handler.addBodyPart('update', updateResponse.toJSON());
            handler.setStatus(Status.error);
            handler.send(res);
          }
          else {
            members.splice(members.indexOf(req.username), 1);
            group.setProtectedValue('members', members);
            group.update(req.session.getUserId())
              .then(function(response){
                var updateRes = new ResponseHandler(response, req.session.getLocale())
                  .assert(function(updateRes, body){
                    return updateRes.errors.length > 0;
                  }, {
                    message: i18n.getTranslatedText("groups.messages.success", req.session.getLocale()).format(req.name, "updated")
                  });

                handler.addBodyPart('update', updateRes.toJSON());
                handler.setStatus(updateRes.getStatus());
                handler.send(res);
              });
          }
        }
        else {
          handler.send(res);
        }
      });
  });

  return router;
});

module.exports = Router;
