var VFSFolder = require("../models/VFSFolder");
var VFSFile = require("../models/VFSFile");
var ResponseHandler = require("./ResponseHandler");
var Status = require("./Status");
var VFSPromise = require("./VFSPromise");

var VFS = (function(express){
  var router = express.Router();

  function getFolder(name, parent, path, locale){
    var promise = new VFSPromise();

    var folderDetails = {name: name};
    if(parent){
      folderDetails.parent = parent.getEntryId();
    }
    else {
      folderDetails.parent = null;
    }

    var folder = new VFSFolder(folderDetails);
    folder.initialize()
      .then(function(response){
        var handler = new ResponseHandler(response, locale)
          .assert(function(response, body){
            return response.values.entrycount < 2;
          }, {
            i18nKey: 'folders.errors.multiple',
            i18nData: path,
            status: Status.error
          });

        if(response.values.entrycount == 1 && !handler.getStatus()){
          promise.fulfill(undefined, folder);
        }
        else if(response.values.entrycount > 1 || handler.getStatus()){
          promise.fulfill(handler);
        }
        else {
          promise.fulfill();
        }
      });

    return promise;
  }

  function getFolderFromPath(path, parent, currentPath, locale){
    var promise = new VFSPromise();

    if(path.charAt(0) == '/')
      path = path.substring(1);

    var dirEnd = path.indexOf("/");
    if(dirEnd == -1)
      dirEnd = path.length;
    var dir = path.substring(0, dirEnd);
    currentPath += "/" + dir;

    getFolder(dir, parent, currentPath, locale)
      .then(function(response, folder){
        if(response){
          promise.fulfill(response);
        }
        else if(folder){
          path = path.substring(dir.length);
          if(path.length > 0){
            getFolderFromPath(path, folder, currentPath, locale)
              .then(promise.fulfill);
          }
          else {
            promise.fulfill(undefined, folder);
          }
        }
        else {
          var handler = new ResponseHandler({}, locale);
          handler.addI18nErrorMessage('folders.errors.none', currentPath);
          promise.fulfill(handler);
        }
      });

    return promise;
  }

  function getFile(name, parent, path, locale){
    var promise = new VFSPromise();
    var fileDetails = {name: name};

    if(parent){
      fileDetails.parent = parent.getEntryId();
    }
    else {
      fileDetails.parent = null;
    }

    var file = new VFSFile(fileDetails);
    file.initialize()
      .then(function(response){
        var handler = new ResponseHandler(response, locale)
          .assert(function(response, body){
            return response.values.entrycount < 2;
          }, {
            i18nKey: 'files.errors.multiple',
            i18nData: path,
            status: Status.error
          });

        if(response.values.entrycount == 1 && !handler.getStatus()){
          promise.fulfill(undefined, file);
        }
        else if(response.values.entrycount > 1 || handler.getStatus()){
          promise.fulfill(handler);
        }
        else {
          promise.fulfill();
        }
      });

    return promise;
  }

  router.get("/", function(req, res){
    if(req.dir){
      req.vfserrors = req.vfserrors || [];
      var path = req.vfspath ? req.vfspath.join("/") : "/";
      if(req.vfserrors.length > 0){
        var handler = new ResponseHandler({errors: req.vfserrors}, req.session.getLocale());
        handler.send(res);
      }
      else {
        getFolder(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
          .then(function(handler, folder){
            if(folder){
              folder.getContents()
                .then(function(handler, folderList, fileList){
                  if(folderList && fileList){
                    var folders = [];
                    while(folderList.hasNext()){
                      folders.push(folderList.next().toJSON());
                    }

                    var files = [];
                    while(fileList.hasNext()){
                      files.push(fileList.next().toJSON());
                    }


                    handler = new ResponseHandler({}, req.session.getLocale());
                    handler.addBodyPart('folders', folders);
                    handler.addBodyPart('files', files);
                    handler.send(res);
                  }
                  else if(handler){
                    handler.send(res);
                  }
                  else {
                    new ResponseHandler({errors: ['generic.errors.undefined']}, req.session.getLocale)
                      .send(res);
                  }
                });
            }
            else if(handler){
              handler.send(res);
            }
            else {
              getFile(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
                .then(function(fileHandler, file){
                  if(fileHandler){
                    fileHandler.send(res);
                  }
                  else {
                    fileHandler = new ResponseHandler({}, req.session.getLocale());

                    if(file){
                      fileHandler.addBodyPart('file', file.toJSON());
                    }
                    else {
                      fileHandler.addI18nErrorMessage('files.errors.none', req.vfspath.join("/"));
                      fileHandler.setStatus(Status.notfound);
                    }

                    fileHandler.send(res);
                  }
                });
            }
          });
      }
    }
    else {
      VFSFolder.find({parent: null})
        .then(function(err, folderList){
          if(err){
            new ResponseHandler({errors: [err]}, req.session.getLocale()).send(res);
          }
          else {
            VFSFile.find({parent: null})
              .then(function(fileErr, fileList){
                if(fileErr){
                  new ResponseHandler({errors: [fileErr]}, req.session.getLocale()).send(res);
                }
                else {
                  var folders = [],
                    files = [];

                  while(folderList.hasNext()){
                    folders.push(folderList.next().toJSON());
                  }

                  while(fileList.hasNext()){
                    files.push(fileList.next().toJSON());
                  }

                  var handler = new ResponseHandler({}, req.session.getLocale());
                  handler.addBodyPart('folders', folders);
                  handler.addBodyPart('files', files);
                  handler.send(res);
                }
              });
          }
        });
    }
  });

  router.put("/", function(req, res){
    if(!req.dir){
      new ResponseHandler({errors: ['folders.errors.update.root']}, req.session.getLocale()).send(res);
    }
    else {
      getFolder(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
        .then(function(folderHandler, folder){
          if(folder){
            for(var key in req.body){
              folder.setValue(key, req.body[key]);
            }

            folder.update(req.session.getUserId())
              .then(function(response){
                new ResponseHandler(response, req.session.getLocale())
                  .assert(function(response, body){
                    return response.errors.length > 0;
                  }, {
                    message: i18n.getTranslatedText('folders.messages.success', req.session.getLocale()).format(req.vfspath.join("/"), "updated")
                  })
                  .send(res);
              });
          }
          else if(folderHandler){
            folderHandler.send(res);
          }
          else {
            getFile(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
              .then(function(fileHandler, file){
                if(file){
                  for(var key in req.body){
                    file.setValue(key, req.body[key]);
                  }

                  file.update(req.session.getUserId())
                    .then(function(response){
                      new ResponseHandler(response, req.session.getLocale())
                        .assert(function(response, body){
                          return response.errors.length > 0;
                        }, {
                          message: i18n.getTranslatedText('files.messages.success', req.session.getLocale()).format(req.vfspath.join("/"), "updated")
                        })
                        .send(res);
                    });
                }
                else {
                  if(folderHandler){
                    fileHandler.send(res);
                  }
                  else {
                    fileHandler = new ResponseHandler({}, req.session.getLocale());
                    fileHandler.addI18nErrorMessage('files.errors.none', req.vfspath.join("/"));
                    fileHandler.send(res);
                  }
                }
              });
          }
        });
    }
  })

  router.put("/move", function(req, res){
    if(!req.dir){
      new ResponseHandler({errors: ['folders.errors.move.root']}, req.session.getLocale()).send(res);
    }
    else {
      getFolder(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
        .then(function(handler, folder){
          if(handler){
            handler.send(res);
          }
          else if(folder){
            getFolderFromPath(req.body.newPath, undefined, "", req.session.getLocale())
              .then(function(parentHandler, parent){
                if(parentHandler){
                  parentHandler.send(res);
                }
                else if(parent){
                  folder.setProtectedValue('parent', parent.getEntryId());
                  folder.update(req.session.getUserId())
                    .then(function(response){
                      new ResponseHandler(response, req.session.getLocale())
                        .assert(function(response, body){
                          return response.errors.length > 0;
                        }, {
                          message: i18n.getTranslatedText('folders.messages.success.move', req.session.getLocale()).format(req.dir, "/" + req.vfspath.join("/"), req.body.newPath + "/" + req.dir)
                        })
                        .send(res);
                    });
                }
                else {
                  new ResponseHandler({errors: ['generic.errors.undefined']}, req.session.getLocale()).send(res);
                }
              });
          }
          else {
            getFile(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
              .then(function(fileHandler, file){
                if(fileHandler){
                  fileHandler.send(res);
                }
                else if(file){
                  getFolderFromPath(req.body.newPath, undefined, "", req.session.getLocale())
                    .then(function(parentHandler, parent){
                      if(parentHandler){
                        parentHandler.send(res);
                      }
                      else if(parent){
                        file.setProtectedValue('parent', parent.getEntryId());
                        file.update(req.session.getUserId())
                          .then(function(response){
                            new ResponseHandler(response, req.session.getLocale())
                              .assert(function(response, body){
                                return response.errors.length > 0;
                              }, {
                                message: i18n.getTranslatedText('files.messages.success.move', req.session.getLocale()).format(req.dir, "/" + req.vfspath.join("/"), req.body.newPath + "/" + req.dir)
                              })
                              .send(res);
                          });
                      }
                      else {
                        new ResponseHandler({errors: ['generic.errors.undefined']}, req.session.getLocale()).send(res);
                      }
                    });
                }
                else {
                  var handler = new ResponseHandler({}, req.session.getLocale());
                  handler.addI18nErrorMessage('files.errors.none', req.vfspath.join("/"));
                  handler.setStatus(Status.notfound);
                  handler.send(res);
                }
              });
          }
        });
    }
  });

  router.put("/contents", function(req, res){
    if(!req.dir){
      new ResponseHandler({errors: ['folders.errors.contents']}, req.session.getLocale()).send(res);
    }
    else {
      getFile(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
        .then(function(handler, file){
          if(handler){
            handler.send(res);
          }
          else if(file){

          }
          else {
            new ResponseHandler()
          }
        })
    }
  });

  router.delete("/", function(req, res){
    if(!req.dir){
      new ResponseHandler({errors: ['folders.errors.delete.root']}, req.session.getLocale()).send(res);
    }
    else {
      getFolder(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
        .then(function(folderHandler, folder){
          if(folderHandler){
            folderHandler.send(res);
          }
          else if(folder){
            folder.getContents()
              .then(function(contentsHandler, folders, files){
                if(contentsHandler){
                  contentsHandler.send(res);
                }
                else {
                  if(folders.hasNext() || files.hasNext()){
                    new ResponseHandler({errors: [i18n.getTranslatedText('folders.errors.delete.notempty', req.session.getLocale()).format(req.vfspath.join('/'))]}, req.session.getLocale()).send(res);
                  }
                  else {
                    VFSFolder.delete({_id: folder.getEntryId()})
                      .then(function(response){
                        new ResponseHandler(response, req.session.getLocale())
                          .assert(function(response, body){
                            return response.errors.length > 0;
                          }, {
                            message: i18n.getTranslatedText('folders.messages.success', req.session.getLocale()).format(req.vfspath.join("/"), "deleted")
                          })
                          .send(res);
                      });
                  }
                }
              });
          }
          else {
            getFile(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
              .then(function(fileHandler, file){
                if(fileHandler){
                  fileHandler.send(res);
                }
                else if(file){
                  VFSFile.delete({_id: file.getEntryId()})
                    .then(function(response){
                      new ResponseHandler(response, req.session.getLocale())
                        .assert(function(response, body){
                          return response.errors.length > 0;
                        }, {
                          message: i18n.getTranslatedText('files.messages.success', req.session.getLocale()).format(req.vfspath.join("/"), "deleted")
                        })
                        .send(res);
                    });
                }
                else {
                  var handler = new ResponseHandler({errors: [i18n.getTranslatedText('files.errors.none', req.session.getLocale()).format(req.vfspath.join('/'))]}, req.session.getLocale());
                  handler.setStatus(Status.notfound);
                  handler.send(res);
                }
              });
          }
        });
    }
  });

  router.post("/dir", function(req, res){
    if(req.dir){
      getFolder(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
        .then(function(handler, folder){
          if(handler){
            handler.send(res);
          }
          else if(folder){
            var newDir = new VFSFolder({name: req.body.name, parent: folder.getEntryId()});
            newDir.create(req.session.getUserId())
              .then(function(response){
                new ResponseHandler(response, req.session.getLocale())
                  .assert(function(response, body){
                    return response.errors.length > 0;
                  }, {
                    message: i18n.getTranslatedText('folders.messages.success', req.session.getLocale()).format(req.vfspath.join("/") + "/" + req.body.name, "created")
                  })
                  .send(res);
              });
          }
          else {
            new ResponseHandler({errors: ['generic.errors.undefined']}, req.session.getLocale()).send(res);
          }
        });
    }
    else {
      var newDir = new VFSFolder({name: req.body.name, parent: null});
      newDir.create(req.session.getUserId())
        .then(function(response){
          new ResponseHandler(response, req.session.getLocale())
            .assert(function(response, body){
              return response.errors.length > 0;
            }, {
              message: i18n.getTranslatedText('folders.messages.success', req.session.getLocale()).format("/" + req.body.name, "created")
            })
            .send(res);
        });
    }
  });

  router.post("/file", function(req, res){
    if(req.dir){
      getFolder(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
        .then(function(response, folder){
          if(response){
            response.send(res);
          }
          else if(folder){
            var file = new VFSFile({name: req.body.name, parent: folder.getEntryId()});
            file.create(req.session.getUserId())
              .then(function(createResponse){
                new ResponseHandler(createResponse, req.session.getLocale())
                  .assert(function(response, body){
                    return response.errors.length > 0;
                  }, {
                    message: i18n.getTranslatedText('files.messages.success', req.session.getLocale()).format(req.vfspath.join("/") + "/" + req.body.name, "created")
                  })
                  .send(res);
              });
          }
          else {
            var noFolderHandler = new ResponseHandler({}, req.session.getLocale());
            noFolderHandler.addI18nErrorMessage('folders.errors.none', req.vfspath.join("/"));
            noFolderHandler.setStatus(Status.notfound);
            noFolderHandler.send(res);
          }
        });
    }
    else {
      var file = new VFSFile({name: req.body.name, parent: null});
      file.create(req.session.getUserId())
        .then(function(createResponse){
          new ResponseHandler(createResponse, req.session.getLocale())
            .assert(function(response, body){
              return response.errors.length > 0;
            }, {
              message: i18n.getTranslatedText('files.messages.success', req.session.getLocale()).format("/" + req.body.name, "created")
            })
            .send(res);
        });
    }
  });

  router.param("dir", function(req, res, next, dir){
    req.vfspath = req.vfspath || [];
    req.vfserrors = req.vfserrors || [];

    req.vfspath.push(dir);

    if(req.dir){
      getFolder(req.dir, req.parentDir, req.vfspath.join("/"), req.session.getLocale())
        .then(function(handler, folder){
          if(folder){
            req.parentDir = folder;
          }
          else if(handler){
            handler = handler.toJSON();
            req.vfserrors = req.vfserrors.concat(handler.responseDetails.errors);
          }
          else {
            req.vfserrors.push(i18n.getTranslatedText('folders.errors.none', req.session.getLocale()).format(req.vfspath.join("/")));
          }

          req.dir = dir;
          next();
        });
    }
    else {
      req.dir = dir;
      next();
    }
  });

  router.use("/:dir", router);

  return router;
});

module.exports = VFS;
