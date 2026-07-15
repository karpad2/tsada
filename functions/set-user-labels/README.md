# set-user-labels

Secure Appwrite Function to set / clear **user role labels** (`admin`, `editor`, `teacher`, `photographer`).

The SPA must **never** ship a Server API key. This function keeps the key on the server.

## Deploy (Console)

1. **Functions → Create function**
   - Function ID: `set-user-labels` (must match client config)
   - Runtime: Node.js 18+ or 20+
   - Entrypoint: `src/main.js`
2. **Scopes** (or API key with): `users.read`, `users.write`
3. **Execute access**: Any authenticated user (function checks `admin` label itself)
4. Deploy the contents of this folder
5. (Optional) Enable **dynamic API key** so `x-appwrite-key` is injected

## CLI (optional)

```bash
# from repo root — requires appwrite CLI logged in
appwrite functions create \
  --function-id set-user-labels \
  --name "Set User Labels" \
  --runtime node-18.0 \
  --entrypoint src/main.js

appwrite push functions
```

## Client call

```ts
import { Functions } from 'appwrite'
const functions = new Functions(appw)
const ex = await functions.createExecution(
  'set-user-labels',
  JSON.stringify({ userId: '...', labels: ['editor'] }),
  false,
  '/',
  'POST'
)
```

## Body

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Target user |
| `labels` | string[] | Role labels (`[]` clears) |
| `role` | string | Shortcut: single role → `labels: [role]` |

## After deploy

1. **Rotate** any API key that was previously embedded in the SPA.
2. Ensure at least one user already has `admin` label (bootstrap from Console).
