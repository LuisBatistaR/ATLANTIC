const crypto = require('crypto');
const { getInstallationToken, createOrUpdateFile } = require('./lib/github');
const { requireAdmin, json } = require('./lib/admin-auth');

const MAX_SIZE = 5 * 1024 * 1024;
const MIME_BY_EXTENSION = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function sniffMime(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

function safeFilename(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 120 || value.includes('/') || value.includes('\\') || value.includes('..')) throw new Error('Invalid filename.');
  const name = value.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/.test(name)) throw new Error('Only JPG, PNG and WebP image names are allowed.');
  return name;
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const auth = requireAdmin(event); if (!auth.ok) return auth.response;
  try {
    const body = JSON.parse(event.body || '');
    const filename = safeFilename(body.filename);
    if (typeof body.content !== 'string' || body.content.length === 0 || body.content.length > Math.ceil(MAX_SIZE * 4 / 3) + 16 || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.content)) throw new Error('Invalid image payload.');
    const buffer = Buffer.from(body.content, 'base64');
    if (!buffer.length || buffer.length > MAX_SIZE) throw new Error('Image must be at most 5 MB.');
    const extension = filename.split('.').pop();
    const detectedMime = sniffMime(buffer);
    if (!detectedMime || detectedMime !== MIME_BY_EXTENSION[extension] || body.mimeType !== detectedMime) throw new Error('Image type does not match its contents.');

    const token = await getInstallationToken();
    const repo = process.env.GITHUB_REPOSITORY;
    if (!/^[^/\s]+\/[^/\s]+$/.test(repo || '')) throw new Error('Repository configuration is invalid.');
    const [owner, repoName] = repo.split('/');
    const path = `content-media/admin-${crypto.randomUUID()}-${filename}`;
    const result = await createOrUpdateFile(owner, repoName, path, buffer.toString('base64'), `Add media ${filename}`, token);
    return json(200, { ok: true, path: `/${path}`, commit: result.commit ? result.commit.sha : null });
  } catch (error) {
    console.error('media-upload failed', error);
    return json(400, { error: error.message || 'Image upload failed.' });
  }
};
