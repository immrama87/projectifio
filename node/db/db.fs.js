var GridFSBucket = require('mongodb').GridFSBucket,
    ObjectID = require('mongodb').ObjectID;
var stream = require('stream');
var DataBasePromise = require('./DataBasePromise');

var FS = (function(createConnection){
  return {
    create: function(collection, name, file){
      var promise = new DataBasePromise();
      createConnection(function(err, conn){
        if(err){
          promise.fulfill("The following error was generated while connecting to the database:\n" + err);
          return;
        }

        var bucket = new GridFSBucket(conn, {bucketName: collection});
        var fileId = new ObjectID();
        var uploadStream = bucket.openUploadStreamWithId(fileId, name);

        uploadStream.once('finish', function(){
          promise.fulfill(undefined, fileId);
        });
        uploadStream.once('error', function(err){
          promise.fulfill("The following error was generated while writing the file to the database:\n" + err);
        });

        var bufferStream = new stream.PassThrough();
        bufferStream.end(Buffer.from(file, 'utf8'));
        bufferStream.pipe(uploadStream);
      });

      return promise;
    },

    get: function(collection, id){
      var promise = new DataBasePromise();

      createConnection(function(err, conn){
        if(err){
          promise.fulfill("The following error was generated while connecting to the database:\n" + err);
          return;
        }

        var bucket = new GridFSBucket(conn, {bucketName: collection});
        id = new ObjectID(id);
        var downloadStream = bucket.openDownloadStream(id);
        var file = "";

        downloadStream.on('data', function(chunk){
          file += chunk.toString('utf8');
        });
        downloadStream.once('error', function(err){
          promise.fulfill("The following error was generated while reading the file from the database:\n" + err);
        });
        downloadStream.once('end', function(){
          promise.addEntry(file);
          promise.fulfill(undefined);
        });
      });

      return promise;
    },

    update: function(collection, id, name, file){
      var promise = new DataBasePromise();

      createConnection(function(err, conn){
        if(err){
          promise.fulfill("The following error was generated while connecting to the database:\n" + err);
          return;
        }

        id = new ObjectID(id);
        var bucket = new GridFSBucket(conn, {bucketName: collection});
        var rename = false;
        var fileObj = conn.collection(collection + ".files").findOne(id);
        if(fileObj == null){
          promise.fulfill("The following error was generated while retrieving the previous version of the file in the database:\n" + err)
          return;
        }
        else {
          bucket.delete(id, function(err){
            if(err){
              promise.fulfill("The following error was generated while deleting the previous version of the file in the database:\n" + err);
              return;
            }

            var uploadStream = bucket.openUploadStreamWithId(id, name);

            uploadStream.once('finish', function(){
              promise.fulfill(undefined, id);
            });
            uploadStream.once('error', function(err){
              promise.fulfill("The following error was generating while writing the new file contents to the database:\n" + err);
            });

            var bufferStream = new stream.PassThrough();
            bufferStream.end(Buffer.from(file, 'utf8'));
            bufferStream.pipe(uploadStream);
          });
        }
      });

      return promise;
    },

    delete: function(collection, id){
      var promise = new DataBasePromise();

      createConnection(function(err, conn){
        if(err){
          promise.fulfill("The following error was generated while connecting to the database:\n" + err);
          return;
        }

        var bucket = new GridFSBucket(conn, {bucketName: collection});
        bucket.delete(new ObjectID(id), function(err){
          if(err){
            promise.fulfill("The following error was generated while deleting the file from the database:\n" + err);
            return;
          }

          promise.fulfill(undefined, "success");
        });
      });

      return promise;
    }
  };
});

module.exports = FS;
