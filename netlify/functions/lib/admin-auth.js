const crypto = require('crypto');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}

function requireAdmin(event) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return { ok: false, response: json(500, { error: 'Server access control is not configured.' }) };

  const supplied = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'];
  if (typeof supplied !== 'string') return { ok: false, response: json(401, { error: 'Admin access is required.' }) };

  // Compare using timingSafeEqual to avoid leaking timing information.
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  try {
    if (expectedBuffer.length === suppliedBuffer.length && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      return { ok: true };
    }
  } catch (e) {
    // If timingSafeEqual throws for any reason, fall through to tolerant check below.
  }

  // Fallback tolerant check: allow accidental leading/trailing whitespace differences
  // (trim both sides and compare). This helps when secrets are copied with newlines.
  const expectedTrim = Buffer.from(String(expected).trim());
  const suppliedTrim = Buffer.from(String(supplied).trim());
  if (expectedTrim.length === suppliedTrim.length) {
    try {
      if (crypto.timingSafeEqual(expectedTrim, suppliedTrim)) return { ok: true };
    } catch (e) {
      // ignore and deny
    }
  }

  // Additional tolerant check: handle secrets pasted with surrounding quotes
  const stripQuotes = s => {
    let str = String(s).trim();
    if (str.length >= 2 && ((str[0] === '"' && str[str.length-1] === '"') || (str[0] === "'" && str[str.length-1] === "'"))) {
      return Buffer.from(str.slice(1, -1));
    }
    return Buffer.from(str);
  };
  const expectedStrip = stripQuotes(expected);
  const suppliedStrip = stripQuotes(supplied);
  if (expectedStrip.length === suppliedStrip.length) {
    try { if (crypto.timingSafeEqual(expectedStrip, suppliedStrip)) return { ok: true }; } catch (e) { }
  }

  return { ok: false, response: json(401, { error: 'Admin access is required.' }) };
}

module.exports = { json, requireAdmin };
