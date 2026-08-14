const { getInstallationToken, getFile } = require('./lib/github');
const { requireAdmin, json } = require('./lib/admin-auth');
const { parseFrontmatter } = require('./lib/frontmatter');

exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed.' });
  const auth = requireAdmin(event); if (!auth.ok) return auth.response;
  try {
    const slug = event.queryStringParameters && event.queryStringParameters.slug;
    if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return json(400, { error: 'Invalid slug.' });
    const repo = process.env.GITHUB_REPOSITORY;
    if (!/^[^/\s]+\/[^/\s]+$/.test(repo || '')) throw new Error('Repository configuration is invalid.');
    const [owner, repoName] = repo.split('/');
    const file = await getFile(owner, repoName, `content/news/${slug}.md`, await getInstallationToken());
    if (!file) return json(404, { error: 'News item not found.' });
    const source = Buffer.from(file.content, 'base64').toString('utf8');
    const { data, content } = parseFrontmatter(source);
    return json(200, { ...data, slug, content });
  } catch (error) {
    console.error('news-get failed', error);
    return json(500, { error: 'Unable to load this news item.' });
  }
};
