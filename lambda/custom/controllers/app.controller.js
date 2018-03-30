const App = require('../models/app.model');
const Token = require('../models/token.model');

exports.getApp = function(accessToken, callback) {

    //callback(null, appType);
    
    Token.findOne({value: accessToken }, function (err, token) {
        if(err) {        
            callback(err, null);
        }
        // No token found
        if (!token) { 
            callback(err, null);; 
        }
        
        App.find({ userId: token.userId }, function (err, apps) {
          if (err) { return callback(err, null); }
  
          // No user found
          if (!apps) { return callback(err, null); }
  
          // Simple example with no scope
          callback(null ,apps);
        });

      });
};

exports.getAppByAmount = function (accessToken, amount, callback){
    
}
    
