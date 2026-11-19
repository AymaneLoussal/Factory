# Backend integration blockers

The Sprint 2 API at `../FactoryFlow` remains the source of truth. No mock API or database is included here.

- **Multi-product orders:** `POST /api/ordres` accepts one `produit` and `quantite`. Add an array of unique product IDs and positive quantities while preserving the existing payload for older clients. Reject an empty list, duplicates, unknown products, and invalid quantities. Do not create multiple orders as a substitute.
- **Snapshots and aggregation:** capture each product's composition at creation, retain the product quantity and material units independently of later catalog edits, and sum requirements by material across products. The reference case must produce 35 kg X and 5 kg Y.
- **Stock and transitions:** check all aggregate requirements, then consume stock, write movements, and move Planned to In Progress in one MongoDB transaction. Roll back completely on shortage or error, and prevent repeated start consumption. Allow completion only from In Progress and cancellation only from Planned.
- **Operator access:** provide an authenticated list/detail scoped to the current operator; validate an active operator at assignment; enforce assignment server-side on start and complete. Currently order reads are Admin-only and action handlers do not pass the authenticated actor to the service.
- **Installation:** implement a secure one-time setup with a race-safe guarantee that an administrator cannot be created after installation. The existing backend has no setup endpoints and uses an administrator seed script instead.
- **Movement history:** expose a paginated, authorized read endpoint backed by actual movement records; the current backend writes movements but has no read route.
- **Tests:** cover old and new order payloads, snapshots after catalog changes, shared materials, insufficient stock, concurrent/repeated starts and assignment authorization. Run transaction tests against a dedicated MongoDB replica set without resetting application data.

Frontend multi-product submission remains blocked until the backend contract is implemented and verified. Setup, movement history, and operator order listings remain unavailable in the current API.
