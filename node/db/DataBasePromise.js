var DataBasePromise = (function(){
  var self = this;
  var resolved = false;
  var next = [];
  var entries = [];
  var errorMsg;
  var responseMsg;

  return {
    then: function(fnc){
      if(typeof fnc == 'function'){
        next.push(fnc);

        if(resolved)
          fnc(errorMsg, entries, responseMsg);
      }

      return self;
    },
    fulfill: function(err, msg){
      for(var i=0;i<next.length;i++){
        if(typeof next[i] == "function"){
          next[i](err, entries, msg);
        }
      }

      errorMsg = err;
      responseMsg = msg;

      resolved = true;
    },
    addEntry: function(entry){
      entries.push(entry);
    }
  };
});

module.exports = DataBasePromise;
