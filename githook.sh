#!/bin/bash

VHOST_DIR="/var/webapps/vhosts"
LS="/bin/ls"
VHOSTS=$(${LS} ${VHOST_DIR})
HOOK_SCRIPT="githook.sh"
GIT="/usr/bin/git"
NPM="/usr/local/bin/npm"
RET=0

[ -f "${VHOST_DIR}/${HOOK_SCRIPT}" ] && ${VHOST_DIR}/${HOOK_SCRIPT}

for HOST in $VHOSTS
do
  SERVICE="${VHOST_DIR}/${HOST}"
  if [ -f "${SERVICE}/${HOOK_SCRIPT}" ]; then
    cd ${SERVICE} && ./${HOOK_SCRIPT}
  else
    cd ${SERVICE}
    ${GIT} fetch
    ${GIT} checkout master
    ${GIT} pull
    ${GIT} submodule init
    ${GIT} submodule update
    ${NPM} install
  fi
  unset SERVICE
done

# letting github-hook.js kill node with process.exit() is probably the best way to go
# assuming that the respawn option is set in /etc/init/webapps.conf
#
# If not, then you'll want to uncomment these lines:
#sudo /usr/bin/service webapps restart || \
#   sudo /usr/bin/service webapps start || { let RET=$RET+1; exit $RET; }
#
# And you'll also want to allow the owner of webapps to stop, start, and restart webapps
# sudo visudo 
## allow www-data to restart webapps:
#www-data ALL= NOPASSWD: /usr/bin/service webapps stop
#www-data ALL= NOPASSWD: /usr/bin/service webapps start
#www-data ALL= NOPASSWD: /usr/bin/service webapps restart
