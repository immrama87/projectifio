Projectifio.factory("ActionBarState", function($rootScope){
  var abs = {
    align: "left",
    style: "Paragraph"
  };

  abs.toggleProperty = function(prop){
    abs.setProperty(prop, !abs[prop]);
  }

  abs.setProperty = function(prop, value){
    abs[prop] = value;
    $rootScope.$broadcast("file-editor-action-bar:update-props", prop);
  }

  abs.setState = function(stateMap){
    for(var prop in stateMap){
      abs[prop] = stateMap[prop];
    }
  }

  return abs;
});
