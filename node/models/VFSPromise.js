var VFSPromise = (function(){
  var self = this;
  var next = [];
  var resolved = false;
  var resHandler, resFolders, resFiles;

  return {
    then: function(fnc){
      if(typeof fnc == 'function'){
        next.push(fnc);

        if(resolved)
          fnc(resErr, resFolders, resFiles);
      }

      return self;
    },

    fulfill: function(err, folders, files){
      for(var i=0;i<next.length;i++){
        next[i](err, folders, files);
      }

      resErr = err;
      resFolders = folders;
      resFiles = files;
      resolved = true;
    }
  };
});

module.exports = VFSPromise;
