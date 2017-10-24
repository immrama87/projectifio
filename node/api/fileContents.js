var FileContentItem = require('../models/FileContentItem');
var ResponseHandler = require('./ResponseHandler');
var Status = require('./Status');

var FileContents = (function(express){
  var router = express.Router();

  router.param("id", function(req, res, next, id){
    req.id = id;
    next();
  });

  router.get("/:id", function(req, res){
    FileContentItem.get(req.id)
      .then(function(response){
        new ResponseHandler(response, req.session.getLocale())
          .assert(function(response, body){
            return response.values.file != undefined;
          }, {
            i18nKey: 'filecontents.errors.none',
            i18nData: req.id
          })
          .send(res);
      });
  });

  return router;
});

module.exports = FileContents;
