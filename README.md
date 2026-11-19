# FactoryFlow frontend

React/Vite frontend for the separate Sprint 2 FactoryFlow Express API. This repository does not contain a backend or database.

## Development

Requirements: Node.js 20+, npm, and the existing FactoryFlow API. In `C:\Users\user\Documents\FactoryFlow`, follow its README to configure MongoDB and start the API on port 3000. Do not commit `.env` files or credentials. MongoDB transactions require a replica set.

In this frontend directory:

```powershell
npm ci
npm run dev
```

Open the Vite URL. The development proxy forwards `/api` to `http://localhost:3000`. Axios defaults to `/api`; set `VITE_API_URL` at build time only for an API with an appropriate base path and CORS configuration. The production Nginx container proxies `/api` to the separate API.

The Sprint 2 backend seeds its initial administrator using its documented seed script. Supply secrets through your environment; do not place them in source or logs. The API does not currently expose one-time setup endpoints.

## Verification

```powershell
npm test
npm run build
npm run lint
```

The current Node test suite exercises aggregation and validation. Jest, React Testing Library and ESLint require dependencies that could not be installed in the restricted environment. The configured lint command currently fails until ESLint and a React configuration are installed; CI intentionally does not skip that failure.

## Container preview

Start the existing backend separately on the host at port 3000. Then run `docker compose up --build` in this directory and open `http://localhost:8080`. The Compose host gateway maps `api` to the host; on environments without host-gateway support, supply a reachable API host in the deployment's Nginx configuration. Nginx falls back to `index.html` for client routes and forwards `/api` to the API. The image contains only the built frontend and Nginx; it does not start MongoDB or recreate the backend.

## Known API limitations

The current backend accepts one product per order. The frontend blocks multi-product submission rather than creating multiple independent orders. Operator order reads, secure one-time setup and stock movement history need backend support. See [BACKEND-BLOCKERS.md](BACKEND-BLOCKERS.md) for the required contracts and transaction checks. The local `design-prototype` directory is an optional reference and is excluded from Git and Docker.
