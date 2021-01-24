#!/bin/bash

#########################################################
# Self signed root ca and certificates for Let's Encrypt #
#########################################################

set -e

# Get script path independant from where the script was called
SCRIPT_PATH="$(cd "$(dirname "$0")"; pwd -P)"

# Full Qualified Domain Name
FQDN="${1:-localhost.dev}"
FQDN="$(echo "${FQDN}" | tr 'A-Z' 'a-z')"

# Save certs to folder
DEST="${SCRIPT_PATH}/letsencrypt/live"

# Optional settings
COUNTRY="SE"
CITY="Stockholm"
ORG_NAME="Dummy Ltd"
ORG_UNIT="IT Department"

# Internal settings
CA_NAME="$(echo "${ORG_NAME}" | tr 'A-Z' 'a-z' | sed 's/[^a-z0-9]+/_/g')"

# Make directories to work from
mkdir -p "${DEST}/ca"
mkdir -p "${DEST}/${FQDN}"

function create_root_ca() {
  # Create your own Root Certificate Authority
  openssl genrsa \
    -out "${DEST}/ca/${CA_NAME}_ca.key.pem" \
    3072

  # Self-sign your Root Certificate Authority
  openssl req \
    -x509 \
    -new \
    -sha256 \
    -nodes \
    -days 3650 \
    -key "${DEST}/ca/${CA_NAME}_ca.key.pem" \
    -out "${DEST}/ca/${CA_NAME}_ca.crt.pem" \
    -subj "/C=${COUNTRY}/L=${CITY}/O=${ORG_NAME}/OU=${ORG_UNIT}/CN=${ORG_NAME} CA"
}

function create_certificate() {
  # Private key
  openssl genrsa \
    -out "${DEST}/${FQDN}.key.pem" \
    3072

  # Create the CSR to FQDN and *.FQDN
  openssl req -new \
    -sha256 \
    -key "${DEST}/${FQDN}.key.pem" \
    -out "${DEST}/${FQDN}.csr.pem" \
    -subj "/C=${COUNTRY}/L=${CITY}/O=${ORG_NAME}/OU=${ORG_UNIT}/CN=${FQDN}/CN=*.${FQDN}"
}

function sign_certificate() {
  # Sign the request from Server with your Root CA
  openssl x509 \
    -sha256 \
    -req -in "${DEST}/${FQDN}.csr.pem" \
    -CA "${DEST}/ca/${CA_NAME}_ca.crt.pem" \
    -CAkey "${DEST}/ca/${CA_NAME}_ca.key.pem" \
    -CAcreateserial \
    -out "${DEST}/${FQDN}.cert.pem" \
    -days 3650

  # Remove the request
  rm -f "${DEST}/${FQDN}.csr.pem"
}

function bundle_certificate() {
  echo "PRIVATE server bundle: certs/${FQDN}.bundle.pem"
  echo " > keep it secret and safe - just as key.pem"

  cat \
    "${DEST}/${FQDN}.key.pem" \
    "${DEST}/${FQDN}.cert.pem" \
    >"${DEST}/${FQDN}.bundle.pem"

  echo "chain: ${DEST}/${FQDN}.chain.pem"
  echo " > contains Intermediates and Root CA in least-authoritative first manner"

  # if there were an intermediate, it would be concatonated before the Root CA
  cat \
    "${DEST}/ca/${CA_NAME}_ca.crt.pem" \
    >"${DEST}/${FQDN}.chain.pem"

  echo "fullchain: ${DEST}/${FQDN}.fullchain.pem"
  echo " > contains Server CERT, Intermediates and Root CA"

  cat \
    "${DEST}/${FQDN}.cert.pem" \
    "${DEST}/ca/${CA_NAME}_ca.crt.pem" \
    >"${DEST}/${FQDN}.fullchain.pem"
}

function copy_letsencrypt_certificates() {
  echo "Copy certificates used by Let's Encrypt to verify domain"

  cp -R "${DEST}/${FQDN}.key.pem" "${DEST}/${FQDN}/privkey.pem"

  cp -R "${DEST}/${FQDN}.fullchain.pem" "${DEST}/${FQDN}/fullchain.pem"
}

create_root_ca
create_certificate
sign_certificate
bundle_certificate
copy_letsencrypt_certificates
