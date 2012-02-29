(function () {
  "use strict";

  var config = require('./config')
    , server = require('./server')
    ;

  function logPort() {
    console.log("Serving on " + server.address().address + ":" + server.address().port);
  }

  if (config.port) {
    server.listen(config.port, logPort);
  } else {
    server.listen(logPort);
  }
}());
