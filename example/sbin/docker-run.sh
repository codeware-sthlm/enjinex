#!/bin/sh

echo "Start nginx-certbot:local isolated with local volumes"

docker run -it --rm -d \
  -p 80:80 -p 443:443 \
  --env CERTBOT_EMAIL=owner@domain.com \
  --env ISOLATED='Y' \
  -v "$(pwd)/conf.d:/etc/nginx/user.conf.d:ro" \
  -v "$(pwd)/letsencrypt:/etc/letsencrypt" \
  -v "$(pwd)/nginx:/var/log/nginx" \
  --name nginx-certbot \
  nginx-certbot:local
