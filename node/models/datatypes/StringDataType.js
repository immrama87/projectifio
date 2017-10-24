var StringDataType = (function(){
  return {
    isValid: function(value){
      return value.toString() == value;
    },
    format: function(value){
      return value.toString();
    }
  };
});

module.exports = StringDataType();
