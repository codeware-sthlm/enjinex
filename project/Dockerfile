### STAGE 1: Build apps ###
FROM node:14-alpine as builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./

# Install packages for build app step
RUN yarn --frozen-lockfile --network-timeout 1000000

# Build app
COPY . .
RUN npx nx run-many --target=build --configuration=production --all

# Keep prod only packages for deployment
RUN yarn --frozen-lockfile --prod --network-timeout 1000000

### STAGE 2: Docker ###
FROM nginx:mainline
LABEL maintainer="Håkan Ströberg <hakan.stroberg@trekki.se>"

# Do additional installs in one RUN command to avoid creating large
# intermediate layers on non-squashable docker installs
RUN apt update && \
    apt install -y python3 python3-dev libffi6 libffi-dev libssl-dev curl build-essential procps && \
    curl -L 'https://bootstrap.pypa.io/get-pip.py' | python3 && \
    pip install -U cffi certbot && \
    # Install Node 15
    curl -sL https://deb.nodesource.com/setup_15.x | bash - && \
    apt-get install -y nodejs && \
    # Cleanup
    apt remove --purge -y python3-dev build-essential libffi-dev libssl-dev curl && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    # Create certbot directories and set proper permissions
    mkdir -p /var/www/letsencrypt && \
    chown -R www-data:www-data /var/www && \
    # Create ssl cert directory
    mkdir -p /etc/nginx/ssl && \
    # Remove nginx symlink logs to support node spawn on all platforms (logs to /dev/std* needs more tweeks)
    rm -f /var/log/nginx/access.log && \
    rm -f /var/log/nginx/error.log && \
    # Remove default nginx configurations
    rm -f /etc/nginx/conf.d/* && \
    echo "NodeJS Version:" "$(node -v)" && \
    echo "NPM Version:" "$(npm -v)" && \
    echo "OpenSSL Version:" "$(openssl version)"

# Copy nginx configurations;
# Make sure ACME challenge requests are verified and then redirects HTTP request to HTTPS
COPY nginx_conf.d/conf.d/   /etc/nginx/conf.d/
COPY nginx_conf.d/secure.d/ /etc/nginx/secure.d/

# Copy node apps
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules

# Setup persistent volumes
VOLUME /etc/letsencrypt
VOLUME /etc/nginx/ssl
VOLUME /var/log/letsencrypt
VOLUME /var/log/nginx

EXPOSE 80
EXPOSE 443

# Start Node init app
ENTRYPOINT ["node", "/app/dist/apps/init/main.js"]
