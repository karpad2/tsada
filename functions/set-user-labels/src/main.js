/**
 * set-user-labels — Appwrite Cloud Function
 *
 * Body (JSON):
 *   { "userId": "<target user id>", "labels": ["admin"] | [] }
 *
 * Security:
 *   - Must be invoked with a user session (x-appwrite-user-id present)
 *   - Caller must have "admin" in their labels
 *   - Server API key stays only on the Function runtime (never in the SPA)
 *
 * Deploy:
 *   1. Appwrite Console → Functions → Create → ID: set-user-labels
 *   2. Runtime: Node.js 18+
 *   3. Scopes: users.read, users.write
 *   4. Execute access: users (authenticated) or role:admin if available
 *   5. Upload this folder (or link to repo path functions/set-user-labels)
 */

import { Client, Users } from 'node-appwrite'

const VALID_ROLES = new Set(['admin', 'editor', 'teacher', 'photographer', 'secretary'])

function parseBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'object') return req.body
  try {
    return JSON.parse(req.body)
  } catch {
    return {}
  }
}

function json(res, statusCode, payload) {
  return res.json(payload, statusCode)
}

export default async ({ req, res, log, error }) => {
  if (req.method === 'GET' && (req.path === '/ping' || req.path === '/')) {
    return json(res, 200, { ok: true, service: 'set-user-labels' })
  }

  const callerId = req.headers['x-appwrite-user-id']
  if (!callerId) {
    return json(res, 401, {
      success: false,
      error: 'Unauthorized: login required'
    })
  }

  const body = parseBody(req)
  const userId = body.userId || body.user_id
  let labels = body.labels

  if (!userId || typeof userId !== 'string') {
    return json(res, 400, {
      success: false,
      error: 'userId is required'
    })
  }

  if (!Array.isArray(labels)) {
    if (typeof body.role === 'string') {
      labels = body.role ? [body.role] : []
    } else {
      return json(res, 400, {
        success: false,
        error: 'labels must be an array (use [] to clear)'
      })
    }
  }

  // Normalize / validate labels — only known role strings
  labels = [...new Set(labels.map(String).filter(Boolean))]
  for (const label of labels) {
    if (!VALID_ROLES.has(label)) {
      return json(res, 400, {
        success: false,
        error: `Invalid label: ${label}. Allowed: ${[...VALID_ROLES].join(', ')}`
      })
    }
  }

  // Prefer only one primary role label
  if (labels.length > 1) {
    return json(res, 400, {
      success: false,
      error: 'Only one role label is allowed per user'
    })
  }

  const endpoint =
    process.env.APPWRITE_FUNCTION_API_ENDPOINT ||
    process.env.APPWRITE_ENDPOINT ||
    ''
  const projectId =
    process.env.APPWRITE_FUNCTION_PROJECT_ID ||
    process.env.APPWRITE_PROJECT_ID ||
    ''
  // Dynamic API key from Appwrite (recommended) or secret env
  const apiKey =
    req.headers['x-appwrite-key'] ||
    process.env.APPWRITE_API_KEY ||
    process.env.APPWRITE_FUNCTION_API_KEY ||
    ''

  if (!endpoint || !projectId || !apiKey) {
    error('Missing Appwrite function credentials (endpoint/project/key)')
    return json(res, 500, {
      success: false,
      error: 'Function misconfigured'
    })
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
  const users = new Users(client)

  try {
    // Caller must be admin
    const caller = await users.get(callerId)
    const callerLabels = Array.isArray(caller.labels) ? caller.labels : []
    if (!callerLabels.includes('admin')) {
      log(`Denied: ${callerId} is not admin (labels=${callerLabels.join(',')})`)
      return json(res, 403, {
        success: false,
        error: 'Forbidden: admin role required'
      })
    }

    // Optional: prevent accidental self-lockout only when clearing last admin
    // (simple check — not a full multi-admin audit)
    if (callerId === userId && !labels.includes('admin')) {
      log(`Warning: admin ${callerId} removing own admin label`)
    }

    await users.updateLabels(userId, labels)
    log(`Labels updated for ${userId} by ${callerId}: [${labels.join(', ')}]`)

    return json(res, 200, {
      success: true,
      userId,
      labels,
      updatedBy: callerId
    })
  } catch (err) {
    error(`set-user-labels failed: ${err?.message || err}`)
    return json(res, 500, {
      success: false,
      error: err?.message || 'Failed to update labels'
    })
  }
}
