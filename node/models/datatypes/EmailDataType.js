var EmailDataType = (function(){
  return {
    isValid: function(value){
      return value.match(/\w+@\w+(.\w{2,4}){1,2}/);
    },
    format: function(value){
      return value;
    }
  };
});

module.exports = EmailDataType();
