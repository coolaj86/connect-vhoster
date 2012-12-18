(function () {
  "use strict";

  var exec = require('child_process').exec
    ;

  function create(githookAuth, githookSh) {
    var auth = 'Basic ' + new Buffer(githookAuth, 'utf8').toString('base64')
      ;

    function route(req, res, next) {
      var child
        ;

      // make sure your daemon respawns processes that exit!
      // that way this is effectively a reload
      function killNode(err, stdout, stderr) {
        console.error(err);
        console.log(stdout);
        console.error(stderr);
        res.end(JSON.stringify({
            error: err
          , stdout: stdout
          , stderr: stderr
        }));

        //if (!err && !stderr && stdout) {
        setTimeout(function () { 
          process.exit();
        }, 1 * 1000);
        //}
      }

      // if the url or the auth mismatch, do nothing
      if ('/github-hook' !== req.url || auth !== req.headers.authorization) {
        next();
        return;
      }
      console.log('github-hook activated');

      child = exec(githookSh, killNode);
    }

    return route;
  }

  module.exports = create;
}());
