# docker-nginx-certbot

![.github/workflows/docker-publish.yml](https://github.com/abstract-tlabs/docker-nginx-certbot/workflows/.github/workflows/docker-publish.yml/badge.svg?branch=master)

Create and automatically renew website SSL certificates using the free [letsencrypt](https://letsencrypt.org/) certificate authority, and its client [_certbot_](https://certbot.eff.org/), built on top of the [nginx](https://www.nginx.com/) webserver.

This repository was originally cloned from `@staticfloat`, kudos to him and all other contributors. The reason to make a clone is to tailor made the image to the needs of our organization.

## Prerequisites

The server using this image must be reached from public for the certificates to be verified and created.

Make sure that your domain name is entered correctly and the DNS A/AAAA record(s) for that domain contain(s) the right IP address. Additionally, check that your computer has a publicly routable IP address and that no firewalls are preventing the server from communicating with the client.

## Usage

> A setup with all features applied could be explored in `example` folder.

Create a config directory for your custom configs:

```sh
mkdir conf.d
```

Add one or many `.conf` files in that directory, e.g. `company.com.conf`:

```nginx
nginx
server {
  listen              443 ssl;
  server_name         company.com;
  ssl_certificate     /etc/letsencrypt/live/company.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/company.com/privkey.pem;

  location / {
    ...
  }
}
```

The name if the file is irrelevant but it must end with `.conf`.

> Note: using a `server` block that listens on port 80 may cause issues with renewal. This container will already handle forwarding to port 443, so they are unnecessary. See `nginx_conf.d/certbot.conf`.

Wrap this all up with a `docker-compose.yml` file:

```yml
version: "3.8"
services:
  nginx:
    image: abstract-tlabs/nginx-certbot
    restart: unless-stopped
    environment:
      CERTBOT_EMAIL: owner@company.com
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./conf.d:/etc/nginx/user.conf.d:ro
      - letsencrypt:/etc/letsencrypt

volumes:
  letsencrypt:
```

```sh
docker-compose -d up
```

`certbot` will automatically request an SSL certificate for any `nginx` sites that look for SSL certificates in `/etc/letsencrypt/live`, and will automatically renew them over time.

## Templating

You may wish to template your configurations, e.g. passing in a hostname so as to be able to run multiple identical copies of this container; one per website. The docker container will use [`envsubst`](https://www.gnu.org/software/gettext/manual/html_node/envsubst-Invocation.html) to template all mounted user configs with a user-provided list of environment variables. Example:

```nginx
# In conf.d/nginx_template.conf
server {
  listen              443 ssl;
  server_name         ${FQDN};
  ssl_certificate     /etc/letsencrypt/live/${FQDN}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${FQDN}/privkey.pem;

  ...
}
```

```yml
version: "3.8"
services:
  frontend:
    image: abstract-tlabs/nginx-certbot
    restart: unless-stopped
    environment:
      CERTBOT_EMAIL: owner@company.com
      # variable names are space-separated
      ENVSUBST_VARS: FQDN
      FQDN: company.com
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./conf.d:/etc/nginx/user.conf.d:ro
      - letsencrypt:/etc/letsencrypt

volumes:
  letsencrypt:
```

## Extra domains

In case the primary domain has some more domains, e.g. sub domains, those could also be secured within the domain service scope.

Create a new root folder `certbot_extra_domains`.

```sh
mkdir certbot_extra_domains
```

Inside that folder, create files with the same name as the primary domains, defined in each service. E.g. `certbot_extra_domin/company.com`. The file should then contain all extra domains, one on each row.

```sh
echo "mail.company.com" > certbot_extra_domains/company.com
```

Finally setup another volume to provide these files to the container.

```yml
version: "3.8"
services:
  frontend:
    image: abstract-tlabs/nginx-certbot
    restart: unless-stopped
    environment:
      CERTBOT_EMAIL: owner@company.com
      ENVSUBST_VARS: FQDN
      FQDN: company.com
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./conf.d:/etc/nginx/user.conf.d:ro
      - ./certbot_extra_domains:/etc/nginx/certbot/extra_domains:ro
      - letsencrypt:/etc/letsencrypt

volumes:
  letsencrypt:
```

## Start using Docker command only

Alternatively, docker could be run for each domain using plain `docker` only:

```sh
docker run --name nginx-proxy:company.com --rm --detach
           --env CERTBOT_EMAIL=owner@company.com \
           --env ENVSUBST_VARS=FQDN
           --env FQDN=company.com
           --volume ./conf.d:/etc/nginx/user.conf.d:ro \
           --volume ./certbot_extra_domains:/etc/nginx/certbot/extra_domains:ro \
           --volume letsencrypt:/etc/letsencrypt \
           --publish "80:80" \
           --publish "443:443" \
           --restart unless-stopped \
           --network letsencrypt \
           abstract-tlabs/nginx-certbot
```

## Reference sites

- [Let's Encrypt](https://letsencrypt.org/)
- [certbot](https://certbot.eff.org/)

## TODOs

- Verify `docker run` command options are correct and it all works
- Provide `nginx.conf` file instead of using the default config to apply gzip
- Implement `.env` files as optional alternative
