# docker-nginx-certbot

![Continuous integration](https://github.com/abstract-tlabs/docker-nginx-certbot/workflows/ci/badge.svg?branch=master)

Create and automatically renew website SSL certificates using the free [letsencrypt](https://letsencrypt.org/) certificate authority, and its client [_certbot_](https://certbot.eff.org/), built on top of the [nginx](https://www.nginx.com/) webserver.

This repository was originally cloned from `@staticfloat`, kudos to him and all other contributors. The reason to make a clone is to tailor made the image to the needs of our organization.

## Supported platforms

Docker images can be found [here](https://github.com/orgs/abstract-tlabs/packages/container/package/docker-nginx-certbot%2Fnginx-certbot), supporting the following platforms.

| Platform     | Architecture   | Computers                                |
| ------------ | -------------- | ---------------------------------------- |
| linux/amd64  | AMD 64-bit x86 | Most today and the default Docker choice |
| linux/arm64  | ARM 64-bit     | Raspberry Pi 3 _(and later)_             |
| linux/arm/v7 | ARM 43-bit     | Raspberry Pi 2 Model B                   |

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
version: '3.8'

services:
  nginx:
    image: ghcr.io/abstract-tlabs/docker-nginx-certbot/nginx-certbot:latest
    restart: unless-stopped
    environment:
      CERTBOT_EMAIL: owner@company.com
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./conf.d:/etc/nginx/user.conf.d:ro
      - letsencrypt:/etc/letsencrypt

volumes:
  letsencrypt:
```

```sh
docker pull ghcr.io/abstract-tlabs/docker-nginx-certbot/nginx-certbot:latest
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
version: '3.8'

services:
  frontend:
    image: ghcr.io/abstract-tlabs/docker-nginx-certbot/nginx-certbot:latest
    restart: unless-stopped
    environment:
      CERTBOT_EMAIL: owner@company.com
      # variable names are space-separated
      ENVSUBST_VARS: FQDN
      FQDN: company.com
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./conf.d:/etc/nginx/user.conf.d:ro
      - letsencrypt:/etc/letsencrypt

volumes:
  letsencrypt:
```

## Extra domains

In case the primary domain has some more domains, e.g. sub domains, those could also be secured within the domain service scope. This will most likely require a wildcard certificate.

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
version: '3.8'

services:
  frontend:
    image: ghcr.io/abstract-tlabs/docker-nginx-certbot/nginx-certbot:latest
    restart: unless-stopped
    environment:
      CERTBOT_EMAIL: owner@company.com
      ENVSUBST_VARS: FQDN
      FQDN: company.com
    ports:
      - '80:80'
      - '443:443'
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
           ghcr.io/abstract-tlabs/docker-nginx-certbot/nginx-certbot:latest
```

## Reference sites

- [Let's Encrypt](https://letsencrypt.org/)
- [certbot](https://certbot.eff.org/)
- [GitHub Actions using Docker buildx](https://github.com/marketplace/actions/build-and-push-docker-images#usage)

## TODOs

- Verify `docker run` command options are correct and it all works
- Provide `nginx.conf` file instead of using the default config to apply gzip
- Better security, [https://upcloud.com/community/tutorials/install-lets-encrypt-nginx/](https://upcloud.com/community/tutorials/install-lets-encrypt-nginx/)
- Implement `.env` files as optional alternative
- Add workflow action tests
- Only trigger action when files related to docker image was changed
