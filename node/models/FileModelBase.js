var DataResponsePromise = require('./DataResponsePromise');

var FileModelBase = (function(table){
  var fmb = {};
  var fileName, fileData, fileId;

  fmb.setData = function(data){
    fileData = data;
  }

  fmb.setName = function(name){
    fileName = name;
  }

  fmb.setId = function(id){
    fileId = id;
  }

  fmb.create = function(){
    var promise = new DataResponsePromise();
    db.fs.create(table, fileName, fileData)
      .then(function(err, entries, msg){
        if(err){
          promise.addErrorMessage(err);
        }
        else {
          promise.setResponseValue('fileId', msg);
        }

        promise.fulfill();
      });

    return promise;
  }

  fmb.get = function(id){
    var promise = new DataResponsePromise();

    db.fs.get(table, id)
      .then(function(err, entries){
        if(err){
          promise.addErrorMessage(err);
        }
        else {
          if(entries.length == 0){

          }
          else if(entries.length > 1){

          }
          else {
            promise.setResponseValue('file', entries[0]);
          }
        }

        promise.fulfill();
      });

    return promise;
  }

  fmb.update = function(name, file){
    var promise = new DataResponsePromise();

    db.fs.update(table, fileId, name, file)
      .then(function(err, entries, msg){
        if(err){
          promise.addErrorMessage(err);
        }
        else {
          promise.setResponseValue('fileId', msg);
        }

        promise.fulfill();
      });

    return promise;
  }

  fmb.delete = function(id){
    var promise = new DataResponsePromise();

    db.fs.delete(table, id)
      .then(function(err, entries, msg){
        if(err){
          promise.addErrorMessage(err);
        }
        else{
          promise.setResponseValue('deleted', (msg === 'success'));
        }

        promise.fulfill();
      });

    return promise;
  }

  return fmb;
});

module.exports = FileModelBase;
