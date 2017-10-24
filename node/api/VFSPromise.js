var VFSPromise = (function(){
  var self = this;
  var next = [];
  var resolved = false;
  var resHandler, resVfsObject;

  return {
    then: function(fnc){
      if(typeof fnc == 'function'){
        next.push(fnc);

        if(resolved)
          fnc(resHandler, resVfsObject);
      }

      return self;
    },

    fulfill: function(handler, vfsObject){
      for(var i=0;i<next.length;i++){
        next[i](handler, vfsObject);
      }

      resHandler = handler;
      resVFSObject = vfsObject;
      resolved = true;
    }
  };
});

module.exports = VFSPromise;
