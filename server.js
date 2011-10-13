(function () {
  "use strict";

  var config = require('./config')
    , connect = require('connect')
    , githubHook = require('github-hook')
    , nowww = require('nowww')
    , fs = require('fs')
    , path = require('path')
    , apps = []
    , servers = []
    , dirs = fs.readdirSync(__dirname + "/vhosts")
    ;

  function sortByHostnameLength(a, b) {
    return b.hostname.length - a.hostname.length;
  }

  function eachHost(hostname) {
    var serverPath = __dirname + '/vhosts/' + hostname
      , aliases = serverPath + '/aliases.js'
      , server = serverPath + '/server.js'
      , app = serverPath + '/app.js'
      , hostnames
      , stats
      ;

    function eachHostname(hostname) {
      apps.push({
          serverPath: serverPath
        , hostname: hostname
        , server: server
      });
    }

    if (/^\./.exec(hostname)) {
      console.log('ignoring', hostname);
      return;
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



  if (config.githookAuth) {
    servers.push(githubHook(config.githookAuth, __dirname + '/githook.sh'));
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
        console.error('ERROR: [', app.hostname, '] failed to load [', '.' + app.server.substr(__dirname.length), ']', e);
        return;
      }

    console.log('Loaded', app.hostname);
    servers.push(connect.vhost('*.' + app.hostname, server));
    servers.push(connect.vhost(app.hostname, server));
  });

  module.exports = connect.createServer.apply(connect, servers);
}());
