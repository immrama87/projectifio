var StringArrayDataType = (function(){
  return {
    isValid: function(value){
      if(!Array.isArray(value)){
        return false;
      }

      for(var i=0;i<value.length;i++){
        if(typeof value[i] != 'string')
          return false;
      }

      return true;
    },
    format: function(value){
      return value;
    }
  }
});

module.exports = StringArrayDataType();
