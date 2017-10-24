var Users = require("./users");
var Groups = require("./groups");
var VFS = require("./vfs");
var FileContentItem = require('./fileContents');

var Router = (function(express){
  var router = express.Router();

  router.use('/users', new Users(express));
  router.use('/groups', new Groups(express));
  router.use('/vfs', new VFS(express));
  router.use('/filecontents', new FileContentItem(express));

  return router;
});

module.exports = Router;
