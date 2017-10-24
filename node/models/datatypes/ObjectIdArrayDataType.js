var ObjectID = require('mongodb').ObjectID;

var ObjectIdArrayDataType = (function(){
  return {
    isValid: function(value){
      if(!Array.isArray(value)){
        return false;
      }
      else {
        for(var i=0;i<value.length;i++){
          if(!value[i] instanceof ObjectID){
            try{
              if(!new ObjectID(value[i]).isValid())
                return false;
            }
            catch(err){
              return false;
            }
          }
        }

        return true;
      }
    },
    format: function(value){
      if(!Array.isArray(value)){
        return undefined;
      }
      else {
        for(var i=0;i<value.length;i++){
          if(!value[i] instanceof ObjectID){
            try{
              value[i] = new ObjectID(value[i]);
            }
            catch(err){
              return undefined;
            }
          }
        }

        return value;
      }
    }
  };
});

module.exports = ObjectIdArrayDataType();
