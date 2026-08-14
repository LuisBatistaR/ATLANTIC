const api = {
  list: '/.netlify/functions/news-list',
  get: slug => `/.netlify/functions/news-get?slug=${encodeURIComponent(slug)}`,
  create: '/.netlify/functions/news-create',
  upload: '/.netlify/functions/media-upload'
};
const secretKey = 'adc-editorial-admin-secret';
const categories = ['Institucional', 'España', 'Canarias', 'Venezuela', 'Iberoamérica', 'Europa', 'América', 'Democracia', 'Libertad', 'Internacional', 'Sociedad civil', 'Análisis'];
const el = (selector, root = document) => root.querySelector(selector);
const els = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
const getSecret = () => sessionStorage.getItem(secretKey) || '';
const setSecret = value => sessionStorage.setItem(secretKey, value);

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': getSecret(), ...(options.headers || {}) } });
  let data = {};
  try { data = await response.json(); } catch (_) { /* server response is intentionally generic */ }
  if (!response.ok) {
    const error = new Error(data.error || 'No se pudo completar la operación.');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function navigate(route) { history.pushState(null, '', route); renderRoute(); }
function route() { return location.pathname.replace(/^\/admin\/?/, '') || '/'; }
function showMessage(container, message, type = 'error') { container.innerHTML = `<div class="admin-message ${type}">${escapeHtml(message)}</div>`; }

function renderLogin() {
  el('#view').innerHTML = `<section class="login-panel"><h1>Acceso editorial</h1><p>Introduce el secreto de acceso configurado para este entorno.</p><form id="login-form"><label for="admin-secret">Secreto de acceso</label><input id="admin-secret" type="password" autocomplete="current-password" required><button class="primary" type="submit">Entrar</button><p id="login-error" class="form-error" role="alert"></p></form></section>`;
  el('#login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const candidate = el('#admin-secret').value;
    setSecret(candidate);
    try { await request(api.list); renderRoute(); }
    catch (error) { sessionStorage.removeItem(secretKey); el('#login-error').textContent = error.status === 401 ? 'El secreto no es válido.' : 'No se pudo verificar el acceso. Inténtalo de nuevo.'; }
  });
}

async function renderRoute() {
  if (!getSecret()) return renderLogin();
  const current = route();
  if (current.startsWith('/news/new')) return renderEditor();
  if (/^\/news\/[^/]+\/edit$/.test(current)) return renderEditor(current.split('/')[2]);
  if (current.startsWith('/news')) return renderNewsList();
  return renderDashboard();
}

function renderDashboard() {
  el('#view').innerHTML = `<h1>Buenos días.</h1><p>¿Qué quieres publicar?</p><div class="card-grid"><button class="card action-card" data-new><span class="title">+ Nueva noticia</span><span>Crear una nueva pieza editorial</span></button><button class="card action-card" data-news><span class="title">Noticias</span><span>Gestionar publicaciones</span></button><div class="card"><span class="title">Borradores</span><span>Disponibles en Noticias</span></div><div class="card"><span class="title">Publicadas</span><span>Disponibles en Noticias</span></div></div>`;
  els('[data-new]').forEach(button => button.addEventListener('click', () => navigate('/admin/news/new')));
  els('[data-news]').forEach(button => button.addEventListener('click', () => navigate('/admin/news')));
}

async function renderNewsList() {
  const view = el('#view');
  view.innerHTML = `<h1>Noticias</h1><div style="margin:12px 0"><button id="new-btn" class="primary">+ Nueva noticia</button></div><div id="news-list" aria-live="polite">Cargando…</div>`;
  el('#new-btn').addEventListener('click', () => navigate('/admin/news/new'));
  try {
    const news = await request(api.list);
    if (!news.length) return showMessage(el('#news-list'), 'No hay noticias todavía. Crea la primera desde el botón superior.', 'info');
    const rows = news.map(item => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.date)}</td><td>${escapeHtml(item.author)}</td><td>${escapeHtml(item.category)}</td><td>${item.draft ? 'Borrador' : 'Publicado'}</td><td>${item.featured ? 'Sí' : 'No'}</td><td><button data-slug="${escapeHtml(item.slug)}" class="edit-btn">Editar</button></td></tr>`).join('');
    el('#news-list').innerHTML = `<table class="news-list-table"><thead><tr><th>Título</th><th>Fecha</th><th>Autor</th><th>Categoría</th><th>Estado</th><th>Destacada</th><th>Acción</th></tr></thead><tbody>${rows}</tbody></table>`;
    els('.edit-btn').forEach(button => button.addEventListener('click', () => navigate(`/admin/news/${button.dataset.slug}/edit`)));
  } catch (error) {
    if (error.status === 401) { sessionStorage.removeItem(secretKey); return renderLogin(); }
    showMessage(el('#news-list'), error.message);
  }
}

function slugify(value) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100); }
function markdownToText(value) { return String(value || ''); }

async function renderEditor(existingSlug) {
  const view = el('#view');
  view.innerHTML = '<p>Cargando editor…</p>';
  let item = {};
  if (existingSlug) {
    try { item = await request(api.get(existingSlug)); }
    catch (error) { return showMessage(view, error.message); }
  }
  view.innerHTML = `<div class="editor-form"><div class="editor-heading"><div><button id="back-to-news" class="link-button">← Noticias</button><h2>${existingSlug ? 'EDITAR NOTICIA' : 'NUEVA NOTICIA'}</h2></div><div><button id="save-draft" class="primary">Guardar borrador</button> <button id="publish" class="primary">Publicar</button></div></div><p id="form-message" class="form-error" role="alert"></p><div class="field"><label for="title">TÍTULO</label><input id="title" class="input" maxlength="160" value="${escapeHtml(item.title || '')}" required></div><div class="field"><label for="slug">SLUG</label><input id="slug" class="input" maxlength="100" pattern="[a-z0-9]+(-[a-z0-9]+)*" value="${escapeHtml(item.slug || '')}" required></div><div class="field"><label for="date">FECHA</label><input id="date" type="date" class="input" value="${escapeHtml(item.date || new Date().toISOString().slice(0,10))}" required></div><div class="field"><label for="author">AUTOR</label><input id="author" class="input" maxlength="100" value="${escapeHtml(item.author || '')}" required></div><div class="field"><label for="category">CATEGORÍA</label><select id="category" class="input">${categories.map(category => `<option${item.category === category ? ' selected' : ''}>${escapeHtml(category)}</option>`).join('')}</select></div><div class="field"><label for="image-file">IMAGEN PRINCIPAL</label><input id="image-file" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG o WebP; máximo 5 MB.</small></div><div id="image-preview"></div><div class="field"><label for="excerpt">EXTRACTO</label><textarea id="excerpt" maxlength="500">${escapeHtml(item.excerpt || '')}</textarea></div><div class="field"><label for="featured">DESTACADA</label><select id="featured" class="input"><option value="false"${item.featured ? '' : ' selected'}>No</option><option value="true"${item.featured ? ' selected' : ''}>Sí</option></select></div><div class="field"><label for="lang">IDIOMA</label><select id="lang" class="input"><option value="es"${item.lang === 'en' ? '' : ' selected'}>Español</option><option value="en"${item.lang === 'en' ? ' selected' : ''}>English</option></select></div><div class="field"><label for="editor">CONTENIDO</label><textarea id="editor" maxlength="50000" required>${escapeHtml(markdownToText(item.content))}</textarea></div></div>`;
  let uploadedMedia = '';
  const title = el('#title'); const slug = el('#slug');
  title.addEventListener('input', () => { if (!existingSlug || slug.dataset.auto !== 'false') slug.value = slugify(title.value); });
  slug.addEventListener('input', () => { slug.dataset.auto = 'false'; });
  el('#back-to-news').addEventListener('click', () => navigate('/admin/news'));
  el('#image-file').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { el('#form-message').textContent = 'La imagen debe ser JPG, PNG o WebP y no superar 5 MB.'; event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => { el('#image-preview').innerHTML = `<img src="${reader.result}" alt="Vista previa" style="max-width:320px;margin-top:8px">`; el('#image-preview').dataset.base64 = String(reader.result).split(',')[1]; el('#image-preview').dataset.filename = file.name; el('#image-preview').dataset.mime = file.type; };
    reader.readAsDataURL(file);
  });
  el('#save-draft').addEventListener('click', () => submit(true));
  el('#publish').addEventListener('click', () => submit(false));

  async function submit(draft) {
    const message = el('#form-message'); message.textContent = '';
    const payload = { title: title.value, slug: slug.value, date: el('#date').value, author: el('#author').value, category: el('#category').value, excerpt: el('#excerpt').value, featured: el('#featured').value === 'true', lang: el('#lang').value, draft, content: el('#editor').value, thumbnail: item.thumbnail || '' };
    try {
      const preview = el('#image-preview');
      if (preview.dataset.base64) { const upload = await request(api.upload, { method: 'POST', body: JSON.stringify({ filename: preview.dataset.filename, mimeType: preview.dataset.mime, content: preview.dataset.base64 }) }); payload.thumbnail = upload.path; uploadedMedia = upload.path; payload.uploadedMedia = upload.path; }
      await request(api.create, { method: 'POST', body: JSON.stringify(payload) });
      navigate('/admin/news');
    } catch (error) {
      const rollback = error.data && error.data.mediaCompensated ? ' La imagen recién subida se eliminó automáticamente.' : uploadedMedia ? ' La imagen puede haber quedado sin asociar; vuelve a intentarlo o revísala antes de continuar.' : '';
      message.textContent = `${error.message}${rollback}`;
    }
  }
}

document.addEventListener('click', event => { const routeButton = event.target.closest('[data-route]'); if (routeButton) navigate(`/admin${routeButton.dataset.route}`); });
el('#new-article').addEventListener('click', () => getSecret() ? navigate('/admin/news/new') : renderLogin());
els('.menu-item[data-route]').forEach(button => button.addEventListener('click', () => getSecret() ? navigate(`/admin${button.dataset.route}`) : renderLogin()));
el('#settings-btn').addEventListener('click', () => { sessionStorage.removeItem(secretKey); navigate('/admin/'); });
window.addEventListener('popstate', renderRoute);
renderRoute();
