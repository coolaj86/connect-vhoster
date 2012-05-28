/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true*/
(function () {
  "use strict";

  var app = require('../server.js')
    ;

  function run() {
    var config = require('../config')
      , port = process.argv[2] || config.port || 4080
      , server
      ;

    function listening() {
      console.info('Listening on ' + server.address().address + ':' + server.address().port);
    }

    server = app.listen(port, listening);
  }

  if (require.main === module) {
    console.info("\n=== connect-vhoster running in stand-alone mode ===\n");
    run();
  }

}());
