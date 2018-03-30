/*const mongoose = require('mongoose');
const uri = "mongodb://conor1123:test123@testcluster-shard-00-00-h2vrz.mongodb.net:27017,testcluster-shard-00-01-h2vrz.mongodb.net:27017,testcluster-shard-00-02-h2vrz.mongodb.net:27017/test?ssl=true&replicaSet=testCluster-shard-0&authSource=admin"

let conn = null;


function connectToDb() {
    return co(function*() {
      // Because `conn` is in the global scope, Lambda may retain it between
      // function calls thanks to `callbackWaitsForEmptyEventLoop`.
      // This means your Lambda function doesn't have to go through the
      // potentially expensive process of connecting to MongoDB every time.
      if (conn == null) {
        conn = yield mongoose.createConnection(uri);
        //conn.model('Test', new mongoose.Schema({ name: String }));
      }
  
      const M = conn.model('Test');
  
      const doc = yield M.findOne();
      console.log(doc);
  
      return doc;
    });
}*/