var PhoneDataType = (function(){
  return {
    isValid: function(value){
      return value.match(/(\d{1,3})?\d{3}\d{3}\d{4}/);
    },
    format: function(value){
      return value;
    }
  }
});

module.exports = PhoneDataType();
