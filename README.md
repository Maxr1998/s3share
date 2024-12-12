# s3share

An end-to-end-encrypted file-sharing platform built on an S3-compatible object storage.
It uses Cloudflare Workers to sign temporary download URLs, and decrypts the files
in the browser during download using WebCrypto.
The frontend is written in Svelte.
Metadata is stored in Cloudflare KV.

## Configuration

Deploy this project to Cloudflare Pages and configure the following environment variables:

- `S3_ENDPOINT`: The endpoint of your S3-compatible object storage.
- `S3_BUCKET`: The name of the bucket you want to use.
- `S3_ACCESS_KEY`: The access key for your S3-compatible object storage.
- `S3_SECRET_KEY`: The secret key for your S3-compatible object storage.

You also need to attach a KV namespace by adding a binding named `KV` in the Pages settings.
The KV namespace is used to store (partially encrypted) server-side metadata.

## Uploading files

A command-line upload tool is available in a separate repository:
[s3share-cli](https://github.com/Maxr1998/s3share-cli).