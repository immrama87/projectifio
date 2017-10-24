global.db = require("./node/db/db")(require('mongodb'));

var FileContentItem = require('./node/models/FileContentItem');

var fileContentItem = new FileContentItem('file-test', "This is a test");
fileContentItem.create()
  .then(function(response){
    console.log(response);

    var fileId = response.values.fileId;
    FileContentItem.get(fileId)
      .then(function(response){
        console.log(response);

        var updateContentItem = new FileContentItem(fileId);
        updateContentItem.update('file-test', "This is still a test")
          .then(function(response){
            console.log(response);

            FileContentItem.get(fileId)
              .then(function(response){
                console.log(response);

                FileContentItem.delete(fileId)
                  .then(function(response){
                    console.log(response);
                  });
              });
          });
      });
  });
