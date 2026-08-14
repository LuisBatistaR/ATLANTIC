const { getInstallationToken } = require('./lib/github');
const { requireAdmin, json } = require('./lib/admin-auth');
const { parseFrontmatter } = require('./lib/frontmatter');

exports.handler = async function(event){
  try{
    if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed.' });
    const auth = requireAdmin(event); if (!auth.ok) return auth.response;
    const token = await getInstallationToken();
    const repo = process.env.GITHUB_REPOSITORY; // owner/repo
    if(!repo) throw new Error('GITHUB_REPOSITORY not set');
    const [owner,repoName] = repo.split('/');
    // list files in content/news
    const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/content/news`,{headers:{Authorization:`token ${token}`,Accept:'application/vnd.github+json'}});
    if(res.status===404){
      return {statusCode:200,body:JSON.stringify([])};
    }
    if(!res.ok) throw new Error('Failed listing: '+await res.text());
    const list = await res.json();
    // filter md files and fetch their content
    const mdFiles = list.filter(i=>i.name.endsWith('.md'));
    const out = [];
    for(const f of mdFiles){
      const fileRes = await fetch(f.url,{headers:{Authorization:`token ${token}`,Accept:'application/vnd.github+json'}});
      if(!fileRes.ok) continue;
      const j = await fileRes.json();
      const content = Buffer.from(j.content,'base64').toString('utf8');
      const { data } = parseFrontmatter(content);
      out.push({title:data.title||f.name.replace('.md',''),slug:f.name.replace('.md',''),date:data.date,author:data.author,category:data.category,draft:data.draft === true,featured:data.featured === true})
    }
    return json(200, out);
  }catch(err){
    console.error('news-list failed', err);
    return json(500, {error:'Unable to load news right now.'});
  }
}
