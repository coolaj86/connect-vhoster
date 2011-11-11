(function () {
  "use strict";

  var exec = require('child_process').exec
    ;

  function create(githubAuth, githookSh) {
    var auth = 'Basic ' + new Buffer(githubAuth, 'utf8').toString('base64');

    function route(req, res, next) {
      var child
        ;

      // make sure your daemon respawns processes that exit!
      // that way this is effectively a reload
      function killNode(err, stdout, stderr) {
        res.end(JSON.stringify({
            error: err
          , stdout: stdout
          , stderr: stderr
        }));

        //if (!err && !stderr && stdout) {
          process.exit();
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
