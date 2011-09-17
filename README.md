Installation
===

    sudo git clone git://github.com/coolaj86/connect-vhoster /var/webapps
    sudo chown -R `whoami`:`whoami` /var/webapps
    ln -s /var/webapps ~/webapps
    cd ~/webapps
    npm install
    vim webapps.conf
    # change path to wherever you choose
    sudo cp webapps.conf /etc/init/

Usage
===

Throw your apps into `~/webapps/vhosts/`

A directory structure such as this

    * ./vhosts/example.com
    * ./vhosts/foobar.example.org
      * ./vhosts/foobar.example.org/aliases.js -> `module.exports = [ "foobar3000.local", "helloworld3000.local" ];`
    * ./vhosts/foo.bar.example.org
    * ./vhosts/foo.example.org

Will be `toLowerCase()`ed, and will be sorted by length like this:

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

If `~/webapps/vhosts/example.com/aliases.js` exists and exports an array of hostnames, they will also be included.

Warning
===

If you have any apps that modify the prototype or attributes of the global `connect` you may want to store a seperate copy of `connect` in `~/webapps/vhosts/example.com/node_modules` rather than `~/webapps/node_modules`.
