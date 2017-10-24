var DataTypeAccessor = require("./datatypes/DataTypeAccessor");
var ModelBase = require("./ModelBase");
var ModelListPromise = require("./ModelListPromise");
var VFSFile = require('./VFSFile');
var VFSPromise = require('./VFSPromise');

var VFSFolder = (function(folder){
  folder = folder || {};
  var vfsf = new ModelBase("folders", {
    name: {
      type: DataTypeAccessor.get("String"),
      pk: true,
      required: true
    },
    parent: {
      type: DataTypeAccessor.get("ObjectID"),
      protected: true
    }
  }, {
    nameparent: ["name", "parent"]
  });

  for(var key in folder){
    vfsf.setValue(key, folder[key]);
  }

  if(folder.parent)
    vfsf.setProtectedValue('parent', folder.parent);

  vfsf.prepareInitializationQuery = function(){
    return {parent: vfsf.getValue('parent')};
  }

  vfsf.getContents = function(){
    var promise = new VFSPromise();
    VFSFolder.find({parent: vfsf.getEntryId()})
      .then(function(folderErr, folderIter){
        if(folderErr){
          promise.fulfill(folderErr);
        }
        else {
          VFSFile.find({parent: vfsf.getEntryId()})
            .then(function(fileErr, fileIter){
              if(fileErr){
                promise.fulfill(fileErr);
              }
              else {
                promise.fulfill(undefined, folderIter, fileIter);
              }
            });
        }
      });

    return promise;
  }

  return vfsf;
});

module.exports = VFSFolder;
module.exports.find = function(q, opts){
  var promise = new ModelListPromise();

  new VFSFolder().find(q, opts)
    .then(function(response){
      if(response.errors.length > 0){
        promise.fulfill("The following error(s) occurred performing the VFS lookup:\n" + response.errors.join("\n"));
      }
      else {
        var folders = [];

        for(var i=0;i<response.entries.length;i++){
          var folder = new VFSFolder(response.entries[i]);
          folder.setProtectedValue('created_on', response.entries[i].created_on);
          folder.setProtectedValue('created_by', response.entries[i].created_by);
          folder.setProtectedValue('updated_on', response.entries[i].updated_on);
          folder.setProtectedValue('updated_by', response.entries[i].updated_by);
          folder.setEntryId(response.entries[i]);
          folder.initialized = true;

          folders.push(folder);
        }

        promise.fulfill(undefined, folders);
      }
    });

  return promise;
}

module.exports.delete = function(q){
  return new VFSFolder().delete(q);
}
