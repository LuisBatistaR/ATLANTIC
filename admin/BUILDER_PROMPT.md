IMPLEMENTACIÓN — ADC EDITORIAL DESK
===================================

Quiero convertir `/admin` en una APLICACIÓN EDITORIAL REAL del Atlantic Democracy Center.

No quiero que parezca una página web institucional con un formulario.

Quiero una pequeña aplicación web privada, limpia, moderna y editorial, coherente con la identidad visual del Atlantic Democracy Center.

Nombre de la aplicación:

ADC EDITORIAL DESK

Subtítulo:

Sistema editorial del Atlantic Democracy Center

==================================================
1. ARQUITECTURA GENERAL
==================================================

La arquitectura debe ser:

                    ┌─────────────────────┐
                    │   ADC EDITORIAL     │
                    │       DESK          │
                    └──────────┬──────────┘
                               │
                         /admin frontend
                               │
                         Netlify Functions
                               │
                         GitHub App
                               │
                         GitHub repository
                               │
                    ┌──────────┴──────────┐
                    │                     │
              content/news/        content-media/
                    │                     │
                    └──────────┬──────────┘
                               │
                            Netlify
                               │
                            Eleventy
                               │
                         sitio público
```
El repositorio GitHub sigue siendo la fuente de verdad.

Netlify sigue siendo producción.

Eleventy sigue siendo el generador.

NO utilizar:

- Netlify Identity
- Git Gateway
- Decap CMS
- Netlify CMS
- OAuth en esta primera fase
No introducir otro CMS.

==================================================
2. `/admin` DEBE SENTIRSE COMO UNA APP
==================================================

Diseñar `/admin` como dashboard editorial.

Debe tener:

SIDEBAR lateral en desktop.

HEADER superior.

ÁREA PRINCIPAL DE CONTENIDO.

En móvil debe convertirse en una navegación compacta/responsive.

Sidebar:

ADC
EDITORIAL DESK

────────────────

▣ Panel

▤ Noticias

✦ Ideas

◉ Voces

◫ Summit

────────────────

⚙ Configuración

────────────────

Atlantic Democracy Center
Editorial Desk

Por ahora solo debe ser FUNCIONAL la sección:

Noticias

Las demás secciones pueden mostrar:

"Próximamente"

pero deben estar visualmente preparadas para futuras implementaciones.

NO implementes todavía Ideas, Voces ni Summit.

==================================================
3. PANEL PRINCIPAL
==================================================

Dashboard inicial:

"Buenos días."

"¿Qué quieres publicar?"

Mostrar tarjetas:

┌─────────────────────────┐
│ + Nueva noticia         │
│ Crear una nueva pieza   │
│ editorial               │
└─────────────────────────┘

┌─────────────────────────┐
│ Noticias                │
│ 0 publicaciones         │
└─────────────────────────┘

┌─────────────────────────┐
│ Borradores              │
│ 0 borradores             │
└─────────────────────────┘

┌─────────────────────────┐
│ Publicadas              │
│ 0 publicaciones         │
└─────────────────────────┘

Los contadores deben prepararse para poder alimentarse posteriormente desde el repositorio.

==================================================
4. SECCIÓN NOTICIAS
==================================================

Al entrar en:

/admin/news/

mostrar una interfaz editorial tipo gestor de contenidos.

Header:

NOTICIAS

[ + Nueva noticia ]

Debajo:

BUSCAR
[ Buscar noticias... ]

Filtros:

Todas
Publicadas
Borradores
Destacadas

Lista de artículos:

Título
Fecha
Autor
Categoría
Estado
Destacada
Acciones

Cada noticia debe poder:

Editar
Eliminar
Ver

La lectura del contenido existente debe hacerse desde GitHub mediante la capa serverless.

Si actualmente `content/news/` está vacío, mostrar:

"No hay noticias todavía."

y:

"+ Crear primera noticia"

==================================================
5. EDITOR DE NOTICIAS
==================================================

Al pulsar:

- Nueva noticia
abrir:

/admin/news/new/

Esto debe parecer un EDITOR EDITORIAL, no un formulario administrativo genérico.

Header:

← Noticias

NUEVA NOTICIA

Estado:

BORRADOR

Acciones superiores:

[ Guardar borrador ] [ Publicar ]

==================================================
6. CAMPOS DE LA NOTICIA
==================================================

Campos:

TÍTULO

[________________________________]

SLUG

[________________________________]

Debe poder generarse automáticamente desde el título.

FECHA

[ DD / MM / YYYY ]

AUTOR

[________________________________]

CATEGORÍA

Selector:

Institucional
España
Canarias
Venezuela
Iberoamérica
Europa
América
Democracia
Libertad
Internacional
Sociedad civil
Análisis

IMAGEN PRINCIPAL

Debe existir:

[ + Subir imagen ]

Después de seleccionar:

PREVISUALIZACIÓN GRANDE

[ Cambiar imagen ]

La imagen debe poder subirse desde el ordenador.

No queremos que el editor escriba una URL manualmente.

EXTRACTO

Textarea:

[********************************]
[********************************]

DESTACADA

Toggle:

○ No
● Sí

IDIOMA

Selector:

Español
English

==================================================
7. EDITOR DEL ARTÍCULO
==================================================

Necesitamos un editor de contenido cómodo.

No quiero que el usuario tenga que escribir Markdown manualmente.

Debe poder escribir contenido editorial mediante un editor enriquecido.

Como mínimo:

Negrita
Cursiva
Enlaces
Títulos
Listas
Citas
Separadores

Y debe poder escribir artículos largos cómodamente.

El contenido final debe convertirse a Markdown limpio antes de guardarse en:

content/news/<slug>.md

No almacenar HTML gigante dentro del Markdown si puede evitarse.

==================================================
8. IMÁGENES
==================================================

La subida de imágenes debe funcionar así:

EDITOR
 ↓
Selecciona JPG / PNG / WEBP
 ↓
previsualización
 ↓
frontend envía archivo
 ↓
Netlify Function
 ↓
GitHub App
 ↓
content-media/nombre-seguro.ext
 ↓
devuelve ruta
 ↓
la noticia utiliza automáticamente esa ruta

Ejemplo:

thumbnail: "/content-media/atlantic-democracy-freedom.webp"

Validar:

JPG
JPEG
PNG
WEBP

Tamaño máximo inicial:

5 MB

Rechazar otros formatos.

El nombre debe sanitizarse.

Nunca permitir:

../
path traversal
nombres peligrosos
ejecución de archivos

==================================================
9. GITHUB
==================================================

El frontend NO debe tener ningún token.

Toda escritura en GitHub debe pasar por Netlify Functions.

Utilizar una GitHub App.

Variables de entorno:

GITHUB_APP_ID
GITHUB_APP_PRIVATE_KEY
GITHUB_INSTALLATION_ID
GITHUB_REPOSITORY

No colocar ninguna de estas variables en el frontend.

La Function debe:

- autenticar contra GitHub usando la GitHub App;
- crear/actualizar imágenes;
- crear/actualizar Markdown;
- hacer commit en main;
- devolver resultado al frontend.
==================================================
10. PUBLICACIÓN
==================================================

Cuando el editor pulsa:

PUBLICAR

debe ocurrir:

1. Validar campos.
2. Subir imagen si existe.
3. Crear Markdown.
4. Crear/actualizar:
content/news/<slug>.md

1. Commit a main.
2. Netlify detecta el cambio.
3. Netlify ejecuta:
npm run build

1. Eleventy genera:
_site/news/<slug>/index.html

1. La noticia queda disponible públicamente.
Mostrar en el admin:

✓ Publicado correctamente

Commit:
XXXXXXXX

Ruta:

content/news/<slug>.md

[ Ver noticia ]

==================================================
11. BORRADORES
==================================================

Cuando el editor pulsa:

GUARDAR BORRADOR

crear el Markdown con:

draft: true

Cuando pulsa:

PUBLICAR

usar:

draft: false

Los borradores NO deben aparecer en el sitio público.

IMPORTANTE:

Eleventy debe respetar `draft: true`.

No necesitamos todavía ramas Git ni Pull Requests.

El flujo inicial será directo:

ADMIN → GITHUB MAIN → NETLIFY → PUBLICACIÓN

==================================================
12. SEGURIDAD
==================================================

No implementar autenticación insegura.

NO colocar tokens en:

HTML
CSS
JavaScript
localStorage
GitHub repository

Las credenciales viven exclusivamente en variables de entorno de Netlify.

La API debe validar:

- método HTTP
- payload
- slug
- tamaño de archivos
- MIME
- extensiones
- campos permitidos
No devolver nunca secretos al navegador.

==================================================
13. API
==================================================

Crear inicialmente endpoints mínimos.

Por ejemplo:

/api/news
/api/news/create
/api/news/update
/api/news/delete
/api/media/upload

Pero utiliza la estructura que resulte más limpia para Netlify Functions.

No multipliques endpoints innecesariamente.

Debe existir una capa reutilizable para GitHub.

Por ejemplo:

lib/github.js

que gestione:

- autenticación GitHub App
- lectura de archivos
- creación
- actualización
- eliminación
==================================================
14. DISEÑO
==================================================

IDENTIDAD:

Atlantic Democracy Center.

Usar la misma identidad visual existente:

navy
blanco
dorado
tipografía institucional
Inter
Source Serif
Bebas Neue cuando corresponda

Pero el admin debe tener una personalidad propia de herramienta editorial.

Debe sentirse como:

INSTITUCIÓN + REDACCIÓN + HERRAMIENTA PROFESIONAL

No como:

"plantilla de dashboard SaaS".

Evitar exceso de tarjetas, sombras, gradientes, colores chillones y elementos innecesarios.

Mucho espacio en blanco.

Jerarquía tipográfica fuerte.

Interacciones suaves.

Responsive.

==================================================
15. UX
==================================================

Debe ser cómodo para alguien que publica varias veces por semana.

El flujo:

Admin
 ↓
Nueva noticia
 ↓
Título
 ↓
Imagen
 ↓
Extracto
 ↓
Contenido
 ↓
Guardar / Publicar

debe ser rápido.

Mostrar feedback siempre:

Guardando...
Guardado
Publicando...
Publicado
Error al publicar

No dejar al usuario preguntándose si algo funcionó.

==================================================
16. PREVISUALIZACIÓN
==================================================

Antes de publicar debe existir:

[ Vista previa ]

que permita ver aproximadamente cómo quedará la noticia pública.

No necesita ser pixel-perfect todavía.

Pero debe mostrar:

imagen
título
fecha
autor
categoría
extracto
contenido

==================================================
17. FUTURA ARQUITECTURA
==================================================

Construir el código pensando en que posteriormente tendremos:

Noticias
Ideas
Voces
Summit

Todos utilizarán el mismo sistema editorial.

Por tanto:

NO duplicar innecesariamente código.

Crear componentes/reutilizables para:

- Sidebar
- Header
- Status badges
- Upload de imágenes
- Editor
- Botones
- Confirmaciones
- Toasts
- Listados
- GitHub API
- manejo de errores
==================================================
18. NO ROMPER LA WEB PÚBLICA
==================================================

MUY IMPORTANTE:

No modificar visualmente la web pública.

No cambiar:

index.html
styles.css
assets

salvo que sea absolutamente necesario para que las noticias funcionen.

No cambiar el diseño institucional.

No romper:
/
 /news/

El build debe seguir funcionando:

npm run build

==================================================
19. VALIDACIÓN
==================================================

Antes de terminar:

npm run build

debe funcionar.

Comprobar:

_site/index.html
_site/news/index.html
_site/admin/index.html

y comprobar que la home pública sigue funcionando.

Si implementas una Function local, no hagas commits reales a GitHub durante la prueba.

==================================================
20. IMPORTANTE — NO HACER MÁS
==================================================

NO implementar todavía:

- Ideas
- Voces
- Summit
- usuarios
- roles avanzados
- OAuth
- newsletter
- comentarios
- analytics
- buscador
- paginación
- sistema de revisores
- Pull Requests
- programación de publicaciones
La prioridad absoluta es:

# ========================================
ADC EDITORIAL DESK
ADMIN APP
    ↓
CREAR NOTICIA
    ↓
SUBIR FOTO
    ↓
GUARDAR MARKDOWN
    ↓
GITHUB
    ↓
NETLIFY
    ↓
ELEVENTY
    ↓
NOTICIA PUBLICADA
========================================

Antes de implementar, inspecciona el estado actual del proyecto y confirma que esta arquitectura es compatible con lo que ya tenemos.

Si todo está claro, IMPLEMENTA ESTA FASE.

No hagas cambios fuera de este alcance.
