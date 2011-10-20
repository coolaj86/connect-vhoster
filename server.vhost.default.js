(function (){
  "use strict";

  var fs = require('fs')
    , connect = require('connect')
    , server
    ;

  server = connect.createServer(
    connect.static(__dirname + '/' + 'public')
  );

  module.exports = server;
}());
