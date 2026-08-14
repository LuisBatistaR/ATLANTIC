const { json } = require('./lib/admin-auth');

exports.handler = async function(event) {
  try {
    const configured = Boolean(process.env.ADMIN_SECRET);
    const supplied = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'];
    const headerReceived = typeof supplied === 'string' && supplied.length > 0;
    // Do not perform authentication here to avoid duplicating logic; just report booleans.
    // However, use the same tolerant checks as admin-auth to determine if authenticated.
    const isAuthenticated = (() => {
      try {
        const requireAdmin = require('./lib/admin-auth').requireAdmin;
        const auth = requireAdmin(event);
        return !!auth.ok;
      } catch (e) {
        return false;
      }
    })();

    return json(200, { configured, headerReceived, authenticated: isAuthenticated });
  } catch (err) {
    return json(500, { error: 'diagnose failed' });
  }
};
