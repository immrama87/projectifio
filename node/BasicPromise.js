var BasicPromise = (function(){
  var next;

  return {
    then: function(fnc){
      if(typeof fnc == 'function')
        next = fnc;
    },
    resolve: function(err){
      if(typeof next == 'function')
        next(err);
    }
  }
});

module.exports = BasicPromise;
