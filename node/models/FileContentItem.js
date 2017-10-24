var FileModelBase = require('./FileModelBase');
var DataTypeAccessor = require('./datatypes/DataTypeAccessor');
var DataResponsePromise = require('./DataResponsePromise');

var FileContentItem = (function(fileNameOrId, fileContentData){
  fileContentData = fileContentData || "";

  var fc = new FileModelBase('contentitems');
  if(fileContentData){
    fc.setData(fileContentData);
    fc.setName(fileNameOrId);
  }
  else {
    fc.setId(fileNameOrId);
  }

  return fc;
});

module.exports = FileContentItem;

module.exports.get = function(id){
  return new FileContentItem().get(id);
}

module.exports.delete = function(id){
  return new FileContentItem().delete(id);
}
