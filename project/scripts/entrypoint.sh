#!/bin/bash

# When we get killed, kill all our children
trap "exit" INT TERM
trap "kill 0" EXIT

# Copy ./conf.d and run auto_enable_configs so that nginx is in a runnable state
node /app/dist/apps/https/main.js --pre

# Start up nginx, save PID so we can reload config inside of run_certbot.sh
nginx -g "daemon off;" &
NGINX_PID=$!

echo "nginx started with PID ${NGINX_PID}"

# Instead of trying to run `cron` or something like that, just sleep and run `certbot`.
while [ true ]; do
  # Make sure we do not run container empty (without nginx process).
  # If nginx quit for whatever reason then stop the container.
  # Leave the restart decision to the container orchestration.
  if ! ps aux | grep --quiet [n]ginx; then
    exit 1
  fi

  # Run cert admin to require domain certificates
  echo "Run https node app"
  node /app/dist/apps/https/main.js
  kill -HUP $NGINX_PID

  # Sleep for 1 week
  sleep 604810 &
  SLEEP_PID=$!

  # Wait for 1 week sleep or until nginx terminates
  wait -n "$SLEEP_PID" "$NGINX_PID"
done
