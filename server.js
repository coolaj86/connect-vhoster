(function () {
  "use strict";

  var config = require('./config')
    , connect = require('connect')
    , githubHook = require('github-hook')
    , nowww = require('nowww')
    , fs = require('fs')
    , path = require('path')
    ;

  function create(dirname) {
    var dirs
        // ignored when this module isn't main
      , apps = []
      , servers = []
      , server
      , app
      ;

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
        , aliases = serverPath + '/aliases.js'
        , server = serverPath + '/server.js'
        , app = serverPath + '/app.js'
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
        hostname += (config.defaultDomain)
      }

      try {
        if (!fs.statSync(serverPath).isDirectory()) {
          throw new Error('IGNORED not a directory');
        }
      } catch(e) {
        server += '.js';
        return;
      }

      try {
        stats = fs.statSync(server);
      } catch(e) {
        server = undefined;
        try {
          stats = fs.statSync(app);
        } catch(e) {
          app = undefined;
        }
      }

      server = server || app;

      if (!server) {
        console.warn('[WARN] "' + serverPath + '" doesn\'t have a working server, but maybe that\'s okay.');
        return;
      }

      try {
        hostnames = require(aliases);
      } catch(e) {
        hostnames = [];
      }
      hostnames.push(hostname)

      hostnames.forEach(eachHostname);
    }


    if (config.githookAuth || config.githubAuth) {
      console.info('loaded with githookAuth');
      servers.push(githubHook(config.githookAuth || config.githubAuth, dirname + '/githook.sh'));
    }

    if (!config.yeswww) {
      servers.push(nowww());
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

      servers.push(connect.vhost('*.' + app.hostname, server));
      console.info('Loading', '*.' + app.hostname);
      servers.push(connect.vhost(app.hostname, server));
      console.info('Loading', app.hostname);
    });

    app = connect();
    servers.forEach(function (server) {
      app.use(server);
    });

    return app;
  }

  module.exports.create = create;

  function run() {
    var app = create(__dirname + '/vhosts')
      , port = process.argv[2] || config.port || 4080
      , server
      ;

    function listening() {
      console.info('Listening on ' + server.address().address + ':' + server.address().port);
    }

    if (port) {
      server = app.listen(port, listening);
    } else {
      server = app.listen(listening);
    }
  }

  if (require.main === module) {
    console.info("\n=== connect-vhoster running in stand-alone mode ===\n");
    run();
  }
}());
