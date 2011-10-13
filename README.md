Overview
===

You can host multiple applications for different domains (aka vhosts) using a single node instance.

The advantage is that you can host a lot of applications on a single [VPS](http://www.thrustvps.com/vps/advancedvps/) (or your local development machine) and use only the memory required for a single node instance, reducing overhead and increasing performance.

Although the applications will be sandboxed from `throw error`, a memory leak or `process.exit()` in one application will affect all applications.

Now with **github Post-Receive Hooks**!

Installation
===

Let's say you've got an [Ubuntu VPS](http://www.thrustvps.com/vps/advancedvps/) where you want to host your very own copy of `foobar3000`.

**Install vhoster**

I like to install vhoster to `/var/webapps` and have a link in my local directory.

    sudo git clone git://github.com/coolaj86/connect-vhoster /var/webapps
    sudo chown -R `whoami`:`whoami` /var/webapps
    ln -s /var/webapps ~/webapps
    cd ~/webapps
    npm install

**Configure**

Copy the `config.defaults.js` and season to taste (read on for more options).

    cp -a config.default.js config.js

**Install applications**

    mkdir vhosts
    git clone git@github.com:coolaj86/foobar3000.com ~/webapps/vhosts/foobar3000.com
    cd ~/webapps/vhosts/foobar3000.com/
    npm install

Note: Any applications with parse errors or that otherwise fail to load are skipped at load time.

**Set aliases**

The folder name of each vhost app should be the primary (production) domain name.

For development boxes and local setups you can have additional aliases in `aliases.js`:

    vim ~/webapps/vhosts/foobar3000.com/aliases.js

Should look something like:
    (function () {
      "use strict";

      module.exports = [
          "foobar3000.yourdomain.com"
        , "foobar3000.local"
        , "helloworld3000.local"
      ];
    }());

For local testing you can edit `/etc/hosts` and add things like

  * `127.0.0.1    foobar3000.local` - for local testing

Note: `www` prefixes are automatically removed and redirected.

Note: vhosts are handled intelligently and with forgiveness (see below for an example).

**Upstart in Ubuntu**

    vim webapps.conf
    # change path from `/var/webapps` to wherever you choose
    sudo cp webapps.conf /etc/init/

GitHub Post-Recieve URLs
---

  * <http://help.github.com/post-receive-hooks/>
  * <http://developer.github.com/v3/repos/hooks/>

For your development boxes you can have your applications reload on each commit. Amazing!

  0. Set `config.js:githubAuth` to a nice long password that will only be used by github
  0. Check that you agree with `~/webapps/githook.sh` (fetch, pull, submodule update, npm install)
    * you can place per-vhost scripts as `~/webapps/vhosts/foobar3000.com/githook.sh`
    * custom scripts run *in place of* the provided script for that vhost only
  0. Go to github.com -> your application -> admin -> Service Hooks -> Post-Receive URLs
  0. Add a URL in the semblance of `http://username:password@example.com/github-hook`
    * `/github-hook` is mandatory, a hard-coded part of the `github-hook` module
    * `username:password` is whatever you set in `config.js:githubAuth` and **not your github account**
    * `example.com` should be replaced by the name of *any* of you vhosts

If `config.js:githubAuth` exists, then any request with the URL `/github-hook` with valid HTTP Basic Auth will run `~/webapps/githook.sh` and exit node upon completion. If you're using `upstart` or something similar, the respawn option will cause your site to reload.

Note: `github-hook` is loaded before any other module, so any vhost will work as well as any other.

Note: Github hooks are only sent once. If your vhoster is down because just 3 seconds before you already pushed, probably only the first commit will take.

How the vhosts load
===

If your directory structure looks like this:

  * ./vhosts/example.com
  * ./vhosts/foobar.example.org
  * ./vhosts/foo.bar.example.org
  * ./vhosts/foo.example.org

And you have a few `aliases.js` that look like this:

  * ./vhosts/foobar.example.org/aliases.js

          module.exports = [ "foobar3000.local", "helloworld3000.local" ];

All vhosts will be ordered **longest to shortest** like so:

  * `*.foo.bar.example.org`
  * `foo.bar.example.org`
  * `*.foobar.example.org`
  * `foobar.example.org`
  * `*.foobar3000.local`
  * `foobar3000.local`
  * `*.foo.example.org`
  * `foo.example.org`
  * `*.example.com`
  * `example.com`

Note: vhost matches are **case insensitive** (as per convention).

Note: The `nowww` module ensures that `www.foobar3000.com` is redirected to `foobar3000.com`.

Note: By allowing wildcard domain matching you can do cool things with your app, such as using the subdomains for usernames like github does.

If `~/webapps/vhosts/example.com/aliases.js` exists and exports an array of hostnames, they will also be included.

API, Options, and Special Files
===

**config.js** - `~/webapps/config.js` - **user**, **githubAuth**, **port**

  * `user` - the user that all applications should run as.
  * `githubAuth` - HTTP Basic Auth to be used by github.
  * `yeswww` - disables [`nowww`](https://github.com/coolaj86/jason/tree/master/connect-nowww) redirection.

**githook.sh** - `~/webapps/githook.sh` - runs whenever `/github-hook` is requested with the correct `user:password`

By default, these commands will be run:

    git fetch
    git pull
    git submodule update
    npm install

**vhosts** - `~/webapps/vhosts` - where you should place your applications

**foobar3000.com** - `~/webapps/vhosts/foobar3000.com` - the primary (production) vhost for your application. `foobar3000.com` is an arbitrary example.

**per-vhost aliases.js** - `~/webapps/vhosts/foobar3000.com/aliases.js` - any domain names exported here will be exported in addition to the name of the parent folder.
  
**per-vhost githook.sh** - `~/webapps/vhosts/foobar3000.com/githook.sh` - include any commands here that should be run **instead of** the primary **~/webapps/githook.sh**.

  
Warning
===

If you have any apps that modify the prototype or attributes of the global `connect` you may want to store a seperate copy of `connect` in `~/webapps/vhosts/example.com/node_modules` rather than `~/webapps/node_modules`.
