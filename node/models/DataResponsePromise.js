var DataResponseObject = require("./DataResponseObject");

var DataResponsePromise = (function(){
  var self = this;
  var next = [];
  var resolved = false;

  var response = {
    errors: [],
    warnings: [],
    values: {},
    entries: []
  };

  return {
    addErrorMessage: function(err){
      response.errors.push(err);
    },
    addWarningMessage: function(warn){
      response.warnings.push(err);
    },
    addEntry: function(entry){
      response.entries.push(entry);
    },
    addEntries: function(entries){
      response.entries = response.entries.concat(entries);
    },
    setResponseValue: function(key, value){
      response.values[key] = value;
    },
    hasErrorMessages: function(){
      return response.errors.length > 0;
    },
    then: function(fnc){
      if(typeof fnc == 'function'){
        next.push(fnc);
        if(resolved){
          fnc(response);
        }
      }

      return self;
    },
    fulfill: function(){
      for(var i=0;i<next.length;i++){
        if(typeof next[i] == 'function'){
          next[i](response);
        }
      }

      resolved = true;
    }
  }
});

module.exports = DataResponsePromise;
