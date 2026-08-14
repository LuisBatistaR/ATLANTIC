const crypto = require('crypto');
const fetch = globalThis.fetch || require('node-fetch');

function base64UrlEncode(str){
  return Buffer.from(str).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
}

function signJwt(appId, privateKey){
  const header = {alg:'RS256',typ:'JWT'};
  const now = Math.floor(Date.now()/1000);
  const payload = {iat: now-60, exp: now + (10*60), iss: appId};
  const signingInput = base64UrlEncode(JSON.stringify(header))+'.'+base64UrlEncode(JSON.stringify(payload));
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(privateKey,'base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
  return signingInput + '.' + signature;
}

async function getInstallationToken(){
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY && process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g,'\n');
  const installationId = process.env.GITHUB_INSTALLATION_ID;
  if(!appId || !privateKey || !installationId) throw new Error('Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY or GITHUB_INSTALLATION_ID');
  const jwt = signJwt(appId, privateKey);
  const url = `https://api.github.com/app/installations/${installationId}/access_tokens`;
  const res = await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${jwt}`,Accept:'application/vnd.github+json'}});
  if(!res.ok) {
    const text = await res.text();
    throw new Error('Failed to get installation token: '+text);
  }
  const j = await res.json();
  return j.token;
}

async function getFile(owner, repo, path, token){
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,{headers:{Authorization:`token ${token}`,Accept:'application/vnd.github+json'}});
  if(res.status===404) return null;
  if(!res.ok) throw new Error('Get file failed: '+await res.text());
  return await res.json();
}

async function createOrUpdateFile(owner, repo, path, contentBase64, message, token, sha){
  const body = {message,content:contentBase64};
  if(sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,{method:'PUT',headers:{Authorization:`token ${token}`,Accept:'application/vnd.github+json', 'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!res.ok) throw new Error('Create/Update file failed: '+await res.text());
  return await res.json();
}

async function deleteFile(owner, repo, path, message, token, sha) {
  if (!sha) throw new Error('A file SHA is required for deletion');
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'DELETE',
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha })
  });
  if (!res.ok) throw new Error('Delete file failed: ' + await res.text());
  return res.json();
}

module.exports = { getInstallationToken, getFile, createOrUpdateFile, deleteFile };
