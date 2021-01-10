### STAGE 1: Build apps ###
FROM node:15-alpine as builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./

# Python is not included in alpine image and must be installed manually

# --no-cache: download package index on-the-fly, no need to cleanup afterwards
# --virtual: bundle packages, remove whole bundle at once, when done
# RUN apk --no-cache --update --virtual build-dependencies add \
#     python \
#     make \
#     g++ \
#     && npm ci --no-progress --silent --loglevel=error \
#     && apk del build-dependencies

# Install packages for build app step
RUN yarn --frozen-lockfile

# Build app
COPY . .
RUN npx nx run-many --target=build --configuration=production --all

# Keep prod only packages for deployment
RUN yarn --prod

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
    chown www-data:www-data -R /var/www && \
    # Remove default nginx configurations
    rm -f /etc/nginx/conf.d/* && \
    echo "NodeJS Version:" "$(node -v)" && \
    echo "NPM Version:" "$(npm -v)"

# Copy scripts
COPY scripts/ /scripts
RUN chmod +x -R /scripts

# Copy nginx configurations
# Make sure ACME challenge requests are verified and then redirects HTTP request to HTTPS
COPY nginx_conf.d/ /etc/nginx/conf.d/

# Copy node apps
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules

# Setup persistent volume for created certificates
VOLUME /etc/letsencrypt

EXPOSE 80
EXPOSE 443

CMD ["/bin/bash", "/scripts/entrypoint.sh"]
#CMD ["node", "/app/dist/apps/https/main.js"]
