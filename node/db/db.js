var fs = require('fs');
var path = require('path');

var DataBasePromise = require("./DataBasePromise");
var DBFS = require('./db.fs');

var DB = (function(mongo){
  var conf = {
    host: "localhost",
    port: 27017,
    db: "project-tracker"
  };

  function createConnection(next){
    mongo.MongoClient.connect("mongodb://" + conf.host + ":" + conf.port.toString() + "/" + conf.db, next);
  }

  return {
    create: function(collection, values){
      var response = new DataBasePromise();

      createConnection(function(err, conn){
        if(err){
          response.fulfill("The following error was generated while connecting to the database:\n" + err);
          return;
        }

        conn.collection(collection).insertOne(values, function(err, result){
          if(err){
            response.fulfill("The following error was generated while inserting the document:\n" + err);
          }
          else {
            response.fulfill(undefined, result.insertedId);
          }

          conn.close();
        });
      });

      return response;
    },

    read: function(collection, query, options){
      var response = new DataBasePromise();

      createConnection(function(err, conn){
        if(err){
          response.fulfill("The following error was generated while connecting to the database:\n" + err);
          return;
        }

        var cursor = conn.collection(collection).find(query, options);
        cursor.each(function(err, doc){
          if(err){
            conn.close();
            response.fulfill("The following error was generated while retrieving entries from the database:\n" + err);
            return;
          }

          if(doc != null){
            response.addEntry(doc);
          }
          else {
            conn.close();
            response.fulfill();
          }
        });
      });

      return response;
    },

    update: function(collection, query, newValues){
      var response = new DataBasePromise();

      createConnection(function(err, conn){
        if(err){
          response.fulfill("The following error was generated while connecting to the database:\n" + err);
          return;
        }

        var update = {$set: newValues};
        conn.collection(collection).updateMany(query, update, function(err, result){
          if(err){
            response.fulfill("The following error was generated while updating the document(s) in the database:\n" + err);
          }
          else {
            response.fulfill(undefined, result.result.nModified);
          }

          conn.close();
        });
      });

      return response;
    },

    delete: function(collection, query){
      var response = new DataBasePromise();

      createConnection(function(err, conn){
        if(err){
          response.fulfill("The following error was generated while connecting to the database:\n" + err);
          return;
        }

        conn.collection(collection).deleteMany(query, function(err, result){
          if(err){
            response.fulfill("The following error was generated while deleting the document(s) in the database:\n" + err);
          }
          else {
            if(result.result.n > 0){
              response.fulfill(undefined, result.result.n);
            }
            else {
              response.fulfill(true);
            }
          }

          conn.close();
        });
      })

      return response;
    },

    fs: new DBFS(createConnection)
  };
});

module.exports = DB;
