var IntegerDataType = (function(){
  return {
    isValid: function(value){
      return !isNaN(parseInt(value));
    },
    format: function(value){
      return parseInt(value);
    }
  };
});

module.exports = IntegerDataType();
