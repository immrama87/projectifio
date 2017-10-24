var DataTypeBase = (function(){
  return {
    isValid: function(value){return true;},
    format: function(value){return value;}
  };
});

module.exports = DataTypeBase();
