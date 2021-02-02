# 0.5 (2021-02-xx)

Enhancements

- Add persistent volume for Let's Encrypt logs named `letsecrypt_logs`

Misc

- Update docs about certbot renewal
- Rename Let's Encrypt persistent certificates volume to `letsencrypt_cert`
- Rename nginx persistent logs volume to `nginx_logs`

Bug fix

- No need for `text/html` in `gzip.conf`
- All domains must be defined after `-d` flag, not just the optional
- `localhost` was not a valid host which made isolated test fail
- Pending domains were never renamed with suffix `.pending`

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
