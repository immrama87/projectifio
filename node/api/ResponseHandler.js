var Status = require("./Status");

var ResponseHandler = (function(response, locale){
  var rh = {};
  var responseEnvelope = {};
  var status = undefined;
  var asserts = [];
  response = response || {};
  response.errors = response.errors || [];
  response.warnings = response.warnings || [];
  response.values = response.values || {};

  function handleFieldList(fields){
    fields = fields || [];
    for(var i=0;i<fields.length;i++){
      var friendly = i18n.getTranslatedText(fields[i], locale);
      if(friendly != undefined)
        fields[i] = friendly.format();
    }

    return fields;
  }

  function format(){
    for(var i=0;i<asserts.length;i++){
      if(!asserts[i].assert(response, responseEnvelope)){
        if(typeof asserts[i].opts.handler == 'function')
          asserts[i].opts.handler(response, responseEnvelope);

        if(asserts[i].opts.i18nKey != undefined)
          response.errors.push(i18n.getTranslatedText(asserts[i].opts.i18nKey, locale).format(asserts[i].opts.i18nData));

        if(asserts[i].opts.status != undefined){
          if(status < asserts[i].opts.status || status == undefined)
            status = asserts[i].opts.status;
        }

        if(asserts[i].opts.message != undefined){
          if(responseEnvelope.message == undefined)
            responseEnvelope.message = asserts[i].opts.message;
        }
      }
    }

    if(!status)
      status = Status.success;

    responseEnvelope.responseDetails = response;
  }

  response.values.missing = handleFieldList(response.values.missing);
  if(response.values.missing.length > 0)
    response.errors.push(i18n.getTranslatedText("generic.errors.missing", locale).format(response.values.missing.join("', '")));

  response.values.invalid = handleFieldList(response.values.invalid);
  if(response.values.invalid.length > 0)
    response.errors.push(i18n.getTranslatedText("generic.errors.invalid", locale).format(response.values.invalid.join("', '")));

  response.values.invalidOpt = handleFieldList(response.values.invalidOpt);
  if(response.values.invalidOpt.length > 0)
    response.warnings.push(i18n.getTranslatedText("generic.errors.invalidOpt", locale).format(response.values.invalidOpt.join("', '")));

  if(response.values.dbMsgKey != undefined){
    response.operation = i18n.getTranslatedText(response.values.dbMsgKey, locale).format(response.values.dbMsgData);
    response.values.dbMsgKey = undefined;
    response.values.dbMsgData = undefined;
  }

  if(response.errors.length > 0){
    for(var i=0;i<response.errors.length;i++){
      var formatter = i18n.getTranslatedText(response.errors[i], locale);
      if(formatter)
        response.errors[i] = formatter.format();
    }
    status = Status.error;
  }

  if(response.warnings.length > 0){
    for(var j=0;j<response.warnings.length;j++){
      var formatter = i18n.getTranslatedText(response.warnings[j], locale);
      if(formatter)
        response.warnings[j] = formatter.format();
    }

    if(!status)
      status = Status.warning;
  }

  rh.assert = function(assertion, failOpts){
    failOpts = failOpts || {};
    asserts.push({
      assert: assertion,
      opts: failOpts
    });

    return rh;
  };

  rh.setStatus = function(_status){
    status = _status;
  };

  rh.getStatus = function(){return status;}

  rh.addBodyPart = function(partName, part){
    responseEnvelope[partName] = part;
  }

  rh.addI18nErrorMessage = function(i18nKey, i18nData){
    response.errors.push(i18n.getTranslatedText(i18nKey, locale).format(i18nData));
  }

  rh.addErrorMessage = function(msg){
    response.errors.push(msg);
  }

  rh.toJSON = function(){
    format();

    return responseEnvelope;
  }

  rh.send = function(res){
    format();
    var contents = JSON.stringify(responseEnvelope);

    res.writeHead(status,
      {
        'Content-Type': "application/json",
        'Content-Length': contents.length
      }
    );
    res.end(contents);
  }

  return rh;
});


module.exports = ResponseHandler;
