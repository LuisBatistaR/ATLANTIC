const crypto = require('crypto');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}

function requireAdmin(event) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return { ok: false, response: json(500, { error: 'Server access control is not configured.' }) };

  const supplied = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'];
  if (typeof supplied !== 'string') return { ok: false, response: json(401, { error: 'Admin access is required.' }) };

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  const valid = expectedBuffer.length === suppliedBuffer.length && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
  if (!valid) return { ok: false, response: json(401, { error: 'Admin access is required.' }) };
  return { ok: true };
}

module.exports = { json, requireAdmin };
