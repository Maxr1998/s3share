# s3share

An end-to-end-encrypted file-sharing platform built on an S3-compatible object storage.
It uses Cloudflare Workers to sign temporary upload and download URLs, and encrypts and decrypts
the files in the browser using WebCrypto.
The frontend is written in Svelte.
Metadata and upload sessions are stored in Cloudflare KV.

## Configuration

The app is deployed as a Cloudflare Worker with static assets.
Copy `wrangler.toml.tmpl` to `wrangler.toml` and fill in the following values:

- `pattern` under `[[routes]]`: The custom domain to serve the app from.
- `S3_ENDPOINT`: The endpoint of your S3-compatible object storage.
- `S3_BUCKET`: The name of the bucket you want to use.
- The IDs of two KV namespaces:
    - `METADATA`: Stores the (partially encrypted) server-side file metadata.
    - `UPLOAD_SESSIONS`: Stores the state of pending and in-progress uploads.

Additionally, configure the following secrets using `wrangler secret put <name>`:

- `S3_ACCESS_KEY`: The access key for your S3-compatible object storage.
- `S3_SECRET_KEY`: The secret key for your S3-compatible object storage.
- `FILE_ID_KEY`: A base64-encoded random key used to derive file IDs from upload tokens,
  e.g. generated with `openssl rand -base64 32`.

Then build and deploy with `npm run deploy`.

## Uploading files

A command-line upload tool is available in a separate repository:
[s3share-cli](https://github.com/Maxr1998/s3share-cli).