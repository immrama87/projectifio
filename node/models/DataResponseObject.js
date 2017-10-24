var DataResponseObject = (function(){
  var errors = [];
  var warnings = [];
  var response = {};
  var status = "pending";

  return {
    addErrorMessage: function(err){
      errors.push(err);
    },

    addWarningMessage: function(warn){
      warnings.push(warn);
    },

    addToResponse: function(field, value){
      response[field] = value;
    },

    setStatus: function(_status){
      status = _status;
    },

    getStatus: function(){return status;},

    format: function(){
      if(errors.length > 0){
        response.errors = errors;
      }
      if(warnings.length > 0){
        response.warnings = warnings;
      }

      return JSON.stringify(response);
    }
  };
});

module.exports = DataResponseObject;
