var fs = require('fs');
var path = require('path');
var os = require('os');

var localeConfigs = {};

function readLangConfig(filepath){
  var locale = filepath.substring(filepath.lastIndexOf(path.sep) + 1, filepath.indexOf(".", filepath.lastIndexOf(path.sep)));
  fs.readFile(filepath, {encoding: 'utf8'}, function(err, data){
    var configs = data.split(os.EOL);
    for(var i=0;i<configs.length;i++){
      if(configs[i].indexOf("=") > -1){
        var configParts = configs[i].split("=");
        if(!localeConfigs.hasOwnProperty(locale))
          localeConfigs[locale] = {};

        localeConfigs[locale][configParts[0]] = configParts[1];
      }
    }
  });
}

var i18n = (function(){
  var locales = path.join(__dirname, '..', '..', 'locales');

  fs.readdir(locales, {encoding: 'utf8'}, function(err, files){
    for(var i=0;i<files.length;i++){
      readLangConfig(path.join(locales, files[i]));
    }
  });

  return {
    getTranslatedText: function(identifier, locale){
      if(!locale || !localeConfigs.hasOwnProperty(locale))
        locale = "default";

      var text = undefined;
      if(localeConfigs[locale].hasOwnProperty(identifier)){
        text = new i18nTextFormatter(localeConfigs[locale][identifier]);
      }
      else if(localeConfigs.default.hasOwnProperty(identifier)){
        text = new i18nTextFormatter(localeConfigs.default[identifier]);
      }
      else {
        var genericId = "generic" + identifier.substring(identifier.indexOf("."));
        if(localeConfigs[locale].hasOwnProperty(genericId)){
          text = new i18nTextFormatter(localeConfigs[locale][genericId]);
        }
        else if(localeConfigs.default.hasOwnProperty(genericId)){
          text = new i18nTextFormatter(localeConfigs.default[genericId]);
        }
      }

      return text;
    }
  };
});

var i18nTextFormatter = (function(text){
  return {
    format: function(){
      for(var i=0;i<arguments.length;i++){
        var repNum = parseInt(i+1);
        var repRegex = new RegExp("%" + repNum, 'g');
        text = text.replace(repRegex, arguments[i]);
      }

      return text;
    }
  };
});

module.exports = i18n;
