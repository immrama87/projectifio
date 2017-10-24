var Session = (function(username, now){
  var expires = now + (60*60*1000);

  return {
    isExpired: function(){
      return Date.now() >= expires;
    },
    setExpires: function(newExpire){
      expires = newExpire;
    },
    getUserId: function(){
      return username;
    },
    getLocale: function(){
      return "en_us";
    }
  };
});

module.exports = Session;
