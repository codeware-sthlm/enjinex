# 0.3 (2021-01-xx)

Bug fix

- Second domain request failed due to certbot lock file

Features

- Use DRY_RUN environment to apply certbot `--dry-run` flag
- Use ISOLATED environment to run without real certbot requests
- Provide script to create self signed Let's Encrypt certs for isoleted test
- Use Winston for logging

Enhancement

- Use syncron child processes only to stop using async await decorators
- Add more tests to `certbot` lib

# 0.2 (2021-01-15)

Bug fix

- Renewal failed for single domain request

Other

- Add optional environment variables to readme

# 0.1 (2021-01-13)

- Major rewrite to Node and TypeScript
