# docker-nginx-certbot

![Continuous integration](https://github.com/abstract-tlabs/docker-nginx-certbot/workflows/ci/badge.svg?branch=master)

Create and automatically renew website SSL certificates using the free [Let's Encrypt](https://letsencrypt.org/) certificate authority, and its client [_certbot_](https://certbot.eff.org/), built on top of the [Nginx](https://www.nginx.com/) webserver.

| Features                                           |                      |
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

## :whale: &nbsp; Supported platforms

Deployed Docker images can be found [here](https://github.com/orgs/abstract-tlabs/packages/container/package/docker-nginx-certbot%2Fnginx-certbot), supporting the following platforms:

| Platform     | Architecture   | Computers                                |
| ------------ | -------------- | ---------------------------------------- |
| linux/amd64  | AMD 64-bit x86 | Most today and the default Docker choice |
| linux/arm64  | ARM 64-bit     | Raspberry Pi 3 _(and later)_             |
| linux/arm/v7 | ARM 43-bit     | Raspberry Pi 2 Model B                   |

## :dart: &nbsp; Usage

### Prerequisites

The computer using this image must be reached from public for the certificates to be verified and created.

Make sure that your domain name is entered correctly and the DNS A/AAAA record(s) for that domain contain(s) the right IP address. Additionally, check that your computer has a publicly routable IP address and that no firewalls are preventing the server from communicating with the client.

### Environment Variables

#### Required

- `CERTBOT_EMAIL`: Usually the domain owner's email, used by Let's Encrypt as contact email in case of any security issues.

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

> &nbsp;
>
> :wave: &nbsp; **INFO**
>
> It's very important that the domain name (e.g. `my-site.io`) match for:
>
> - File name `my-site.io.conf`
> - Configuration property `server_name` to be `my-site.io`
> - Configuration properties
>   - `ssl_certificate` to be `/etc/letsencrypt/live/my-site.io/fullchain.pem`
>   - `ssl_certificate_key` to be `/etc/letsencrypt/live/my-site.io/privkey.pem`
>
> &nbsp;

&nbsp;

> &nbsp;
>
> :fire: &nbsp; **WARNING**
>
> Using a `server` block that listens on port 80 may cause issues with renewal. This container will already handle forwarding to port 443, so they are unnecessary. See `nginx_conf.d/http.conf`.
>
> &nbsp;

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

> &nbsp;
>
> :bulb: &nbsp; **NOTE**
>
> Here we use local folders for volumes `letsencrypt` and `nginx`, to benefit transparency during testing. For a production like setup this is not recommended.
>
> &nbsp;

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

## :wrench: &nbsp; Useful Docker commands

### Running containers

```sh
docker ps
```

### Container logs

`container-name` can be found using the previous command.

```sh
# Follow log output run-time
docker logs container-name -f

# Display last 50 rows
docker logs container-name -n 50

# Prefix rows with timestamp
docker logs container-name -t
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
docker logs -f /var/log/nginx/access.log container-name

# Error logs
docker logs -f /var/log/nginx/error.log container-name
```

## :man_shrugging: &nbsp; How does this work?

_To be written..._

## :bookmark: &nbsp; Reference sites

- [Let's Encrypt](https://letsencrypt.org/)
- [certbot](https://certbot.eff.org/)
- [GitHub Actions using Docker buildx](https://github.com/marketplace/actions/build-and-push-docker-images#usage)

## :pray: &nbsp; Acknowledgments

This repository was originally cloned from `@staticfloat`, kudos to him and all other contributors. The reason to make a clone is to convert from `bash` to `TypeScript` and privde unit tests. Still many good ideas are kept but in a different form.

## :rocket: &nbsp; TODOs

- Provide `nginx.conf` file instead of using the default config to apply gzip
- Better security, [https://upcloud.com/community/tutorials/install-lets-encrypt-nginx/](https://upcloud.com/community/tutorials/install-lets-encrypt-nginx/)
- Implement `.env` files as optional alternative
- Add workflow action tests
- Publish docs generated by `compodoc`
- Publish `Nx` dependency graph
- Auto-upgrade with `Watchdog`
- Only trigger action when files related to docker image was changed (maybe)
