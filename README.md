# Atlantic Democracy Center — Sitio público

Este repositorio contiene la versión estática del sitio web del Atlantic Democracy Center.

- Repositorio fuente: GitHub (rama principal: `main`)
- Entorno de producción: Netlify (sitio: https://atlanticdemocracy.org/)

Estructura relevante:

- `index.html`, `styles.css`, `assets/` — sitio público y recursos.
- `content/` — preparada para contenido editorial futuro:
  - `content/news/`
  - `content/ideas/`
  - `content/voices/`
- `admin/index.html` — página informativa: "ADC Editorial Desk — Sistema editorial en preparación." (sin CMS ni autenticación en esta fase).
- `netlify.toml` — configuración mínima para Netlify (publica la raíz del repositorio).
- `CNAME` y `sitemap.xml` — configuración de dominio y sitemap.

Cómo trabajar localmente:

1. Clona el repositorio y trabaja en la rama `main`.
2. Sirve los archivos estáticos localmente para comprobar cambios:

```bash
python -m http.server 8000 --directory .

# Abrir http://localhost:8000/ en el navegador
```

3. Haz commits y push a la rama `main`. Netlify está conectado al repositorio y desplegará la versión de producción automáticamente según la configuración de Netlify.

Notas importantes:
- GitHub es la fuente de verdad; Netlify gestiona el despliegue a producción. No uses GitHub Pages para producción.
- No hay CMS activo en `admin/` por ahora; `content/` está preparada para archivos markdown que en el futuro podrán transformarse en páginas mediante un generador estático.
- No subir secretos ni tokens al repositorio.
