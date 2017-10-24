var ObjectID = require("mongodb").ObjectID;

var ObjectIdDataType = (function(){
  return {
    isValid: function(value){
      if(typeof value == 'string'){
        try{
          return new ObjectID(value).isValid();
        }
        catch(err){
          return false;
        }
      }

      return value instanceof ObjectID;
    },
    format: function(value){
      if(!value instanceof ObjectID){
        try{
          return new ObjectID(value);
        }
        catch(err){
          return undefined;
        }
      }

      return value;
    }
  };
});

module.exports = ObjectIdDataType();
