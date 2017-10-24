var DataValidationPromise = (function(){
  var passHandler;
  var failHandler;
  var failMessage;
  var status = "pending";

  var dvp = {
    onPass: function(handler){
      if(typeof handler == 'function'){
        passHandler = handler;

        if(status == "passed")
          handler();
      }

      return dvp;
    },
    onFail: function(handler){
      if(typeof handler == 'function'){
        failHandler = handler;

        if(status == "failed")
          handler(failMessage);
      }

      return dvp;
    },
    pass: function(){
      if(typeof passHandler == 'function')
        passHandler();

      status = "passed";
    },
    fail: function(msg){
      failMessage = msg;
      if(typeof failHandler == 'function')
        failHandler(msg);

      status = "failed";
    }
  };

  return dvp;
});

module.exports = DataValidationPromise;
