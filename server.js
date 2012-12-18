/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true*/
(function () {
  "use strict";

  var config = require('./config')
    , connect = require('connect')
    , githubHook = require('./lib/github-hook')
    , nowww = require('nowww')
    , fs = require('fs')
    , path = require('path')
    ;

  function create(webappsDir, dirname) {
    var dirs
        // ignored when this module isn't main
      , apps = []
      , server
      , connectApp
      ;

    console.log(webappsDir, dirname);
    dirs  = fs.readdirSync(dirname);

    if (!config.defaultDomain) {
      config.defaultDomain = '.local';
    }
    if (!/^\./.exec(config.defaultDomain)) {
      config.defaultDomain = '.' + config.defaultDomain;
    }

    function sortByHostnameLength(a, b) {
      return b.hostname.length - a.hostname.length;
    }

    function eachHost(hostname) {
      var serverPath = path.join(dirname, hostname)
        , aliases = serverPath + '/aliases'
        , server = serverPath + '/server'
        , app = serverPath + '/app'
        , hostnames
        , stats
        ;

      function eachHostname(hostname) {
        var vhost = {
            serverPath: serverPath
          , hostname: hostname
          , server: server
        };

        apps.push(vhost);
      }

      if (/^\./.exec(hostname)) {
        console.warn('ignoring', hostname);
        return;
      }

      if (!/\./.exec(hostname)) {
        hostname += (config.defaultDomain);
      }

      try {
        if (!fs.statSync(serverPath).isDirectory()) {
          throw new Error('IGNORED not a directory');
        }
      } catch(e) {
        return;
      }

      try {
        require(server);
        server = server;
      } catch(e) {
        try {
          require(app);
          server = app;
        } catch(e) {
          try {
            require(serverPath);
            server = serverPath;
          } catch(e) {
            server = undefined;
          }
        }
      }

      if (!server) {
        console.warn('[WARN] "' + serverPath + '" doesn\'t have a working server, but maybe that\'s okay.');
        return;
      }

      try {
        hostnames = require(aliases);
      } catch(e) {
        hostnames = [];
      }
      hostnames.push(hostname);

      hostnames.forEach(eachHostname);
    }

    connectApp = connect();

    if (config.githookAuth || config.githubAuth) {
      console.info('loaded with githookAuth');
      connectApp.use(githubHook(config.githookAuth || config.githubAuth, webappsDir + '/githook.sh'));
    }

    if (!config.yeswww) {
      connectApp.use(nowww());
    }

    dirs.forEach(eachHost);

    apps.sort(sortByHostnameLength);
    apps.forEach(function (app) {
        var server;

        try {
          server = require(app.server);
        } catch(e) {
          console.error('ERROR: [', app.hostname, '] failed to load [', '.' + app.server.substr(dirname.length), ']', e);
          return;
        }

      connectApp.use(connect.vhost('*.' + app.hostname, server));
      console.info('Loaded', '*.' + app.hostname);
      connectApp.use(connect.vhost(app.hostname, server));
      console.info('Loaded', app.hostname);
    });

    return connectApp;
  }

  module.exports.create = create;

  function run() {
    var app = create(__dirname, __dirname + '/vhosts')
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

  module.exports = create(__dirname, __dirname + '/vhosts');
}());
