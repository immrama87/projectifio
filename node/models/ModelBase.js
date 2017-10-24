var DataTypeAccessor = require("./datatypes/DataTypeAccessor");
var DataResponsePromise = require("./DataResponsePromise");
var DataValidationPromise = require("./DataValidationPromise");
var ObjectID = require('mongodb').ObjectID;

var ModelBase = (function(table, _model, uniqueIndexes){
  var mb = {};
  var model = {
    created_on: {
      type: DataTypeAccessor.get("Integer"),
      required: true,
      protected: true
    },
    created_by: {
      type: DataTypeAccessor.get("String"),
      required: true,
      protected: true
    },
    updated_on: {
      type: DataTypeAccessor.get("Integer"),
      required: true,
      protected: true
    },
    updated_by: {
      type: DataTypeAccessor.get("String"),
      required: true,
      protected: true
    }
  };

  for(var key in _model){
    if(!model.hasOwnProperty(key))
      model[key] = _model[key];
  }

  uniqueIndexes = uniqueIndexes || {};

  var entry_id = null;
  var updates = {};

  function getMissingRequiredFields(){
    var missing = [];

    for(var key in model){
      if(model[key].required && (model[key].value == undefined || model[key].value == "")){
        missing.push(table + "." + key);
      }
    }

    return missing;
  }

  function getInvalidRequiredFields(){
    var invalid = [];

    for(var key in model){
      if(model[key].required){
        if(model[key].value != undefined){
          if(!model[key].type.isValid(model[key].value)){
            invalid.push(table + "." + key);
          }
        }
      }
    }

    return invalid;
  }

  function getInvalidOptionalFields(){
    var invalid = [];

    for(var key in model){
      if(!model[key].required){
        if(model[key].value != undefined){
          if(!model[key].type.isValid(model[key].value)){
            model[key].value = undefined;
            invalid.push(table + "." + key);
          }
        }
      }
    }

    return invalid;
  }

  function createInsertDocument(){
    var doc = {};

    for(var key in model){
      if(model[key].value != undefined)
        doc[key] = model[key].type.format(model[key].value);
    }

    return doc;
  }

  function validateDocumentIsUnique(doc){
    var promise = new DataValidationPromise();
    var or = [];
    var uniques = [];
    for(var key in doc){
      if(model[key].unique){
        var check = {};
        check[key] = doc[key];
        or.push(check);
        uniques.push(key);
      }
    }

    for(var index in uniqueIndexes){
      var check = {};
      for(var i=0;i<uniqueIndexes[index].length;i++){
        check[uniqueIndexes[index][i]] = doc[uniqueIndexes[index][i]];
      }

      or.push(check);
    }

    var query = {};
    if(or.length > 0){
      query.$or = or;
    }
    else {
      query._id = null;
    }

    db.read(table, query)
      .then(function(err, entries){
        if(err){
          promise.fail(err);
        }
        else if(entries.length > 0){
          var collisions = [];
          for(var i=0;i<entries.length;i++){
            for(var j=0;j<uniques.length;j++){
              if(entries[i][uniques[j]] == doc[uniques[j]])
                collisions.push(uniques[j]);
            }

            for(var index in uniqueIndexes){
              var collides = true;
              for(var k=0;k<uniqueIndexes[index].length;k++){
                if(entries[i][uniqueIndexes[index][k]] != doc[uniqueIndexes[index][k]]){
                  collides = false;
                  break;
                }
              }

              if(collides)
                collisions.push(index);
            }
          }

          promise.fail(collisions);
        }
        else {
          promise.pass();
        }
      });

    return promise;
  }

  function insertDocument(promise){
    if(promise.hasErrorMessages()){
      promise.fulfill();
    }
    else {
      var missing = getMissingRequiredFields();
      var invalidReq = getInvalidRequiredFields();
      var invalidOpt = getInvalidOptionalFields();
      promise.setResponseValue('missing', missing);
      promise.setResponseValue('invalid', invalidReq);
      promise.setResponseValue('invalidOpt', invalidOpt);

      if(missing.length > 0 || invalidReq.length > 0){
        promise.fulfill();
      }
      else {
        var doc = createInsertDocument();

        validateDocumentIsUnique(doc)
          .onPass(function(){
            db.create(table, doc)
              .then(function(err, entries, msg){
                if(err){
                  promise.addErrorMessage(err);
                }
                else {
                  promise.setResponseValue('dbMsgData', msg);
                  promise.setResponseValue('dbMsgKey', "db.messages.created");
                }

                promise.fulfill();
              });
          })
          .onFail(function(msg){
            if(!Array.isArray(msg)){
              promise.addErrorMessage(msg);
            }
            else {
              for(var i=0;i<msg.length;i++){
                promise.addErrorMessage(table + ".errors." + msg[i] + ".collision");
              }
            }

            promise.fulfill();
          })
      }
    }
  }

  function registerUpdate(key, value){
    var original = model[key].value;
    var update = value;

    if(model[key].restricted)
      original = update = "restricted";

    if(!updates.hasOwnProperty(key)){
      updates[key] = {
        original: original,
        update: update
      };
    }
    else {
      updates[key].update = update;
    }
  }

  function createUpdateDocument(){
    var doc = {};

    for(var key in updates){
      if(model[key].value != undefined)
        doc[key] = model[key].type.format(model[key].value);
    }

    return doc;
  }

  mb.initialized = false;

  mb.setValue = function(key, value){
    if(model.hasOwnProperty(key)){
      if(!model[key].protected){
        if(mb.initialized)
          registerUpdate(key, value);

        model[key].value = value;
      }
    }
  };

  mb.setProtectedValue = function(key, value){
    if(model.hasOwnProperty(key)){
      if(mb.initialized)
        registerUpdate(key, value);

      model[key].value = value;
    }
  };

  mb.getValue = function(key){
    if(model.hasOwnProperty(key)){
      if(!model[key].restricted && model[key].value != undefined){
        return model[key].type.format(model[key].value);
      }
    }

    return null;
  };

  mb.getRestrictedValue = function(key){
    if(model.hasOwnProperty(key)){
      if(model[key].value != undefined)
      return model[key].type.format(model[key].value);
    }

    return null;
  };

  mb.initialize = function(){
    var promise = new DataResponsePromise();

    var query = undefined;

    for(var field in model){
      if(model[field].pk && model[field].value != undefined){
        query = {};
        query[field] = {$eq: model[field].type.format(model[field].value)};
        break;
      }
    }

    if(mb.hasOwnProperty('prepareInitializationQuery') && typeof mb.prepareInitializationQuery == 'function'){
      var updatedQ = mb.prepareInitializationQuery();
      for(var key in updatedQ){
        if(model.hasOwnProperty(key)){
          query[key] = {$eq: model[key].type.format(updatedQ[key])};
        }
      }
    }

    if(query == undefined){
      promise.addErrorMessage(table + ".errors.initialization");
      promise.fulfill();
    }
    else {
      db.read(table, query)
        .then(function(err, entries){
          if(err){
            promise.addErrorMessage(err);
          }
          else {
            promise.setResponseValue('entrycount', entries.length);
            if(entries.length == 1){
              for(var key in entries[0]){
                if(model.hasOwnProperty(key)){
                  model[key].value = entries[0][key];
                }
              }

              entry_id = entries[0]._id;
              mb.initialized = true;
            }
          }

          promise.fulfill();
        });
    }

    return promise;
  };

  mb.getEntryId = function(){return entry_id;}

  mb.setEntryId = function(id){
    if(entry_id == null)
      entry_id = id;
  }

  mb.get = function(id){
    var promise = new DataResponsePromise();

    try{
      db.read(table, {_id: new ObjectID(id)})
        .then(function(err, entries){
          if(err){
            promise.addErrorMessage(err);
          }
          else {
            promise.setResponseValue('entrycount', entries.length);
            if(entries.length == 1){
              promise.setResponseValue('entry', entries[0]);
            }

            promise.fulfill();
          }
        });
    }
    catch(err){
      promise.addErrorMessage(err);
      promise.fulfill();
    }

    return promise;
  }

  mb.find = function(q, opts){
    var promise = new DataResponsePromise();

    var query = {};
    for(var key in q){
      if(model.hasOwnProperty(key)){
        if(q[key] != null){
          if(model[key].type.isValid(q[key]))
            query[key] = model[key].type.format(q[key]);
        }
        else {
          query[key] = null;
        }
      }
    }

    db.read(table, query, opts)
      .then(function(err, entries){
        if(err){
          promise.addErrorMessage(err);
        }
        else {
          promise.addEntries(entries);
        }

        promise.fulfill();
      });

    return promise;
  };

  mb.create = function(creator){
    var promise = new DataResponsePromise();

    creator = creator || "system";

    if(mb.initialized || entry_id != null){
      promise.addErrorMessage(table + ".errors.initialized");
      promise.fulfill();
    }
    else {
      model.created_on.value = model.updated_on.value = Date.now();
      model.created_by.value = model.updated_by.value = creator;

      if(mb.hasOwnProperty("prepareInsertDocument") && typeof mb.prepareInsertDocument == 'function'){
          mb.prepareInsertDocument(promise, insertDocument);
      }
      else {
        insertDocument(promise);
      }
    }

    return promise;
  };

  mb.update = function(updator){
    var promise = new DataResponsePromise();
    updator = updator || "system";

    if(!mb.initialized || entry_id == null){
      promise.addErrorMessage(table + ".errors.update.uninitialized");
      promise.fulfill();
    }
    else {
      mb.setProtectedValue('updated_on', Date.now());
      mb.setProtectedValue('updated_by', updator);

      var missing = getMissingRequiredFields();
      var invalidReq = getInvalidRequiredFields();
      var invalidOpt = getInvalidOptionalFields();

      if(missing.length > 0 || invalidReq.length > 0){
        promise.fulfill();
      }
      else {
        var update = createUpdateDocument();
        db.update(table, {_id: entry_id}, update)
          .then(function(err, entries, msg){
            if(err){
              promise.addErrorMessage(err);
            }
            else {
              promise.setResponseValue('dbMsgKey', "db.messages.updated")
              promise.setResponseValue('dbMsgData', msg);
            }

            promise.fulfill();
          });
      }
    }
    return promise;
  };

  mb.delete = function(q){
    var promise = new DataResponsePromise();

    var query = {};
    for(var key in q){
      if(key == "_id"){
        query[key] = q[key];
        continue;
      }

      if(model.hasOwnProperty(key)){
        if(model[key].type.isValid(q[key]))
          query[key] = model[key].type.format(q[key]);
      }
    }

    if(Object.keys(query).length == 0){
      promise.addErrorMessage(table + ".errors.delete.noquery");
      promise.fulfill();
    }
    else {
      db.delete(table, query)
        .then(function(err, entries, msg){
          if(err){
            if(err === true){
              promise.addErrorMessage(table + ".errors.delete.notfound");
            } else {
              promise.addErrorMessage(err);
            }
          }
          else {
            promise.setResponseValue('dbMsgKey', "db.messages.deleted");
            promise.setResponseValue('dbMsgData', msg);
          }

          promise.fulfill();
        });
    }

    return promise;
  };

  mb.toJSON = function(){
    var response = {};
    for(var key in model){
      if(!model[key].restricted && model[key].value != undefined){
        response[key] = model[key].type.format(model[key].value);
      }
    }

    return response;
  }

  return mb;
});

module.exports = ModelBase;
