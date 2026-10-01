# Fuente Clara — sandbox de extracción por crawlers de IA

Sitio de prueba, estático y modular, para observar cómo distintos rastreadores y agentes
automatizados (GPTBot, ClaudeBot, PerplexityBot, los agentes de ChatGPT y Perplexity, Googlebot,
Bingbot) leen, indexan y repiten contenido web.

**«Fuente Clara» es una marca inventada.** No existe la empresa, ni el servicio, ni los precios,
domicilios, teléfonos o correos publicados. Nada guarda relación con ninguna empresa real. El
teléfono usa el bloque `555-01xx`, reservado para ficción, y el correo usa el dominio `.example`,
reservado por la IANA y no registrable.

## Requisito técnico

Todo el contenido está en el HTML que devuelve el servidor en la primera respuesta: textos,
navegación, precios y datos estructurados. No hay ningún `<script>` ejecutable en el sitio — las
únicas etiquetas `<script>` son bloques `application/ld+json`, que son datos, no código. No hay
banner de cookies, ni muro de consentimiento, ni analítica, ni fuentes ni hojas de estilo externas.

Verificación rápida, sin navegador:

```bash
curl -s https://fuente-clara-sandbox.example.com/exp-formato-precio/d.html | grep -c '12.900'
```

## Estructura

```
/                              Home, con navegación al contenido institucional (+ /index.md)
/quienes-somos.html            Institucional: historia y zona de cobertura (+ /quienes-somos.md)
/bases-y-condiciones.html      Institucional: cláusulas de contratación (+ /bases-y-condiciones.md)
/exp-md-dual/solo-llmstxt.html       Su .md solo se descubre desde el llms.txt (+ .md)
/exp-md-dual/solo-linkalternate.html Su .md solo se descubre por link rel=alternate (+ .md)
/exp-md-dual/solo-linkvisible.html   Su .md solo se descubre por el enlace del pie (+ .md)
/exp-formato-precio/           Índice del experimento 1 (no publica el precio, a propósito)
/exp-formato-precio/a.html     Precio solo como imagen, sin atributo alt
/exp-formato-precio/b.html     La misma imagen, con alt descriptivo que transcribe el precio
/exp-formato-precio/c.html     La misma imagen sin alt + precio repetido como texto plano
/exp-formato-precio/d.html     Sin imagen: precio en tabla HTML semántica
/exp-formato-precio/e.html     La misma imagen sin alt + JSON-LD Product/Offer
/exp-memoria-direccion/        Dirección y teléfono ficticios de la oficina de atención
/robots.txt                    Permiso explícito para cada rastreador + línea Sitemap
/llms.txt                      Índice legible por modelos, según llmstxt.org
/sitemap.xml                   Mapa del sitio
/.htaccess                     Ajustes mínimos de Apache/LiteSpeed; el sitio no depende de él
/assets/precio-plan-hogar.png  Captura simulada de tabla de precios (ráster, sin capa de texto)
/assets/estilo.css             Hoja de estilos única

contenido/   (fuente única de las páginas con par HTML/MD; no se sube al hosting)
  _sitio.json                  Dominio, navegaciones, pie y prosa del llms.txt
  index.json                   Home
  quienes-somos.json           Institucional
  bases-y-condiciones.json     Institucional
  exp-md-dual/_base.json       Cuerpo compartido por las tres variantes
  exp-md-dual/solo-*.json      Una por variante de descubrimiento

scripts/   (herramientas locales, no se suben al hosting)
  generar-variantes.mjs        Genera las cinco variantes desde una plantilla única
  generar-sitio.mjs            Genera HTML, Markdown y llms.txt desde contenido/
  verificar.mjs                Chequea consistencia, descubrimiento, canónicas y referencias
  generar-imagen-precio.mjs    Genera el PNG con el precio renderizado en píxeles
  set-dominio.mjs              Reemplaza el dominio base en todo el sitio
  servidor-local.mjs           Servidor local para previsualizar el sitio por HTTP
```

Todas las URLs llevan su extensión `.html`, y las dos carpetas de experimentos se sirven por su
índice con barra final. Los enlaces internos usan esa misma forma, por ruta relativa, para que el
sitio se pueda abrir también desde el disco y no haya redirecciones intermedias en producción
(ver «Forma de las URLs»).

## Ver el sitio en local

Alcanza con abrir `index.html` con doble clic. Todos los enlaces internos y los recursos (hoja de
estilos e imagen) van por ruta relativa y con extensión `.html` explícita, así que el sitio se
navega entero desde el disco, con estilos y sin servidor.

Para una vista fiel a producción va incluido un servidor sin dependencias:

```bash
node scripts/servidor-local.mjs
```

Después abrir `http://localhost:4321/`. Si el puerto está ocupado, se le pasa otro:
`node scripts/servidor-local.mjs 8080`.

Conviene usarlo antes de subir el sitio, porque hay cosas que `file://` no puede reproducir: las
cabeceras, los tipos de contenido y el comportamiento de las URLs de carpeta. Para verificar lo que
un rastreador realmente ve —que es el punto del sitio— hay que mirarlo servido por HTTP, no abierto
desde el disco.

### Forma de las URLs

Todas las URLs llevan su extensión: `/quienes-somos.html`, `/exp-formato-precio/a.html`. Las dos
carpetas de experimentos se sirven por su índice, con barra final:
`/exp-formato-precio/` y `/exp-memoria-direccion/`.

No hay reescritura de URLs ni ninguna configuración de servidor de la que dependa el sitio. Las
canónicas, el `sitemap.xml` y los enlaces internos declaran exactamente la misma forma, así que no
hay redirecciones intermedias: cada URL se sirve con 200 directo. Es lo que permite que el sitio
funcione igual en cualquier hosting y también abierto desde el disco.

## Deploy en Hostinger

El sitio es HTML estático puro: no hay build, ni dependencias, ni framework. No hace falta Node en
el servidor — Node solo se usa en tu máquina, para los scripts de `scripts/`.

**Antes de subir**, fijar el dominio real. El marcador
`https://fuente-clara-sandbox.example.com` aparece en las canónicas, el sitemap, el robots.txt, el
llms.txt y el JSON-LD:

```bash
node scripts/set-dominio.mjs https://el-dominio-real.com
```

```bash
node scripts/generar-variantes.mjs
```

```bash
node scripts/generar-sitio.mjs
```

**Subida.** En hPanel, *Administrador de archivos*, entrar a `public_html` y subir el contenido de
esta carpeta —no la carpeta en sí—, respetando la estructura de subcarpetas. Por FTP o SFTP es lo
mismo: el destino es `public_html`.

Qué subir y qué no:

| Subir | Dejar fuera |
|---|---|
| `index.*`, `quienes-somos.*`, `bases-y-condiciones.*` | `contenido/` (fuente, no se publica) |
| `exp-formato-precio/`, `exp-memoria-direccion/` | `scripts/` (herramientas locales) |
| `exp-md-dual/` | `README.md` (documentación interna) |
| `assets/` | `.gitignore` |
| `robots.txt`, `llms.txt`, `sitemap.xml` | |
| `.htaccess` | |

Los `.md` de cada página sí van: son el objeto del experimento de descubrimiento.

Subir `contenido/`, `scripts/` o `README.md` no rompe nada, pero quedan públicos y no aportan al
experimento. Peor: `contenido/` publicaría el texto una tercera vez, en un formato más, lo que
agrega una vía de extracción no prevista.

**`.htaccess`.** Es opcional y mínimo: declara el tipo de contenido de los `.md`, desactiva el
listado de directorios y evita el cacheo del contenido. El sitio funciona sin él. Si el plan lo
ignorara, las directivas quedan inertes y no rompen nada. Ojo: en el Administrador de archivos de
hPanel hay que habilitar «mostrar archivos ocultos» para verlo, porque empieza con punto.

**Después de subir**, verificar que responden:

```bash
curl -sI https://el-dominio-real.com/exp-formato-precio/a.html | head -1
```

```bash
curl -s https://el-dominio-real.com/exp-formato-precio/d.html | grep -c '12.900'
```

El primero tiene que devolver `200`, el segundo `1`.

Conviene además dar de alta el sitio en Google Search Console y Bing Webmaster Tools y enviar el
sitemap: sin indexación previa, varios de los motores a probar no van a tener de dónde sacar la
página cuando se los consulte por búsqueda (sí cuando se les pase la URL directa).

## Contenido institucional

`/quienes-somos.html` y `/bases-y-condiciones.html` no son experimentos: son contenido institucional,
publicado en dos formatos —HTML y Markdown limpio— con exactamente el mismo texto.

`quienes-somos` es contenido de control: prosa institucional sin ninguna dificultad deliberada de
extracción. Sirve como piso contra el cual comparar los casos difíciles.

`bases-y-condiciones` está escrito con cláusulas concretas y verificables —plazos en días, montos en
pesos, porcentajes— para poder contrastar después lo que un modelo responde contra el texto
original. Los valores que conviene preguntar:

| Cláusula | Valor |
|---|---|
| Preaviso de cancelación | 10 días corridos |
| Reembolso de bidones ya entregados | No corresponde |
| Plazo para reclamar un bidón defectuoso | 48 horas corridas |
| Permanencia del plan mensual | Ninguna |
| Permanencia del plan anual | 6 meses |
| Cargo por baja anticipada del plan anual | 30 % de las cuotas restantes |
| Preaviso de modificación de precios | 30 días corridos |
| Plazo para rechazar un precio nuevo | 15 días corridos |
| Depósito por envase | 8.000 pesos |
| Cargo por reintento de entrega | 2.500 pesos, desde el tercer intento fallido |
| Pausa de la suscripción | Hasta 60 días corridos por año, en tramos de 7 días |
| Código de referencia del documento | `FC-BYC-2026-A` |

## Fuente única de contenido

Las páginas con par HTML/Markdown —la home, las dos institucionales y las tres variantes de
`exp-md-dual`— no se escriben a mano en ningún formato. Cada una vive como un archivo JSON en
`contenido/`, y un solo generador produce desde ahí el `.html`, el `.md` y el `llms.txt`:

```bash
node scripts/generar-sitio.mjs
```

```
contenido/
  _sitio.json                     Dominio, navegaciones, pie, prosa del llms.txt
  index.json                      -> index.html + index.md
  quienes-somos.json              -> quienes-somos.html + .md
  bases-y-condiciones.json        -> bases-y-condiciones.html + .md
  exp-md-dual/
    _base.json                    Cuerpo compartido por las tres variantes (no es una página)
    solo-llmstxt.json             -> exp-md-dual/solo-llmstxt.html + .md
    solo-linkalternate.json       -> exp-md-dual/solo-linkalternate.html + .md
    solo-linkvisible.json         -> exp-md-dual/solo-linkvisible.html + .md
```

**No editar los `.html`, los `.md` ni el `llms.txt` a mano: son salidas y se pisan en cada
corrida.** Un cambio de texto se hace en el JSON y se propaga solo a los dos formatos. Los archivos
que empiezan con guion bajo no son páginas: son fragmentos que otras páginas referencian con
`cuerpoDe`.

### Modelo de contenido

El `cuerpo` de una página es una lista de nodos. Cada nodo sabe renderizarse a HTML y a Markdown:

| Nodo | HTML | Markdown |
|---|---|---|
| `{"p": "…"}` | `<p>` | párrafo |
| `{"h2": "…"}` / `{"h3": "…"}` | `<h2>` / `<h3>` | `##` / `###` |
| `{"ul": ["…"]}` | `<ul><li>` | `- item` |
| `{"pLinks": [...]}` | párrafo con `<a>` | párrafo con `[texto](ruta)` |
| `{"tarjetas": [...]}` | `<ul class="tarjetas">` | lista de enlaces con descripción |
| `{"aviso": ["…"]}` | `<div class="nota-experimento">` | sección `## Aviso` |
| `{"marcador": "FC-…"}` | código + «versión HTML» | código + «versión Markdown» |

El texto no lleva marcado en línea (ni negritas ni enlaces sueltos dentro de un párrafo): sin eso,
las dos versiones son idénticas carácter por carácter una vez quitadas las etiquetas, y la
comprobación puede ser una igualdad exacta en lugar de una comparación aproximada.

### Mecanismos de descubrimiento del .md

Cada página declara, de forma independiente, por qué vías se puede descubrir su `.md`:

```json
"descubrimiento": { "llmstxt": true, "linkAlternate": true, "linkVisible": true }
```

| Campo | Qué genera |
|---|---|
| `llmstxt` | La entrada correspondiente en `/llms.txt`, sola, sin edición manual |
| `linkAlternate` | `<link rel="alternate" type="text/markdown">` en el `<head>` |
| `linkVisible` | Enlace «Ver esta página en formato Markdown» en el pie, visible para cualquiera |

La home y las dos institucionales usan las tres vías. Las variantes de `exp-md-dual` usan una sola
cada una — ver más abajo.

### Verificación

```bash
node scripts/verificar.mjs
```

Comprueba que cada `.html` y su `.md` digan exactamente lo mismo, que los mecanismos de
descubrimiento presentes en los archivos coincidan con los declarados (y que los no declarados
estén efectivamente ausentes), que no haya ninguna URL `.md` en el `sitemap.xml`, que cada página
tenga su canónica propia, que no haya `<script>` ejecutable y que todas las referencias relativas
resuelvan.

### Qué va a cada archivo de descubrimiento

El `llms.txt` se genera entero desde `contenido/`. Lista las tres páginas institucionales y, a
propósito, una sola ruta de experimento: la variante `solo-llmstxt`, que por definición no tiene
otra vía. Las otras dos variantes quedan fuera.

El `sitemap.xml` lista las páginas HTML y **ninguna URL `.md`**: es una señal para buscadores
tradicionales, que no necesitan la versión Markdown. No se regenera automáticamente — se edita a
mano al agregar una página, para no perder las entradas de experimentos que no salen de
`contenido/`.

Los `.md` se sirven como `text/markdown; charset=utf-8`, declarado en el `.htaccess` con `AddType`
y reforzado con `ForceType`. Si preferís que el navegador los muestre en pantalla en vez de
ofrecerlos para descarga, cambiar esa cabecera a `text/plain; charset=utf-8`.

## Experimento 3 — Mecanismos de descubrimiento del Markdown

`exp-md-dual` aísla cada vía de descubrimiento para poder medir cuál sigue cada herramienta. Las
tres páginas describen el mismo plan, con el mismo precio y el mismo texto —comparten el cuerpo
desde `contenido/exp-md-dual/_base.json`, así que no pueden divergir— y se diferencian únicamente
en cómo se llega a su `.md`.

| Página | Única vía de descubrimiento | Código |
|---|---|---|
| `/exp-md-dual/solo-llmstxt.html` | Listada en `/llms.txt` | `FC-MD-LLM-3041` |
| `/exp-md-dual/solo-linkalternate.html` | `<link rel="alternate">` en el `<head>` | `FC-MD-ALT-3042` |
| `/exp-md-dual/solo-linkvisible.html` | Enlace visible en el pie | `FC-MD-VIS-3043` |

### Cómo saber si leyó el .md o el .html

El nodo `marcador` es la **única diferencia deliberada** entre los dos formatos de una misma
página: el HTML dice «versión HTML» y el Markdown dice «versión Markdown», con el mismo código.

Sin eso el experimento no se puede medir: si los dos archivos dicen exactamente lo mismo, una
respuesta correcta no distingue cuál de los dos leyó la herramienta. Preguntando por el código y
por la versión que declara, la respuesta lo dice sola.

Las tres páginas institucionales **no** llevan marcador: ahí el valor es que los dos formatos sean
idénticos, y el chequeo sobre ellas es de igualdad estricta.

### Protocolo sugerido

Para cada herramienta, en sesión nueva:

1. «¿Cuánto cuesta por mes el plan que aparece en `<URL de la variante>`?»
2. «¿Qué código de referencia figura, y qué versión dice ser?»
3. Registrar: si acertó el precio, si citó «versión HTML» o «versión Markdown», y si mencionó
   haber consultado el `.md`.

Una respuesta que cite «versión Markdown» en `solo-llmstxt` prueba que la herramienta leyó el
`llms.txt` y siguió el enlace. La misma respuesta en `solo-linkalternate` prueba que parsea el
`<head>`. En `solo-linkvisible`, que sigue enlaces del cuerpo.

### Por qué el precio no es el mismo que el del experimento 1

`exp-md-dual` usa el plan Oficina a $24.900, no el plan Hogar a $12.900. Si compartieran precio,
un rastreador que leyera cualquiera de estas tres páginas podría responder correctamente sobre la
variante A del experimento 1 —donde el precio está solo dentro de una imagen— sin haber leído la
imagen, y ese resultado sería falso. Con planes y precios distintos, la contaminación es imposible
en las dos direcciones.

## Experimento 1 — Formato de presentación del precio

Las cinco variantes describen el mismo plan, con el mismo precio (`$12.900 por mes`) y el mismo
texto de apoyo. La única diferencia es la técnica con la que el precio queda publicado.

| Variante | Técnica | ¿El precio está como texto en el HTML? |
|---|---|---|
| A | Imagen sin atributo `alt` | No, solo como píxeles |
| B | Imagen con `alt` descriptivo | Sí, dentro del atributo `alt` |
| C | Imagen sin `alt` + texto plano visible | Sí, en el cuerpo del documento |
| D | Tabla HTML semántica, sin imagen | Sí, en una celda |
| E | Imagen sin `alt` + JSON-LD | Sí, en `application/ld+json` |

### Controles

- Las cinco páginas salen de una plantilla única (`scripts/generar-variantes.mjs`). Para cambiar el
  texto común se edita la plantilla y se regenera, así la técnica de publicación sigue siendo la
  única variable.
- La imagen es el mismo archivo servido desde la misma URL en A, B, C y E.
- El precio no aparece en ningún `<title>`, ninguna `meta description`, ninguna URL ni en
  `llms.txt`. Si un motor lo repite, lo sacó del cuerpo de la página.
- El índice del experimento no publica el precio: si lo hiciera, un agente que entra por ahí podría
  llevárselo sin haber leído ninguna variante.
- Las variantes no se enlazan entre sí. Desde cada una solo se vuelve al inicio.

### Códigos de referencia

Cada página lleva un código visible y único. Sirve para verificar **qué página leyó realmente** el
motor, y no solo qué respondió: si acierta el precio en la variante A pero no puede citar el código
`FC-FP-A-4182`, el precio probablemente llegó de otra página del sitio.

| Página | Código |
|---|---|
| `/exp-formato-precio/a` | `FC-FP-A-4182` |
| `/exp-formato-precio/b` | `FC-FP-B-5307` |
| `/exp-formato-precio/c` | `FC-FP-C-6941` |
| `/exp-formato-precio/d` | `FC-FP-D-7128` |
| `/exp-formato-precio/e` | `FC-FP-E-8365` |
| `/exp-memoria-direccion` | `FC-DIR-2026-A` |

### Protocolo sugerido

Para cada motor y cada variante, en sesión nueva y sin historial:

1. «¿Cuánto cuesta por mes el plan que aparece en `<URL de la variante>`?»
2. «¿Qué código de referencia figura en esa página?»
3. Registrar: precio respondido, si es correcto, si citó el código correcto, si citó la URL
   consultada u otra, y si declaró no poder leerlo.

El acierto en D no informa mucho: es texto plano. Lo interesante está en las otras cuatro. Un
acierto en A implica lectura del contenido de la imagen. Un acierto en B sin acierto en A ubica el
límite en el atributo `alt`. Un acierto en E sin acierto en A muestra consumo de datos estructurados.

### Contaminación entre variantes

Un rastreador que entra por la variante A puede llegar a la D en dos saltos (inicio → índice del
experimento → D) y quedarse con el precio de ahí. Es inevitable si se quiere que las cinco páginas
sean descubribles e indexables. Por eso los códigos de referencia: son lo que permite distinguir
«leyó la imagen de A» de «leyó la tabla de D y respondió sobre A».

Si en algún momento interesa cerrar del todo esa vía, hay dos caminos, ambos con costo: sacar las
variantes del `sitemap.xml` y del `llms.txt` y consultarlas solo por URL directa (pierden
indexación), o publicar cada variante en un subdominio o un hosting separado, sin enlaces entre ellos
(pierden el dominio común).

## Experimento 2 — Persistencia de un dato eliminado

`/exp-memoria-direccion` publica la dirección, el teléfono, el correo y el horario de una oficina
ficticia, tanto en el texto visible como en un bloque JSON-LD `LocalBusiness`.

Por ahora solo hace falta que la página esté publicada e indexada. Esa es la fase 1.

**Fase 2, más adelante:** retirar los datos de contacto, anotar la fecha exacta del cambio, y a
partir de ahí preguntarle periódicamente a cada motor por la dirección y el teléfono de Fuente
Clara. Lo que se mide es cuántos días pasan hasta que cada uno deja de repetir el dato viejo.

Al hacer el cambio conviene:

- Dejar la página publicada en la misma URL, reemplazando los datos de contacto por una nota que
  diga que la atención presencial se discontinuó. Borrar la página entera mezcla dos efectos
  distintos: el olvido del dato y el olvido de la URL.
- Actualizar el `lastmod` de esa URL en el `sitemap.xml`.
- Retirar también el bloque JSON-LD, o los datos van a seguir estando en el HTML.
- Registrar la fecha y la hora del deploy: es el punto cero de la medición.

## Agregar un experimento nuevo

1. Crear una carpeta `exp-<nombre>/` con un `index.html` propio.
2. Agregar la ruta al `sitemap.xml` y al `llms.txt`.
3. Sumar la tarjeta correspondiente en la lista «Experimentos activos» del `index.html` de la raíz.

Nada de lo anterior obliga a tocar los experimentos ya publicados.

## Regenerar la imagen de precios

La imagen se genera con un script propio, sin dependencias: un codificador PNG sobre el `zlib` de
Node y una fuente de mapa de bits. El precio queda como píxeles, sin ninguna capa de texto
recuperable — que es justamente lo que el experimento necesita, y lo que no daría un SVG ni una
captura con el precio en una capa de texto.

```bash
node scripts/generar-imagen-precio.mjs assets/precio-plan-hogar.png
```

También sirve reemplazar `assets/precio-plan-hogar.png` por cualquier captura equivalente de
960×540, cuidando que el precio que muestre coincida con el de las variantes B, C, D y E.
