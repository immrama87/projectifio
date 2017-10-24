var DataTypeAccessor = require("./datatypes/DataTypeAccessor");
var FileContentItem = require('./FileContentItem');
var ModelBase = require("./ModelBase");
var ModelListPromise = require("./ModelListPromise");

var VFSFile = (function(file){
  file = file || {};

  var vfsf = new ModelBase("files", {
    name: {
      type: DataTypeAccessor.get("String"),
      pk: true,
      required: true
    },
    parent: {
      type: DataTypeAccessor.get("ObjectID"),
      protected: true
    },
    root: {
      type: DataTypeAccessor.get("ObjectID"),
      protected: true
    }
  }, {
    parentname: ["name", "parent"]
  });

  for(var key in file){
    vfsf.setValue(key, file[key]);
  }

  if(file.parent)
    vfsf.setProtectedValue('parent', file.parent);

  if(file.root)
    vfsf.setProtectedValue('root', file.root);

  vfsf.prepareInitializationQuery = function(){
    return {parent: vfsf.getValue('parent')};
  };

  vfsf.prepareInsertDocument = function(promise, next){
    var name = vfsf.getValue('name');
    if(name == null){
      promise.addErrorMessage('files.errors.name');
      next(promise);
      return;
    }

    var fileName = name.replace(/\s/g, "_") + ".md";

    var fileContentItem = new FileContentItem(fileName, "#" + name);
    fileContentItem.create()
      .then(function(response){
        if(response.errors.length > 0){
          for(var i=0;i<response.errors.length;i++){
            promise.addErrorMessage(response.errors[i]);
          }
        }
        else if(response.values.fileId){
          vfsf.setProtectedValue('root', response.values.fileId);
        }

        next(promise);
      });
  }

  return vfsf;
});

module.exports = VFSFile;
module.exports.find = function(q, opts){
  var promise = new ModelListPromise();

  new VFSFile().find(q, opts)
    .then(function(response){
      if(response.errors.length > 0){
        promise.fulfill("The following error(s) occurred performing the VFS lookup:\n" + response.errors.join("\n"));
      }
      else {
        var files = [];

        for(var i=0;i<response.entries.length;i++){
          var file = new VFSFile(response.entries[i]);
          file.setProtectedValue('created_on', response.entries[i].created_on);
          file.setProtectedValue('created_by', response.entries[i].created_by);
          file.setProtectedValue('updated_on', response.entries[i].updated_on);
          file.setProtectedValue('updated_by', response.entries[i].updated_by);
          file.setEntryId(response.entries[i]);

          files.push(file);
        }

        promise.fulfill(undefined, files);
      }
    });

  return promise;
};

module.exports.delete = function(q){
  return new VFSFile().delete(q);
};
