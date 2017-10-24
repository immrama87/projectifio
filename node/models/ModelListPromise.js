var ModelListPromise = (function(){
  var next = [];
  var resolved = false;
  var error = undefined;
  var items = undefined;

  return {
    then: function(fnc){
      if(typeof fnc == 'function'){
        next.push(fnc);

        if(resolved)
          fnc(error, new ModelListIterator(items));
      }
    },
    fulfill: function(err, models){
      for(var i=0;i<next.length;i++){
        if(typeof next[i] == 'function')
          next[i](err, new ModelListIterator(models));
      }

      error = err;
      items = models;
      resolved = true;
    }
  };
});

var ModelListIterator = (function(items){
  var cursor = 0;

  return {
    hasNext: function(){
      return items.length > cursor;
    },
    next: function(){
      var item = items[cursor];
      cursor++;
      return item;
    }
  };
});

module.exports = ModelListPromise;
