var ModelBase = require("./ModelBase");
var DataTypeAccessor = require("./datatypes/DataTypeAccessor");
var ModelListPromise = require("./ModelListPromise");

var Group = (function(group){
  group = group || {};
  var g = new ModelBase("groups", {
    name: {
      type: DataTypeAccessor.get("String"),
      required: true,
      unique: true,
      pk: true
    },
    description: {
      type: DataTypeAccessor.get("String")
    },
    members: {
      type: DataTypeAccessor.get("StringArray"),
      protected: true
    }
  });

  for(var key in group){
    g.setValue(key, group[key]);
  }

  if(group.members){
    g.setProtectedValue('members', group.members);
  }

  return g;
});

module.exports = Group;
module.exports.find = function(query, opts){
  var promise = new ModelListPromise();

  new Group().find(query, opts)
    .then(function(response){
      if(response.errors.length > 0){
        promise.fulfill("The following error(s) occurred performing the Group lookup:\n" + response.errors.join("\n"));
      }
      else {
        var groups = [];

        for(var i=0;i<response.entries.length;i++){
          var group = new Group(response.entries[i]);
          group.setProtectedValue('created_on', response.entries[i].created_on);
          group.setProtectedValue('updated_on', response.entries[i].updated_on);
          group.setProtectedValue('created_by', response.entries[i].created_by);
          group.setProtectedValue('updated_by', response.entries[i].updated_by);
          group.setEntryId(response.entries[i]._id);
          group.initialized = true;

          groups.push(group);
        }

        promise.fulfill(undefined, groups);
      }
    });

  return promise;
};

module.exports.delete = function(query){
  return new Group().delete(query);
}
