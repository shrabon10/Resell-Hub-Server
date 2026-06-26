

## Overview

This is an Express-based API server that connects to MongoDB and uses JOSE for JWT verification. It exposes endpoints under `/api/*` for products, orders, wishlist, users, and admin operations.

## Main packages

- `express` - HTTP server
- `cors` - Cross-origin resource sharing
- `dotenv` - Load environment variables from a `.env` file
- `mongodb` - MongoDB driver
- `jose-cjs` - JOSE utilities used for JWT verification

These packages are listed in `package.json` and installed via `npm install`.

## Environment variables

Create a `.env` file in the project root with the following values:

- `DB_USER` - MongoDB username
- `DB_PSS` - MongoDB password
- `NEXT_CLIENT_SITE` - URL of the client site used to fetch the JWKS (e.g. https://your-next-site.com)
- `PORT` - (optional) port the server listens on (defaults to 5000)

Example `.env` (do not commit this file):

DB_USER=yourDbUser
DB_PSS=yourDbPassword
NEXT_CLIENT_SITE=https://your-next-site.com
PORT=5000

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

The server will listen on the port specified by `PORT` or default to `5000`.

## Deploying

This project can be deployed to Vercel or any Node.js hosting provider. Vercel will use the `start` script when running the project.

To deploy with the Vercel CLI:

```bash
vercel --prod
```

## Notes

- Keep your `.env` values secret and do not commit them to source control.
- The server expects a running MongoDB instance accessible via the connection string built from `DB_USER` and `DB_PSS`.
