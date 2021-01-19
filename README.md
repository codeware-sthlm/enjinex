# docker-nginx-certbot <!-- omit in toc -->

![Continuous integration](https://github.com/abstract-tlabs/docker-nginx-certbot/workflows/ci/badge.svg?branch=master)

Create and automatically renew website SSL certificates using the free [Let's Encrypt](https://letsencrypt.org/) certificate authority, and its client [_certbot_](https://certbot.eff.org/), built on top of the [Nginx](https://www.nginx.com/) webserver.

## :round_pushpin: &nbsp; Features <!-- omit in toc -->

|                                                    |                      |
| -------------------------------------------------- | -------------------- |
| Distributed as Docker image                        | :white_check_mark:   |
| Built with Node                                    | :white_check_mark:   |
| Type safe code with TypeScript                     | :white_check_mark:   |
| Multi-platform support                             | :white_check_mark:   |
| Node signal handling to prevent zombies            | :white_check_mark:   |
| Configure multiple domains                         | :white_check_mark:   |
| Automatic Let's Encrypt certificate renewal        | :white_check_mark:   |
| Persistent volumes for certificates and Nginx logs | :white_check_mark:   |
| Monorepo tooling by [Nx](nx.dev)                   | :white_check_mark:   |
| Unit tests                                         | :white_check_mark:   |
| Auto linting                                       | :white_check_mark:   |
| Highest level SSL security                         | :white_large_square: |
| Diffie-Hellman parameters                          | :white_large_square: |
| Group domains by a common domain owner             | :white_large_square: |
| Email renewal events to domain owner               | :white_large_square: |
| Compodoc technical docs                            | :white_large_square: |

## Table of contents <!-- omit in toc -->

- [:desktop_computer: &nbsp; Supported platforms](#desktop_computer--supported-platforms)
- [:dart: &nbsp; Usage](#dart--usage)
- [:whale: &nbsp; Useful Docker commands](#whale--useful-docker-commands)
- [:man_shrugging: &nbsp; How does this work?](#man_shrugging--how-does-this-work)
- [:bookmark: &nbsp; Reference sites](#bookmark--reference-sites)
- [:pray: &nbsp; Acknowledgments](#pray--acknowledgments)

## :desktop_computer: &nbsp; Supported platforms

Deployed Docker images can be found [here](https://github.com/orgs/abstract-tlabs/packages/container/package/docker-nginx-certbot%2Fnginx-certbot), supporting the following platforms:

| Platform     | Architecture   | Computers                                |
| ------------ | -------------- | ---------------------------------------- |
| linux/amd64  | AMD 64-bit x86 | Most today and the default Docker choice |
| linux/arm64  | ARM 64-bit     | Raspberry Pi 3 _(and later)_             |
| linux/arm/v7 | ARM 64-bit     | Raspberry Pi 2 Model B                   |

## :dart: &nbsp; Usage

### Prerequisites

The computer using this image must be reached from public for the certificates to be verified and created.

Make sure that your domain name is entered correctly and the DNS A/AAAA record(s) for that domain contain(s) the right IP address. Additionally, check that your computer has a publicly routable IP address and that no firewalls are preventing the server from communicating with the client.

### Environment Variables

#### Required

- `CERTBOT_EMAIL`  
  Usually the domain owner's email, used by Let's Encrypt as contact email in case of any security issues.

#### Optional

- `NODE_ENV`  
  For the official image this value is set to `production`, which means all renewal request are sent to Let's Encrypt `production` site. So, any other value e.g. `staging` or `abc` will use the `staging` site.

- `DRY_RUN`  
  This value is set to `N` by default, which will create real certificates. When this is set to `Y` renewal requests are sent but no changes to the certificate files are made. Use this to test domain setup and prevent any mistakes from creating bad certificates.

- `ISOLATED`  
  This value is set to `N` by default. When this is set to `Y` the certbot request is never made and status is faked successful. Isolated mode is only valuable during development or test, when your computer isn't setup to receive responses on port 80 and 443. With this option it's still possible to spin up the containter and let the renewal process loop do its thing.  
   [Read about how to run isolated tests.](###run-isolated-tests)

### Persistent Volumes

- `/etc/letsencrypt`: Generated domain certificates stored in domain specific folders.

  _Stored as Docker volume: `letsencrypt`_

- `/var/log/nginx`: Nginx access and error logs.

  _Stored as Docker volume: `nginx`_

### Domain Configurations

Every domain to request certificates for must be stored in folder `conf.d`. The file should be named e.g. `domain.com.conf` and contain data at minimum:

```nginx
server {
  listen              443 ssl default_server;
  server_name         domain.com;
  ssl_certificate     /etc/letsencrypt/live/domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/domain.com/privkey.pem;

  location / {
    ...
  }
}
```

> :wave: &nbsp; **INFO**
>
> It's very important that the domain name (e.g. `my-site.io`) match for:
>
> - File name `my-site.io.conf`
> - Configuration property `server_name` to be `my-site.io`
> - Configuration properties
>   - `ssl_certificate` to be `/etc/letsencrypt/live/my-site.io/fullchain.pem`
>   - `ssl_certificate_key` to be `/etc/letsencrypt/live/my-site.io/privkey.pem`

&nbsp;

> :fire: &nbsp; **WARNING**
>
> Using a `server` block that listens on port 80 may cause issues with renewal. This container will already handle forwarding to port 443, so they are unnecessary. See `nginx_conf.d/http.conf`.

### Build and run yourself

If you have pulled the repository and are experimenting or just whats to build it yourself, the image could be built like this:

```sh
docker build -t nginx-certbot:local .
```

The command must be executed inside `project/` folder.

Prior to running the image the domains of interest must be created inside `conf.d/` folder. Then the container is launched like this:

```sh
docker run -it --rm -d \
           -p 80:80 -p 443:443 \
           --env CERTBOT_EMAIL=owner@domain.com \
           -v "$(pwd)/conf.d:/etc/nginx/user.conf.d:ro" \
           -v "$(pwd)/letsencrypt:/etc/letsencrypt" \
           -v "$(pwd)/nginx:/var/log/nginx" \
           --name nginx-certbot \
           nginx-certbot:local
```

> :bulb: &nbsp; **NOTE**
>
> Here we use local folders for volumes `letsencrypt` and `nginx`, to benefit transparency during testing. For a production like setup this is not recommended.

### Run with `docker-compose`

There's an official Docker image deployed to GitLab Container Registry that can be used out of the box. The easiest way is to create a `docker-compose.yml` file like this:

```yml
version: '3.8'

services:
  nginx:
    image: ghcr.io/abstract-tlabs/docker-nginx-certbot/nginx-certbot:latest
    restart: unless-stopped
    environment:
      CERTBOT_EMAIL: owner@domain.com
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./conf.d:/etc/nginx/user.conf.d:ro
      - letsencrypt:/etc/letsencrypt
      - nginx:/var/log/nginx

volumes:
  letsencrypt:
  nginx:
```

Then pull the image, build and start the container:

```sh
docker-compose build --pull
docker-compose -d up
```

### Run isolated tests

Isolated test are used when the computer can not receive reponses from Let's Encrypt. Mostly this is your local development computer.

During these tests no requests are sent to Let's Encrypt but the process is otherwise the real one. By running isolated tests the developer can see the output of the latest changes and get a quick sanity check as a complement to unit tests.

The only problem is the certificates provided by Let's Encrypt and this connection is, stated above, disconnected. Luckily there's a script creating self signed certificate files.

```sh
./isolated-test/make-certs.sh
```

```sh
docker-compose up
```

A fake domain `localhost.dev` is prepared in folder `isolated-test` but there's nothing stopping from creating more fake domains. Just create certificates from those domains as well, e.g. `my-site.com`.

```sh
./isolated-test/make-certs.sh my-site.com
```

## :whale: &nbsp; Useful Docker commands

### Running containers

```sh
docker ps
```

### Container logs

`container-name` can be found using the previous command.

```sh
# Follow log output run-time
docker logs -f container-name

# Display last 50 rows
docker logs -n 50 container-name

# Prefix rows with timestamp
docker logs -f container-name
```

These logs are also saved by `winston` as JSON objects to `logs/` folder.

```sh
# Error logs
docker exec tail -200f logs/error.log container-name

# All other log level
docker exec tail -200f logs/combined.log container-name
```

### List all `Let's Encrypt` domain folders

```sh
docker exec ls -la /etc/letsencrypt/live container-name
```

### List secret files for domain `domain.com`

```sh
docker exec ls -la /etc/letsencrypt/live/domain.com container-name
```

### Display `Nginx` main configuration

```sh
docker exec cat /etc/nginx/nginx.conf container-name
```

### List read-only `Nginx` configuration files provided by `nginx-certbot` image

```sh
docker exec ls -la /etc/nginx/conf.d container-name
```

### Follow `Nginx` logs

```sh
# Access logs
docker exec tail -200f /var/log/nginx/access.log container-name

# Error logs
docker exec tail -200f /var/log/nginx/error.log container-name
```

## :man_shrugging: &nbsp; How does this work?

_To be written..._

## :bookmark: &nbsp; Reference sites

- [Let's Encrypt](https://letsencrypt.org/)
- [Certbot](https://certbot.eff.org/)
- [GitHub Actions using Docker buildx](https://github.com/marketplace/actions/build-and-push-docker-images#usage)

## :pray: &nbsp; Acknowledgments

This repository was originally cloned from `@staticfloat`, kudos to him and all other contributors. The reason to make a clone is to convert from `bash` to `TypeScript` and privde unit tests. Still many good ideas are kept but in a different form.

## :rocket: &nbsp; TODOs <!-- omit in toc -->

- Provide `nginx.conf` file instead of using the default config to apply gzip
- Better security, [https://upcloud.com/community/tutorials/install-lets-encrypt-nginx/](https://upcloud.com/community/tutorials/install-lets-encrypt-nginx/)
- Implement `.env` files as optional alternative
- Add test job to workflow
- Publish docs generated by `compodoc`
- Publish `Nx` dependency graph
- Auto-upgrade with `watchtower`
