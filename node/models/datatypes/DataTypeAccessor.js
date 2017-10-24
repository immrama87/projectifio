var DataTypeBase = require("./DataTypeBase");

var DataTypeAccessor = (function(){
  var types = {
    "String": require("./StringDataType"),
    "Email": require("./EmailDataType"),
    "Phone": require("./PhoneDataType"),
    "Integer": require("./IntegerDataType"),
    "StringArray": require("./StringArrayDataType"),
    "ObjectID": require("./ObjectIdDataType"),
    "ObjectIDArray": require("./ObjectIdArrayDataType")
  };

  return {
    get: function(type){
      if(types.hasOwnProperty(type)){
        return types[type];
      }
      else {
        return DataTypeBase;
      }
    }
  }
});

module.exports = DataTypeAccessor();
