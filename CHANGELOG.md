# 1.0-RC1 (2021-02-22)

Enhancements

- Fix reported sonarcloud issues
- Add code coverage to unit tests

Misc

- Rename project to `enjinex`
- Describe the importance of `header.conf` in `README`
- Add more badges to `README`

# 0.7 (2021-02-19)

Misc

- Extend GitHub action with a lint and test job
- Connect to Docker Hub and deploy tagged releases
- PR branches are deployed to GitHub Container Registry
- Remove emojis in readme since Docker Hub doesn't render correctly

# 0.6 (2021-02-04)

Enhancements

- Tuning `headers.conf` for **A+** rating on [SecurityHeaders.com](https://securityheaders.com)

# 0.5 (2021-02-03)

Enhancements

- Add persistent volume for Let's Encrypt logs named `letsecrypt_logs`
- Add a isolated test with expected failure

Misc

- Update docs about certbot renewal
- Rename Let's Encrypt persistent certificates volume to `letsencrypt_cert`
- Rename nginx persistent logs volume to `nginx_logs`

Bug fix

- No need for `text/html` in `gzip.conf`
- All domains must be defined after `-d` flag, not just the optional
- `localhost` was not a valid host which made isolated test fail
- Pending domains were never renamed with suffix `.pending`
- Error from `certbot` was supress which caused false positive runs

# 0.4 (2021-02-01)

Features

- Support multiple domains on a certificate with a common host
- Send SIGUSR2 to trigger force renewal of certificates

Enhancements

- Isolated test terminates after the first loop..
- Analyze Nginx captured error to see if it's a warning and log accordingly
- Apply gzip compression via `conf.d/gzip.conf`

Misc

- Add to readme how to revoke certificate using `certbot` inside container
- Much more documentation added to readme

# 0.3 (2021-01-24)

Features

- Use DRY_RUN environment to apply certbot `--dry-run` flag
- Use ISOLATED environment to run without real certbot requests
- Provide script to create self signed Let's Encrypt certs for isoleted test
- Use Winston for logging
- Use Diffie-Hellman parameters file

Enhancement

- Use syncron child processes only to stop using async await decorators
- Add more tests to `certbot` lib
- Improve ssl security to get A+ by SSL Labs
- Remove support for TLS V1.1, it's soon deprecated

Bug fix

- Second domain request failed due to certbot lock file
- Various fixes...

# 0.2 (2021-01-15)

Enhancement

- Add optional environment variables to readme

Bug fix

- Renewal failed for single domain request

# 0.1 (2021-01-13)

- Major rewrite to Node and TypeScript
