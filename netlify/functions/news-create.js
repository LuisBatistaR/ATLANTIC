const { getInstallationToken, getFile, createOrUpdateFile, deleteFile } = require('./lib/github');
const { requireAdmin, json } = require('./lib/admin-auth');
const { serializeFrontmatter } = require('./lib/frontmatter');

const CATEGORIES = new Set(['Institucional', 'España', 'Canarias', 'Venezuela', 'Iberoamérica', 'Europa', 'América', 'Democracia', 'Libertad', 'Internacional', 'Sociedad civil', 'Análisis']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(value, field, max, { required = true } = {}) {
  if (typeof value !== 'string') throw new Error(`${field} must be text.`);
  const result = value.trim();
  if (required && !result) throw new Error(`${field} is required.`);
  if (result.length > max) throw new Error(`${field} is too long.`);
  return result;
}

function validate(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid request body.');
  const title = text(payload.title, 'Title', 160);
  const slug = text(payload.slug, 'Slug', 100);
  if (!SLUG.test(slug)) throw new Error('Slug may only use lowercase letters, numbers and single hyphens.');
  const date = text(payload.date, 'Date', 10);
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date) throw new Error('Date must be a valid YYYY-MM-DD value.');
  const author = text(payload.author, 'Author', 100);
  const category = text(payload.category, 'Category', 80);
  if (!CATEGORIES.has(category)) throw new Error('Category is not allowed.');
  const content = text(payload.content, 'Content', 50000);
  const excerpt = text(payload.excerpt === undefined ? '' : payload.excerpt, 'Excerpt', 500, { required: false });
  const lang = text(payload.lang === undefined ? 'es' : payload.lang, 'Language', 5);
  if (!['es', 'en'].includes(lang)) throw new Error('Language must be es or en.');
  if (typeof payload.draft !== 'boolean' || typeof payload.featured !== 'boolean') throw new Error('Draft and featured must be boolean values.');
  let thumbnail = '';
  if (payload.thumbnail !== undefined && payload.thumbnail !== '') {
    thumbnail = text(payload.thumbnail, 'Thumbnail', 220);
    if (!/^\/content-media\/admin-[a-f0-9-]+-[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/i.test(thumbnail)) throw new Error('Thumbnail path is invalid.');
  }
  const uploadedMedia = payload.uploadedMedia === thumbnail ? thumbnail : '';
  return { title, slug, date, author, category, content, excerpt, lang, draft: payload.draft, featured: payload.featured, thumbnail, uploadedMedia };
}

async function compensateUploadedMedia(owner, repoName, path, token) {
  if (!path) return false;
  try {
    const file = await getFile(owner, repoName, path.slice(1), token);
    if (!file) return false;
    await deleteFile(owner, repoName, path.slice(1), `Remove unreferenced media ${path.split('/').pop()}`, token, file.sha);
    return true;
  } catch (error) {
    console.error('Media compensation failed', error);
    return false;
  }
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const auth = requireAdmin(event); if (!auth.ok) return auth.response;
  let payload;
  try { payload = validate(JSON.parse(event.body || '')); }
  catch (error) { return json(400, { error: error.message || 'Invalid request.' }); }

  let token, owner, repoName;
  try {
    token = await getInstallationToken();
    const repo = process.env.GITHUB_REPOSITORY;
    if (!/^[^/\s]+\/[^/\s]+$/.test(repo || '')) throw new Error('Repository configuration is invalid.');
    [owner, repoName] = repo.split('/');
    const path = `content/news/${payload.slug}.md`;
    const frontmatter = serializeFrontmatter({ title: payload.title, date: payload.date, author: payload.author, category: payload.category, excerpt: payload.excerpt, draft: payload.draft, featured: payload.featured, lang: payload.lang, thumbnail: payload.thumbnail, layout: 'layouts/news-item.njk', permalink: `/news/${payload.slug}/` });
    const existing = await getFile(owner, repoName, path, token);
    const result = await createOrUpdateFile(owner, repoName, path, Buffer.from(`${frontmatter}\n${payload.content}\n`, 'utf8').toString('base64'), payload.draft ? `Save draft: ${payload.slug}` : `Publish: ${payload.slug}`, token, existing && existing.sha);
    return json(200, { ok: true, commit: result.commit ? result.commit.sha : null, path });
  } catch (error) {
    console.error('news-create failed', error);
    const compensated = token && owner && repoName ? await compensateUploadedMedia(owner, repoName, payload.uploadedMedia, token) : false;
    return json(502, { error: 'The news item could not be saved.', mediaCompensated: compensated });
  }
};
