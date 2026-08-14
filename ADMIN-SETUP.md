# ADMIN-SETUP.md

Guía en español para configurar el panel editorial `/admin/` del Atlantic Democracy Center.

Resumen
- Panel: `/admin/` (estático)
- CMS: Decap/Netlify CMS (plantilla). Preferencia por Decap; la configuración funciona también con Netlify CMS.
- Objetivo: permitir gestionar `news`, `ideas`, `voices`, `initiatives`, `summit` guardando contenido en `content/`.

Archivos creados
- `admin/index.html` — interfaz del panel (carga del CMS desde CDN).
- `admin/config.yml` — plantilla de configuración del CMS (NO contiene secretos).
- `admin/styles.css` — estilos del panel.
- `content/...` — colecciones demo: `news`, `ideas`, `voices`, `initiatives` (README) y `summit`.
- `content-media/` — carpeta vacía para medios editoriales (no mezclar con `/assets/`).

Requisitos externos y seguridad
- NO subir client secrets ni Personal Access Tokens al repositorio.
- Para activar el login con GitHub existen dos opciones seguras recomendadas:
  1) Preferida (más sencilla si aceptas un servicio externo): Hospedar el sitio en Netlify y usar Netlify Identity + Git Gateway. Netlify gestiona la autenticación y evita exponer secretos en el frontend.
  2) Si quieres mantener GitHub Pages: Registrar una GitHub OAuth App y usar el backend `github` de Decap/Netlify CMS. Para ello debes:
     - Crear una OAuth App en https://github.com/settings/developers con callback a `https://atlanticdemocracy.org/admin/` (o la URL de despliegue temporal).
     - NO subir el `client_secret` al repo. El flujo implicará configurar el `client_id` en el despliegue o en un proxy de autenticación.

Qué hacer para activar el panel (opción Netlify — recomendada)
Qué hacer para activar el panel (opción Netlify — recomendada)
1. Crear una cuenta en Netlify y conectar el repositorio GitHub.
2. Desplegar la rama `main` en Netlify (el sitio público seguirá siendo estático). Conserva el `CNAME` si quieres mantener `atlanticdemocracy.org`.
3. En Netlify: Settings → Identity → Enable Identity. En "Registration preferences" selecciona "Invite only" si quieres controlar usuarios.
4. En Identity, activar "Git Gateway" (Service configuration). Netlify gestionará el token de Git Gateway de forma segura; NO subas tokens al repositorio.
5. Comprobar que `admin/config.yml` tiene `backend.name: git-gateway` y `publish_mode: editorial_workflow` (ya actualizado en el repo).
6. He añadido `netlify.toml` a la raíz del proyecto para facilitar el deploy y una redirección básica de `/admin`.
7. Para probar el flujo de Identity con tus credenciales Netlify, usa `netlify-cli` y el comando `netlify dev` (requiere iniciar sesión en Netlify CLI y conectar el sitio).

Notas prácticas:
- Una vez Identity + Git Gateway estén activos, invita usuarios desde Netlify → Identity → Invite users. Los usuarios recibirán un correo y podrán iniciar sesión en `/admin/`.
- Netlify manejará commits al repositorio cuando publiques desde el CMS; el historial seguirá en `main`.

Qué hacer para activar el panel (opción GitHub Pages)
1. Registrar una GitHub OAuth App en: https://github.com/settings/developers → OAuth Apps → New OAuth App.
   - Application name: Atlantic Democracy Center Editorial Desk
   - Homepage URL: https://atlanticdemocracy.org/
   - Authorization callback URL: https://atlanticdemocracy.org/admin/
2. Anota el `Client ID`. NO subas el `Client Secret` al repositorio.
3. Netlify CMS (Decap) necesita un proxy o configuración para usar el `client_id`/`client_secret` de forma segura. Sin un proxy público, el flujo no completará la autorización segura desde GitHub Pages.
4. Si no quieres usar Netlify, prepara un pequeño servicio de OAuth (proxy) que mantenga el `client_secret` fuera del repo y actúe como endpoint de autorización. Documentaríamos el endpoint exacto en el `admin/config.yml` (campo `auth_endpoint`).

Configuración mínima en `admin/config.yml`
- Rellena `backend.repo` con `TU_USUARIO/TU_REPO`.
- No incluyas `client_secret` en este archivo.
- Activa `publish_mode: editorial_workflow` (ya incluido en la plantilla).

Flujo editorial y testing local
1. Para probar localmente sin OAuth: sirve la carpeta `admin/` estática y revisa la interfaz; el login no funcionará hasta activar Identity/Git Gateway.
2. Para pruebas con Netlify Identity localmente, instala `netlify-cli` y ejecuta:

```bash
# instalar netlify-cli (si no lo tienes)
npm install -g netlify-cli

# iniciar sesión en tu cuenta Netlify
netlify login

# en la raíz del proyecto, ejecutar (con el sitio ya conectado a la cuenta Netlify):
netlify dev

# abrir http://localhost:8888/admin/ (o la URL que indique netlify-cli)
```

3. Alternativa simple (sin login):

```bash
# Servir contenido estático con Python (ejemplo):
python -m http.server 8000 --directory .

# Luego abre http://localhost:8000/admin/ en el navegador (la UI carga, pero no permite publicar sin Auth)
```

Publicación en GitHub Pages
1. Añade los archivos creados y commitea en `main`.
2. Si usas GitHub Pages, sube a `main` y activa Pages desde la rama `main`.
3. Configura la OAuth App en GitHub (si vas por esa vía) con callback a `https://atlanticdemocracy.org/admin/`.

Próximos pasos recomendados (yo lo puedo hacer)
- Si quieres: configurar la integración con Netlify Identity y probar el flujo (requiere acceso a la cuenta Netlify).
- Alternativamente: te guío para registrar la GitHub OAuth App y dejar el `client_id` en un lugar seguro del desplegado.

Advertencias de seguridad
- NO almacenar nunca `client_secret`, PATs ni claves en el repositorio.
- Si decides usar un proxy OAuth, el proxy debe alojarse fuera del repositorio y sus secretos como variables de entorno.
